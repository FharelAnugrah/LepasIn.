import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProductCatalog from './ProductCatalog';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Katalog Produk Preloved Mahasiswa — LepasIn',
  description: 'Jelajahi kasur kost, rice cooker, laptop, buku kuliah, dan barang preloved lainnya di seluruh kampus Indonesia.',
};

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  const q = sp?.q || null;
  const campus = sp?.campus ? Number(sp.campus) : null;
  const category = sp?.category ? Number(sp.category) : null;
  const condition = sp?.condition || null;
  const minPrice = sp?.minPrice ? Number(sp.minPrice) : null;
  const maxPrice = sp?.maxPrice ? Number(sp.maxPrice) : null;
  const sort = sp?.sort || 'latest';
  const page = Math.max(1, Number(sp?.page) || 1);
  const limit = 12;
  const offset = (page - 1) * limit;

  // Sorting
  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  if (sort === 'price_desc') orderBy = 'p.price DESC';
  if (sort === 'rating_desc') orderBy = 'COALESCE(r.avg_rating, 0) DESC, p.created_at DESC';

  // 1. Query Produk sesuai Q1 schema.md
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
    WHERE ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%')
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
    WHERE ($1::text IS NULL OR p.name ILIKE '%' || $1 || '%')
      AND ($2::int  IS NULL OR s.campus_id = $2)
      AND ($3::int  IS NULL OR p.category_id = $3)
      AND ($4::text IS NULL OR p.condition = $4)
      AND ($5::int  IS NULL OR p.price >= $5)
      AND ($6::int  IS NULL OR p.price <= $6)
  `;

  const filterParams = [q, campus, category, condition, minPrice, maxPrice];

  const [productsRes, countRes, categoriesRes, campusesRes] = await Promise.all([
    query(sql, [...filterParams, limit, offset]),
    query(countSql, filterParams),
    query(`SELECT id, name FROM categories ORDER BY id ASC`),
    query(`SELECT id, name, short_name, city, province FROM campuses ORDER BY name ASC`),
  ]);

  const products = productsRes.rows;
  const total = countRes.rows[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Keranjang & Wishlist jika Buyer
  let cartCount = 0;
  let cartTotal = 0;
  let wishlistIds = [];

  if (user && user.role === 'buyer') {
    const cartRes = await query(
      `SELECT COUNT(ci.id)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [user.id]
    );
    cartCount = cartRes.rows[0]?.count || 0;
    cartTotal = cartRes.rows[0]?.total || 0;

    const wishRes = await query(`SELECT product_id FROM wishlists WHERE user_id = $1`, [user.id]);
    wishlistIds = wishRes.rows.map((r) => r.product_id);
  }

  const selectedCampusObj = campus ? campusesRes.rows.find((c) => c.id === campus) : null;

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Navbar
        user={user}
        cartCount={cartCount}
        selectedCampus={selectedCampusObj}
        showSearchBar={false}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-6">
        <ProductCatalog
          initialProducts={products}
          pagination={{ page, limit, total, totalPages }}
          filters={{ q, campus, category, condition, minPrice, maxPrice, sort }}
          categories={categoriesRes.rows}
          campuses={campusesRes.rows}
          user={user}
          wishlistIds={wishlistIds}
        />
      </main>

      <Footer />
      <BottomNav user={user} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
