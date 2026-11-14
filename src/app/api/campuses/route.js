import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    let sql = `SELECT id, name, short_name, city, province FROM campuses`;
    const params = [];

    if (q && q.trim()) {
      sql += ` WHERE name ILIKE $1 OR short_name ILIKE $1 OR city ILIKE $1 OR province ILIKE $1`;
      params.push(`%${q.trim()}%`);
    }

    sql += ` ORDER BY name ASC`;

    const result = await query(sql, params);
    return NextResponse.json({ campuses: result.rows });
  } catch (error) {
    console.error('Error fetching campuses:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar kampus' },
      { status: 500 }
    );
  }
}
