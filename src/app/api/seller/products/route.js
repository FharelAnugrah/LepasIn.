import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { extractAndProcessImages } from '@/lib/image-util';

export const dynamic = 'force-dynamic';

const priceValidator = z
  .union([z.string(), z.number()])
  .refine(
    (val) => {
      const str = String(val).trim();
      return str !== '';
    },
    { message: 'Harga lepas wajib diisi.' }
  )
  .refine(
    (val) => {
      const str = String(val).trim();
      return !/^0\d+/.test(str);
    },
    {
      message: 'Harga lepas tidak boleh diawali dengan angka 0 (contoh: 050000). Masukkan nominal yang valid tanpa awalan 0.',
    }
  )
  .transform((val) => Number(val))
  .pipe(
    z
      .number({ invalid_type_error: 'Harga lepas harus berupa angka.' })
      .int('Harga lepas harus berupa angka bulat.')
      .min(1000, 'Harga lepas minimal Rp 1.000 dan tidak boleh bernilai Rp 0.')
      .max(100000000, 'Harga lepas maksimal Rp 100.000.000.')
  );

const originalPriceValidator = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (val === undefined || val === null || val === '') return true;
      const str = String(val).trim();
      return !/^0\d+/.test(str);
    },
    {
      message: 'Harga coret tidak boleh diawali dengan angka 0 (contoh: 050000). Masukkan nominal yang valid tanpa awalan 0.',
    }
  )
  .transform((val) => (val === undefined || val === null || val === '' ? null : Number(val)))
  .pipe(
    z
      .number({ invalid_type_error: 'Harga coret harus berupa angka.' })
      .int('Harga coret harus berupa angka bulat.')
      .min(1000, 'Harga coret minimal Rp 1.000 dan tidak boleh bernilai Rp 0.')
      .max(100000000, 'Harga coret maksimal Rp 100.000.000.')
      .optional()
      .nullable()
  );

const stockValidator = z
  .union([z.string(), z.number()])
  .refine(
    (val) => {
      const str = String(val).trim();
      return !/^0\d+/.test(str);
    },
    {
      message: 'Jumlah stok tidak boleh diawali dengan angka 0 (contoh: 05).',
    }
  )
  .transform((val) => Number(val))
  .pipe(
    z
      .number({ invalid_type_error: 'Stok harus berupa angka.' })
      .int('Stok harus berupa bilangan bulat.')
      .min(0, 'Stok minimal 0.')
  )
  .default(1);

const productSchema = z
  .object({
    name: z.string().trim().min(3, 'Nama barang minimal 3 karakter').max(150, 'Nama barang maksimal 150 karakter'),
    description: z.string().trim().min(10, 'Deskripsi minimal 10 karakter'),
    price: priceValidator,
    original_price: originalPriceValidator,
    stock: stockValidator,
    condition: z.enum(['like_new', 'good', 'fair', 'minor_defect']),
    category_id: z.coerce.number().int().positive('Kategori wajib dipilih'),
    image_urls: z.array(z.string().trim().min(1, 'Path/Data foto tidak valid')).min(1, 'Mohon unggah minimal 1 foto barang.').max(5, 'Maksimal 5 gambar'),
  })
  .refine(
    (data) => {
      if (data.original_price && data.price) {
        return data.original_price > data.price;
      }
      return true;
    },
    {
      message: 'Harga coret harus lebih besar dari harga lepas (contoh: harga asli Rp 120.000, harga lepas Rp 50.000).',
      path: ['original_price'],
    }
  );

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'seller' || user.seller_status !== 'approved') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const storeRes = await query('SELECT id FROM stores WHERE user_id = $1', [user.id]);
    const store = storeRes.rows[0];
    if (!store) {
      return NextResponse.json({ error: 'Toko belum terdaftar' }, { status: 404 });
    }

    const productsRes = await query(
      `SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition, p.created_at,
              c.name AS category_name,
              (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.store_id = $1
       ORDER BY p.created_at DESC`,
      [store.id]
    );

    return NextResponse.json({ products: productsRes.rows });
  } catch (err) {
    console.error('Fetch seller products error:', err);
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'seller' || user.seller_status !== 'approved') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const storeRes = await query('SELECT id FROM stores WHERE user_id = $1', [user.id]);
    const store = storeRes.rows[0];
    if (!store) {
      return NextResponse.json({ error: 'Toko belum terdaftar' }, { status: 404 });
    }

    let payload = {};
    let imageUrls = [];

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      payload = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        original_price: formData.get('original_price'),
        stock: formData.get('stock'),
        condition: formData.get('condition'),
        category_id: formData.get('category_id'),
      };
      imageUrls = await extractAndProcessImages(formData);
    } else {
      payload = await request.json();
      imageUrls = await extractAndProcessImages(payload);
    }

    payload.image_urls = imageUrls;

    const validated = productSchema.safeParse(payload);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)[0]?.[0] || 'Validasi form gagal';
      return NextResponse.json(
        { error: firstError, details: fieldErrors },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      price,
      original_price,
      stock,
      condition,
      category_id,
      image_urls,
    } = validated.data;

    const productId = await withTransaction(async (client) => {
      const insRes = await client.query(
        `INSERT INTO products (
          store_id, category_id, name, description, price, original_price, stock, condition
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          store.id,
          category_id,
          name,
          description,
          price,
          original_price || null,
          stock,
          condition,
        ]
      );

      const pid = insRes.rows[0].id;

      for (let i = 0; i < image_urls.length; i++) {
        await client.query(
          `INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)`,
          [pid, image_urls[i], i]
        );
      }

      return pid;
    });

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil ditambahkan!',
      id: productId,
    }, { status: 201 });
  } catch (err) {
    console.error('Create product error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menambahkan produk' },
      { status: err.message?.includes('Ukuran foto') || err.message?.includes('Format file') ? 400 : 500 }
    );
  }
}
