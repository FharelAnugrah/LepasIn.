import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = Number(id);

    const body = await request.json();
    const { name, phone, campus_id, role, seller_status } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nama minimal 2 karakter' }, { status: 400 });
    }

    const parsedCampusId = campus_id ? Number(campus_id) : null;

    const result = await query(
      `UPDATE users
       SET name = $1,
           phone = $2,
           campus_id = $3,
           role = COALESCE($4, role),
           seller_status = $5
       WHERE id = $6
       RETURNING id, name, email, role, seller_status, campus_id, phone`,
      [
        name.trim(),
        phone ? phone.trim() : null,
        parsedCampusId,
        role || null,
        role === 'seller' ? (seller_status || 'approved') : null,
        targetUserId,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
      message: 'Data pengguna berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const targetUserId = Number(id);

    // Cek: Dilarang menghapus akun sendiri! (ADM-2..4)
    if (targetUserId === admin.id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun Anda sendiri' },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM users WHERE id = $1 RETURNING id, name`,
      [targetUserId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Pengguna ${result.rows[0].name} berhasil dihapus`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 });
  }
}
