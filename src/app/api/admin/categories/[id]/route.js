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
    const categoryId = Number(id);

    const body = await request.json();
    const name = body.name?.trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Nama kategori minimal 2 karakter' },
        { status: 400 }
      );
    }

    const existing = await query(
      `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2`,
      [name, categoryId]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Kategori dengan nama tersebut sudah ada' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name`,
      [name, categoryId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category: result.rows[0],
      message: 'Nama kategori berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const categoryId = Number(id);

    // Cek apakah masih digunakan oleh produk (ADM-5: tolak hapus jika masih dipakai produk)
    const productCheck = await query(
      `SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1`,
      [categoryId]
    );

    const count = productCheck.rows[0]?.count || 0;
    if (count > 0) {
      return NextResponse.json(
        {
          error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${count} produk. Pindahkan atau hapus produk terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM categories WHERE id = $1 RETURNING id, name`,
      [categoryId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
  }
}
