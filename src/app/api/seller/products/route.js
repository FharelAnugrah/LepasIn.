import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const productSchema = z.object({
  name: z.string().trim().min(3, 'Nama barang minimal 3 karakter').max(150, 'Nama barang maksimal 150 karakter'),
  description: z.string().trim().min(10, 'Deskripsi minimal 10 karakter'),
  price: z.coerce.number().int().min(1000, 'Harga minimal Rp 1.000'),
  original_price: z.coerce.number().int().min(1000, 'Harga coret minimal Rp 1.000').optional().nullable(),
  stock: z.coerce.number().int().min(0, 'Stok minimal 0').default(1),
  condition: z.enum(['like_new', 'good', 'fair', 'minor_defect']),
  category_id: z.coerce.number().int().positive('Kategori wajib dipilih'),
  image_urls: z.array(z.string().trim().url('URL gambar tidak valid')).max(5, 'Maksimal 5 gambar').default([]),
});

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

    const body = await request.json();
    const validated = productSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validasi form gagal', details: validated.error.flatten().fieldErrors },
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
    return NextResponse.json({ error: 'Gagal menambahkan produk' }, { status: 500 });
  }
}
