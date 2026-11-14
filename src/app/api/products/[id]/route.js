import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json({ error: 'ID produk tidak valid' }, { status: 400 });
    }

    const res = await query(
      `SELECT p.id, p.name, p.description, p.price, p.original_price, p.stock, p.condition, p.created_at,
              c.id AS category_id, c.name AS category_name,
              s.id AS store_id, s.name AS store_name, s.location AS store_location, s.description AS store_description,
              cp.id AS campus_id, cp.name AS campus_name, cp.short_name AS campus_short_name, cp.city AS campus_city,
              COALESCE(r.avg_rating, 0) AS avg_rating,
              COALESCE(r.review_count, 0) AS review_count
       FROM products p
       JOIN categories c ON c.id = p.category_id
       JOIN stores s ON s.id = p.store_id
       JOIN campuses cp ON cp.id = s.campus_id
       JOIN users u ON u.id = s.user_id AND u.seller_status = 'approved'
       LEFT JOIN (SELECT product_id, ROUND(AVG(rating), 1)::float AS avg_rating, COUNT(*)::int AS review_count
                  FROM reviews GROUP BY product_id) r ON r.product_id = p.id
       WHERE p.id = $1`,
      [productId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const product = res.rows[0];

    // Ambil galeri foto
    const imagesRes = await query(
      `SELECT id, url, position FROM product_images WHERE product_id = $1 ORDER BY position ASC`,
      [productId]
    );

    // Ambil ulasan
    const reviewsRes = await query(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at,
              u.name AS buyer_name, u.avatar_url AS buyer_avatar
       FROM reviews rv
       JOIN users u ON u.id = rv.buyer_id
       WHERE rv.product_id = $1
       ORDER BY rv.created_at DESC`,
      [productId]
    );

    return NextResponse.json({
      product,
      images: imagesRes.rows,
      reviews: reviewsRes.rows,
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    return NextResponse.json({ error: 'Gagal memuat detail produk' }, { status: 500 });
  }
}
