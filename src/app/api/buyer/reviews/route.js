import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  order_item_id: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1, 'Rating minimal 1 bintang').max(5, 'Rating maksimal 5 bintang'),
  comment: z.string().trim().max(500, 'Komentar maksimal 500 karakter').default(''),
});

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Akses ditolak, hanya pembeli yang dapat memberi ulasan' }, { status: 403 });
    }

    const body = await request.json();
    const validated = reviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Data ulasan tidak valid', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { order_item_id, rating, comment } = validated.data;

    // Pastikan order_item ada, pesanan milik user ini, dan statusnya 'completed'
    const itemRes = await query(
      `SELECT oi.id, oi.product_id, o.buyer_id, o.status
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id = $1`,
      [order_item_id]
    );

    if (itemRes.rows.length === 0) {
      return NextResponse.json({ error: 'Barang pesanan tidak ditemukan' }, { status: 404 });
    }

    const item = itemRes.rows[0];

    if (item.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Anda bukan pembeli barang ini' }, { status: 403 });
    }

    if (item.status !== 'completed') {
      return NextResponse.json({ error: 'Ulasan hanya dapat diberikan setelah pesanan berstatus Selesai' }, { status: 400 });
    }

    // Cek apakah sudah pernah diulas
    const existingRes = await query(
      'SELECT id FROM reviews WHERE order_item_id = $1',
      [order_item_id]
    );

    if (existingRes.rows.length > 0) {
      return NextResponse.json({ error: 'Barang ini sudah pernah Anda ulas sebelumnya' }, { status: 400 });
    }

    // Insert ulasan
    const insRes = await query(
      `INSERT INTO reviews (order_item_id, product_id, buyer_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [order_item_id, item.product_id, user.id, rating, comment || '']
    );

    return NextResponse.json({
      success: true,
      message: 'Terima kasih atas ulasanmu! ⭐',
      reviewId: insRes.rows[0].id,
    }, { status: 201 });
  } catch (err) {
    console.error('Submit review error:', err);
    return NextResponse.json({ error: 'Gagal mengirim ulasan' }, { status: 500 });
  }
}
