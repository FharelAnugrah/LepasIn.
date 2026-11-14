import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query, withTransaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const updateStatusSchema = z.object({
  status: z.enum(['processing', 'shipped', 'completed', 'cancelled']),
});

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'seller' || user.seller_status !== 'approved') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = Number(id);

    if (!orderId) {
      return NextResponse.json({ error: 'ID pesanan tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Status yang diminta tidak valid' }, { status: 400 });
    }

    const { status: newStatus } = validated.data;

    // Ambil order dan verifikasi kepemilikan toko
    const orderRes = await query(
      `SELECT o.id, o.store_id, o.status, s.user_id
       FROM orders o
       JOIN stores s ON s.id = o.store_id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const order = orderRes.rows[0];

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Anda bukan pemilik toko untuk pesanan ini' }, { status: 403 });
    }

    // Validasi alur transisi status
    const currentStatus = order.status;
    const validTransitions = {
      pending_payment: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['completed'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Tidak dapat mengubah status dari "${currentStatus}" menjadi "${newStatus}"` },
        { status: 400 }
      );
    }

    await withTransaction(async (client) => {
      // Jika dibatalkan, kembalikan stok barang
      if (newStatus === 'cancelled') {
        const itemsRes = await client.query(
          `SELECT product_id, quantity FROM order_items WHERE order_id = $1 AND product_id IS NOT NULL`,
          [orderId]
        );

        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE products SET stock = stock + $1 WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }

      await client.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newStatus, orderId]
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Status pesanan berhasil diperbarui',
      status: newStatus,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui status pesanan' },
      { status: 500 }
    );
  }
}
