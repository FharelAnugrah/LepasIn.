import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const name = body.name?.trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Nama kategori minimal 2 karakter' },
        { status: 400 }
      );
    }

    const existing = await query(`SELECT id FROM categories WHERE LOWER(name) = LOWER($1)`, [name]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Kategori dengan nama tersebut sudah ada' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO categories (name) VALUES ($1) RETURNING id, name, created_at`,
      [name]
    );

    return NextResponse.json({
      success: true,
      category: result.rows[0],
      message: 'Kategori baru berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Add category error:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan kategori' },
      { status: 500 }
    );
  }
}
