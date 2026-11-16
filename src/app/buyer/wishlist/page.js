import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import WishlistManager from './WishlistManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Barang Favorit — LepasIn',
};

export default async function WishlistPage() {
  const buyer = await requireBuyer('/buyer/wishlist');

  const res = await query(
    `SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition,
            c.name AS category_name,
            s.name AS store_name,
            cp.short_name AS campus_short_name, cp.city AS campus_city,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url,
            COALESCE(r.avg_rating, 0) AS avg_rating,
            COALESCE(r.review_count, 0) AS review_count
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     JOIN categories c ON c.id = p.category_id
     JOIN stores s ON s.id = p.store_id
     JOIN campuses cp ON cp.id = s.campus_id
     LEFT JOIN (SELECT product_id, ROUND(AVG(rating), 1)::float AS avg_rating, COUNT(*)::int AS review_count
                FROM reviews GROUP BY product_id) r ON r.product_id = p.id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [buyer.id]
  );

  const products = res.rows;

  const cartRes = await query(
    `SELECT COALESCE(SUM(ci.quantity), 0)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1`,
    [buyer.id]
  );
  const cartCount = cartRes.rows[0]?.count || 0;
  const cartTotal = cartRes.rows[0]?.total || 0;

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Navbar user={buyer} cartCount={cartCount} showSearchBar={false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        <WishlistManager initialProducts={products} user={buyer} />
      </main>

      <Footer />
      <BottomNav user={buyer} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
