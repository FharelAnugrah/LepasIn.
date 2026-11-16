import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const sellerId = Number(id);

    if (!sellerId) {
      return NextResponse.json({ error: 'ID seller tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body; // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Aksi harus berupa approve atau reject' },
        { status: 400 }
      );
    }

    let queryText;
    if (action === 'approve') {
      queryText = `UPDATE users
                   SET seller_status = 'approved', was_approved = TRUE, updated_at = NOW()
                   WHERE id = $1 AND role = 'seller'
                   RETURNING id, name, email, seller_status, was_approved`;
    } else {
      queryText = `UPDATE users
                   SET seller_status = 'rejected', updated_at = NOW()
                   WHERE id = $1 AND role = 'seller'
                   RETURNING id, name, email, seller_status, was_approved`;
    }

    const result = await query(queryText, [sellerId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Penjual tidak ditemukan atau bukan role seller' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Penjual berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}`,
      seller: result.rows[0],
    });
  } catch (error) {
    console.error('Admin update seller error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui status verifikasi penjual' },
      { status: 500 }
    );
  }
}
