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
    const campusId = Number(id);

    const body = await request.json();
    const { name, short_name, city, province } = body;

    if (!name?.trim() || !short_name?.trim() || !city?.trim() || !province?.trim()) {
      return NextResponse.json(
        { error: 'Nama, singkatan, kota, dan provinsi wajib diisi' },
        { status: 400 }
      );
    }

    const existing = await query(
      `SELECT id FROM campuses WHERE LOWER(name) = LOWER($1) AND id <> $2`,
      [name.trim(), campusId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Nama perguruan tinggi sudah digunakan' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE campuses
       SET name = $1, short_name = $2, city = $3, province = $4
       WHERE id = $5
       RETURNING id, name, short_name, city, province`,
      [name.trim(), short_name.trim().toUpperCase(), city.trim(), province.trim(), campusId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kampus tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      campus: result.rows[0],
      message: 'Data kampus berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update campus error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kampus' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const campusId = Number(id);

    // Cek apakah masih ada user atau toko yang terhubung
    const userCheck = await query(
      `SELECT COUNT(*)::int AS count FROM users WHERE campus_id = $1`,
      [campusId]
    );
    const storeCheck = await query(
      `SELECT COUNT(*)::int AS count FROM stores WHERE campus_id = $1`,
      [campusId]
    );

    const userCount = userCheck.rows[0]?.count || 0;
    const storeCount = storeCheck.rows[0]?.count || 0;

    if (userCount > 0 || storeCount > 0) {
      return NextResponse.json(
        {
          error: `Kampus tidak dapat dihapus karena masih terhubung dengan ${userCount} pengguna dan ${storeCount} toko.`,
        },
        { status: 400 }
      );
    }

    const result = await query(`DELETE FROM campuses WHERE id = $1 RETURNING id, name`, [
      campusId,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kampus tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Perguruan tinggi berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete campus error:', error);
    return NextResponse.json({ error: 'Gagal menghapus kampus' }, { status: 500 });
  }
}
