import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = Number(id);

    const body = await request.json();
    const quantity = Number(body.quantity);

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Jumlah minimal 1' }, { status: 400 });
    }

    // Cek kepemilikan cart item dan ketersediaan stok
    const checkRes = await query(
      `SELECT ci.id, ci.product_id, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [cartItemId, user.id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Item keranjang tidak ditemukan' }, { status: 404 });
    }

    const item = checkRes.rows[0];
    if (quantity > item.stock) {
      return NextResponse.json(
        { error: `Jumlah melebihi sisa stok (${item.stock} item)` },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING id, quantity`,
      [quantity, cartItemId]
    );

    return NextResponse.json({
      success: true,
      item: result.rows[0],
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui jumlah' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
    }

    const { id } = await params;
    const cartItemId = Number(id);

    const result = await query(
      `DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id`,
      [cartItemId, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Item keranjang tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Item berhasil dihapus dari keranjang',
    });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Gagal menghapus item' }, { status: 500 });
  }
}
