import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const productId = Number(id);

    const result = await query(
      `DELETE FROM products WHERE id = $1 RETURNING id, name`,
      [productId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Produk "${result.rows[0].name}" berhasil dimoderasi dan dihapus`,
    });
  } catch (error) {
    console.error('Moderation delete product error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus produk' },
      { status: 500 }
    );
  }
}
