import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const buyerUpdateStatusSchema = z.object({
  status: z.enum(['completed', 'processing']),
});

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'buyer') {
      return NextResponse.json({ error: 'Akses ditolak, silakan login sebagai pembeli' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = Number(id);

    if (!orderId) {
      return NextResponse.json({ error: 'ID pesanan tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const validated = buyerUpdateStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Status yang diminta tidak valid' }, { status: 400 });
    }

    const { status: newStatus } = validated.data;

    // Ambil order dan verifikasi kepemilikan pesanan oleh buyer
    const orderRes = await query(
      `SELECT id, buyer_id, status, delivery_method FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const order = orderRes.rows[0];

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Anda bukan pemilik pesanan ini' }, { status: 403 });
    }

    // Penanganan simulasi pembayaran pesanan delivery (kirim ke kost)
    if (newStatus === 'processing') {
      if (order.status !== 'pending_payment') {
        return NextResponse.json(
          { error: 'Hanya pesanan yang berstatus menunggu pembayaran yang dapat disimulasikan pembayarannya' },
          { status: 400 }
        );
      }
      if (order.delivery_method !== 'delivery') {
        return NextResponse.json(
          { error: 'Simulasi pembayaran online hanya untuk metode pengiriman ke kost' },
          { status: 400 }
        );
      }

      await query(
        `UPDATE orders SET status = 'processing', updated_at = NOW() WHERE id = $1`,
        [orderId]
      );

      return NextResponse.json({
        success: true,
        message: 'Pembayaran simulasi berhasil! Pesanan Anda kini masuk ke tahap Terbayar / Diproses oleh penjual.',
        status: 'processing',
      });
    }

    // Penanganan konfirmasi penerimaan barang oleh pembeli
    if (newStatus === 'completed') {
      if (order.status !== 'shipped') {
        return NextResponse.json(
          { error: 'Pesanan belum dalam status dikirim atau siap ketemuan di kampus' },
          { status: 400 }
        );
      }

      await query(
        `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1`,
        [orderId]
      );

      return NextResponse.json({
        success: true,
        message: 'Pesanan berhasil diselesaikan dan diterima!',
        status: 'completed',
      });
    }

    return NextResponse.json({ error: 'Aksi status tidak dikenali' }, { status: 400 });
  } catch (error) {
    console.error('Buyer update order status error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengonfirmasi pesanan' },
      { status: 500 }
    );
  }
}
