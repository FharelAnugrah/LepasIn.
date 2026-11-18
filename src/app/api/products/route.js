import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parsePositiveInt, parseNonNegativeInt } from '@/lib/params';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || null;
    const campus = parsePositiveInt(searchParams.get('campus'));
    const category = parsePositiveInt(searchParams.get('category'));
    const condition = searchParams.get('condition') || null;
    const minPrice = parseNonNegativeInt(searchParams.get('minPrice'));
    const maxPrice = parseNonNegativeInt(searchParams.get('maxPrice'));
    const sort = searchParams.get('sort') || 'latest';
    const page = Math.max(1, parsePositiveInt(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(50, parsePositiveInt(searchParams.get('limit')) || 12));
    const offset = (page - 1) * limit;

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    if (sort === 'price_desc') orderBy = 'p.price DESC';
    if (sort === 'rating_desc') orderBy = 'COALESCE(r.avg_rating, 0) DESC, p.created_at DESC';

    const sql = `
      SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition, p.created_at,
             c.id AS category_id,
             c.name AS category_name,
             s.id AS store_id,
             s.name AS store_name,
             s.location AS store_location,
             cp.id AS campus_id,
             cp.short_name AS campus_short_name,
             cp.name AS campus_name,
             cp.city AS campus_city,
             (SELECT pi.url FROM product_images pi
               WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url,
             COALESCE(r.avg_rating, 0)   AS avg_rating,
             COALESCE(r.review_count, 0) AS review_count
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s     ON s.id = p.store_id
      JOIN campuses cp  ON cp.id = s.campus_id
      JOIN users u      ON u.id = s.user_id AND u.seller_status = 'approved'
      LEFT JOIN (SELECT product_id, ROUND(AVG(rating), 1)::float AS avg_rating, COUNT(*)::int AS review_count
                 FROM reviews GROUP BY product_id) r ON r.product_id = p.id
      WHERE ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%' OR s.name ILIKE '%' || $1 || '%')
        AND ($2::int  IS NULL OR s.campus_id = $2)
        AND ($3::int  IS NULL OR p.category_id = $3)
        AND ($4::text IS NULL OR p.condition = $4)
        AND ($5::int  IS NULL OR p.price >= $5)
        AND ($6::int  IS NULL OR p.price <= $6)
      ORDER BY ${orderBy}
      LIMIT $7 OFFSET $8
    `;

    const countSql = `
      SELECT COUNT(p.id)::int AS total
      FROM products p
      JOIN stores s     ON s.id = p.store_id
      JOIN campuses cp  ON cp.id = s.campus_id
      JOIN users u      ON u.id = s.user_id AND u.seller_status = 'approved'
      WHERE ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%' OR s.name ILIKE '%' || $1 || '%')
        AND ($2::int  IS NULL OR s.campus_id = $2)
        AND ($3::int  IS NULL OR p.category_id = $3)
        AND ($4::text IS NULL OR p.condition = $4)
        AND ($5::int  IS NULL OR p.price >= $5)
        AND ($6::int  IS NULL OR p.price <= $6)
    `;

    const filterParams = [q, campus, category, condition, minPrice, maxPrice];
    const [result, countResult] = await Promise.all([
      query(sql, [...filterParams, limit, offset]),
      query(countSql, filterParams),
    ]);

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Gagal memuat katalog produk' },
      { status: 500 }
    );
  }
}
