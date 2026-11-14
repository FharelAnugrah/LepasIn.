import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(
      `SELECT id, name, created_at FROM categories 
       ORDER BY 
         CASE 
           WHEN LOWER(name) = 'lainnya' OR LOWER(name) = 'lain-lain' THEN 1 
           ELSE 0 
         END ASC, 
         id ASC`
    );
    return NextResponse.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Gagal memuat kategori' },
      { status: 500 }
    );
  }
}
