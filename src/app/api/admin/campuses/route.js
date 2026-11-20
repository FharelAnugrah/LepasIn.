import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  validateCampusName,
  validateCampusShortName,
  validateCityOrProvince,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { name, short_name, city, province } = body;

    const nameErr = validateCampusName(name);
    if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 });

    const shortNameErr = validateCampusShortName(short_name);
    if (shortNameErr) return NextResponse.json({ error: shortNameErr }, { status: 400 });

    const cityErr = validateCityOrProvince(city, 'Kota');
    if (cityErr) return NextResponse.json({ error: cityErr }, { status: 400 });

    const provErr = validateCityOrProvince(province, 'Provinsi');
    if (provErr) return NextResponse.json({ error: provErr }, { status: 400 });

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
