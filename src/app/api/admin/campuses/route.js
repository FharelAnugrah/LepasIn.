import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { name, short_name, city, province } = body;

    if (!name?.trim() || !short_name?.trim() || !city?.trim() || !province?.trim()) {
      return NextResponse.json(
        { error: 'Nama, singkatan, kota, dan provinsi wajib diisi' },
        { status: 400 }
      );
    }

    const existing = await query(`SELECT id FROM campuses WHERE LOWER(name) = LOWER($1)`, [
      name.trim(),
    ]);

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Nama perguruan tinggi sudah terdaftar' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO campuses (name, short_name, city, province)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, short_name, city, province`,
      [name.trim(), short_name.trim().toUpperCase(), city.trim(), province.trim()]
    );

    return NextResponse.json({
      success: true,
      campus: result.rows[0],
      message: 'Perguruan tinggi berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Add campus error:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan perguruan tinggi' },
      { status: 500 }
    );
  }
}
