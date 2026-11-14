import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, getClient } from '@/lib/db';

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

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Cek apakah kategori "Lainnya" / "Lain-lain" ada
      const lainnyaRes = await client.query(
        `SELECT id, name FROM categories WHERE LOWER(name) IN ('lainnya', 'lain-lain') FOR UPDATE`
      );

      let createdCategory;

      if (lainnyaRes.rows.length > 0) {
        const lainnya = lainnyaRes.rows[0];
        const oldLainnyaId = Number(lainnya.id);

        // Cari ID tertinggi dari kategori SELAIN Lainnya
        const maxOtherRes = await client.query(
          `SELECT COALESCE(MAX(id), 0) AS max_id FROM categories WHERE id <> $1`,
          [oldLainnyaId]
        );
        const maxOtherId = Number(maxOtherRes.rows[0].max_id);

        // Kategori baru mengambil oldLainnyaId (atau maxOtherId + 1),
        // sedangkan "Lainnya" digeser menjadi nomor terakhir
        const newCategoryId = Math.max(oldLainnyaId, maxOtherId + 1);
        const newLainnyaId = newCategoryId + 1;

        // Pindahkan Lainnya sementara ke temporary ID (999999) agar tidak bentrok Primary Key
        await client.query(`UPDATE categories SET id = 999999 WHERE id = $1`, [oldLainnyaId]);

        // Masukkan kategori baru dengan newCategoryId
        const insertRes = await client.query(
          `INSERT INTO categories (id, name) OVERRIDING SYSTEM VALUE VALUES ($1, $2) RETURNING id, name, created_at`,
          [newCategoryId, name]
        );
        createdCategory = insertRes.rows[0];

        // Pindahkan "Lainnya" ke newLainnyaId (nomor terakhir!)
        await client.query(`UPDATE categories SET id = $1 WHERE id = 999999`, [newLainnyaId]);

        // Sinkronisasi PostgreSQL sequence dengan MAX(id)
        await client.query(
          `SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT MAX(id) FROM categories))`
        );
      } else {
        // Jika tidak ada kategori Lainnya, insert normal
        const insertRes = await client.query(
          `INSERT INTO categories (name) VALUES ($1) RETURNING id, name, created_at`,
          [name]
        );
        createdCategory = insertRes.rows[0];
      }

      // Ambil daftar seluruh kategori terbaru lengkap dengan product_count untuk respons instan ke UI
      const allCatsRes = await client.query(`
        SELECT c.id, c.name, c.created_at, COUNT(p.id)::int AS product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id
        ORDER BY 
          CASE 
            WHEN LOWER(c.name) = 'lainnya' OR LOWER(c.name) = 'lain-lain' THEN 1 
            ELSE 0 
          END ASC, 
          c.id ASC
      `);

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        category: createdCategory,
        categories: allCatsRes.rows,
        message: 'Kategori baru berhasil ditambahkan',
      });
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Add category error:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan kategori' },
      { status: 500 }
    );
  }
}
