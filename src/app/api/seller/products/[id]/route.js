import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const updateProductSchema = z.object({
  name: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().min(10).optional(),
  price: z.coerce.number().int().min(1000).optional(),
  original_price: z.coerce.number().int().min(1000).optional().nullable(),
  stock: z.coerce.number().int().min(0).optional(),
  condition: z.enum(['like_new', 'good', 'fair', 'minor_defect']).optional(),
  category_id: z.coerce.number().int().positive().optional(),
  image_urls: z.array(z.string().trim().url()).max(5).optional(),
});

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'seller' || user.seller_status !== 'approved') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const productId = Number(id);

    const storeRes = await query('SELECT id FROM stores WHERE user_id = $1', [user.id]);
    const store = storeRes.rows[0];
    if (!store) return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });

    const prodRes = await query(
      `SELECT p.id, p.name, p.description, p.price, p.original_price, p.stock, p.condition, p.category_id,
              c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1 AND p.store_id = $2`,
      [productId, store.id]
    );

    if (prodRes.rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    const imagesRes = await query(
      `SELECT id, url, position FROM product_images WHERE product_id = $1 ORDER BY position ASC`,
      [productId]
    );

    return NextResponse.json({
      product: prodRes.rows[0],
      images: imagesRes.rows,
    });
  } catch (err) {
    console.error('Get product detail error:', err);
    return NextResponse.json({ error: 'Gagal memuat detail produk' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'seller' || user.seller_status !== 'approved') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const productId = Number(id);

    const storeRes = await query('SELECT id FROM stores WHERE user_id = $1', [user.id]);
    const store = storeRes.rows[0];
    if (!store) return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });

    // Cek produk milik toko
    const checkRes = await query(
      'SELECT id FROM products WHERE id = $1 AND store_id = $2',
      [productId, store.id]
    );
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateProductSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;

    await withTransaction(async (client) => {
      const updates = [];
      const values = [];
      let idx = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${idx++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${idx++}`);
        values.push(data.description);
      }
      if (data.price !== undefined) {
        updates.push(`price = $${idx++}`);
        values.push(data.price);
      }
      if (data.original_price !== undefined) {
        updates.push(`original_price = $${idx++}`);
        values.push(data.original_price);
      }
      if (data.stock !== undefined) {
        updates.push(`stock = $${idx++}`);
        values.push(data.stock);
      }
      if (data.condition !== undefined) {
        updates.push(`condition = $${idx++}`);
        values.push(data.condition);
      }
      if (data.category_id !== undefined) {
        updates.push(`category_id = $${idx++}`);
        values.push(data.category_id);
      }

      if (updates.length > 0) {
        values.push(productId);
        values.push(store.id);
        await client.query(
          `UPDATE products SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx++} AND store_id = $${idx++}`,
          values
        );
      }

      // Perbarui foto bila ada
      if (data.image_urls !== undefined) {
        await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
        for (let i = 0; i < data.image_urls.length; i++) {
          await client.query(
            `INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)`,
            [productId, data.image_urls[i], i]
          );
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Produk berhasil diperbarui!' });
  } catch (err) {
    console.error('Update product error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'seller' || user.seller_status !== 'approved') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const productId = Number(id);

    const storeRes = await query('SELECT id FROM stores WHERE user_id = $1', [user.id]);
    const store = storeRes.rows[0];
    if (!store) return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });

    const delRes = await query(
      `DELETE FROM products WHERE id = $1 AND store_id = $2 RETURNING id`,
      [productId, store.id]
    );

    if (delRes.rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan atau bukan milik Anda' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error('Delete product error:', err);
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
