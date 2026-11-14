import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Hanya pembeli yang dapat menyimpan favorit' }, { status: 403 });
    }

    const body = await request.json();
    const productId = Number(body.product_id);

    if (!productId) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 });
    }

    await query(
      `INSERT INTO wishlists (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [user.id, productId]
    );

    return NextResponse.json({ success: true, message: 'Produk ditambahkan ke favorit' });
  } catch (error) {
    console.error('Add wishlist error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan ke favorit' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Hanya pembeli yang dapat mengelola favorit' }, { status: 403 });
    }

    const body = await request.json();
    const productId = Number(body.product_id);

    if (!productId) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 });
    }

    await query(
      `DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2`,
      [user.id, productId]
    );

    return NextResponse.json({ success: true, message: 'Produk dihapus dari favorit' });
  } catch (error) {
    console.error('Delete wishlist error:', error);
    return NextResponse.json({ error: 'Gagal menghapus dari favorit' }, { status: 500 });
  }
}
