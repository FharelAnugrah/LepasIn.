import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { deleteSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Tidak terotentikasi' }, { status: 401 });
    }

    // Hanya seller berstatus rejected yang boleh menghapus akunnya sendiri dari halaman pending-seller
    if (user.role !== 'seller' || user.seller_status !== 'rejected') {
      return NextResponse.json(
        { error: 'Hanya akun penjual yang ditolak yang dapat menghapus akun sendiri' },
        { status: 403 }
      );
    }

    // Hapus user (CASCADE akan menghapus toko dan relasi terkait)
    await query(`DELETE FROM users WHERE id = $1`, [user.id]);

    // Hapus sesi cookie
    await deleteSession();

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dihapus',
      redirectTo: '/register',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus akun' },
      { status: 500 }
    );
  }
}
