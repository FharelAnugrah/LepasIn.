import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const productId = Number(id);
  if (!productId) return { title: 'Produk Tidak Ditemukan — LepasIn' };

  try {
    const res = await query(`SELECT name FROM products WHERE id = $1`, [productId]);
    if (res.rows.length === 0) return { title: 'Produk Tidak Ditemukan — LepasIn' };
    return {
      title: `${res.rows[0].name} — LepasIn`,
      description: `Beli preloved ${res.rows[0].name} di LepasIn sekampus.`,
    };
  } catch {
    return { title: 'Detail Produk — LepasIn' };
  }
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const productId = Number(id);

  if (!productId) {
    notFound();
  }

  const user = await getCurrentUser();

  // 1. Query Produk
  const productRes = await query(
    `SELECT p.id, p.name, p.description, p.price, p.original_price, p.stock, p.condition, p.created_at,
            c.id AS category_id, c.name AS category_name,
            s.id AS store_id, s.name AS store_name, s.location AS store_location, s.description AS store_description,
            cp.id AS campus_id, cp.name AS campus_name, cp.short_name AS campus_short_name, cp.city AS campus_city,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url,
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

  if (productRes.rows.length === 0) {
    notFound();
  }

  const product = productRes.rows[0];

  // 2. Query Galeri Foto
  const imagesRes = await query(
    `SELECT id, url, position FROM product_images WHERE product_id = $1 ORDER BY position ASC`,
    [productId]
  );

  // 3. Query Ulasan
  const reviewsRes = await query(
    `SELECT rv.id, rv.rating, rv.comment, rv.created_at,
            u.name AS buyer_name, u.avatar_url AS buyer_avatar
     FROM reviews rv
     JOIN users u ON u.id = rv.buyer_id
     WHERE rv.product_id = $1
     ORDER BY rv.created_at DESC`,
    [productId]
  );

  // 4. Cek Wishlist & Keranjang
  let isWishlisted = false;
  let cartCount = 0;
  let cartTotal = 0;

  if (user && user.role === 'buyer') {
    const wishRes = await query(
      `SELECT 1 FROM wishlists WHERE user_id = $1 AND product_id = $2`,
      [user.id, productId]
    );
    isWishlisted = wishRes.rows.length > 0;

    const cartRes = await query(
      `SELECT COUNT(ci.id)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [user.id]
    );
    cartCount = cartRes.rows[0]?.count || 0;
    cartTotal = cartRes.rows[0]?.total || 0;
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Navbar user={user} cartCount={cartCount} showSearchBar={true} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-6">
        <ProductDetailClient
          product={product}
          images={imagesRes.rows}
          reviews={reviewsRes.rows}
          user={user}
          isWishlisted={isWishlisted}
        />
      </main>

      <Footer />
      <BottomNav user={user} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
