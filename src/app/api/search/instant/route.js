import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const campusId = searchParams.get('campus') ? Number(searchParams.get('campus')) : null;

    if (!q || q.length < 2) {
      return NextResponse.json({ products: [], stores: [] });
    }

    // 1. Live query produk (mencocokkan nama produk atau nama toko)
    const productsRes = await query(
      `SELECT p.id, p.name, p.price, p.stock, p.condition,
              s.name AS store_name,
              cp.short_name AS campus_short_name,
              (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
       FROM products p
       JOIN stores s ON s.id = p.store_id
       JOIN campuses cp ON cp.id = s.campus_id
       JOIN users u ON u.id = s.user_id AND u.seller_status = 'approved'
       WHERE (p.name ILIKE '%' || $1 || '%' OR s.name ILIKE '%' || $1 || '%')
         AND ($2::int IS NULL OR s.campus_id = $2)
         AND p.stock > 0
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [q, campusId]
    );

    // 2. Live query toko yang cocok
    const storesRes = await query(
      `SELECT s.id, s.name, s.location, s.image_url,
              cp.short_name AS campus_short_name,
              (SELECT COUNT(*)::int FROM products p WHERE p.store_id = s.id AND p.stock > 0) AS products_count
       FROM stores s
       JOIN users u ON u.id = s.user_id AND u.seller_status = 'approved'
       JOIN campuses cp ON cp.id = s.campus_id
       WHERE s.name ILIKE '%' || $1 || '%'
         AND ($2::int IS NULL OR s.campus_id = $2)
       ORDER BY products_count DESC, s.name ASC
       LIMIT 3`,
      [q, campusId]
    );

    return NextResponse.json({
      products: productsRes.rows,
      stores: storesRes.rows,
    });
  } catch (error) {
    console.error('Instant search API error:', error);
    return NextResponse.json({ error: 'Gagal melakukan pencarian instan' }, { status: 500 });
  }
}
