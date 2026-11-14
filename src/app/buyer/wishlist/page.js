import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';

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
    `SELECT COUNT(ci.id)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <Heart className="w-6 h-6 text-danger fill-danger" />
              <span>Barang Favorit Saya</span>
            </h1>
            <p className="text-xs md:text-sm text-ink-soft mt-1">
              Daftar barang kost yang telah kamu simpan untuk dibeli nanti.
            </p>
          </div>
          <span className="text-xs text-ink-soft font-semibold">
            {products.length} barang disimpan
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-canvas border border-line rounded-card p-12 text-center max-w-md mx-auto shadow-card my-8">
            <div className="w-16 h-16 rounded-full bg-danger-50 text-danger flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-ink mb-1">Belum Ada Barang Favorit</h2>
            <p className="text-xs text-ink-soft mb-6 leading-relaxed">
              Klik ikon hati di sudut kanan atas foto produk untuk menyimpan barang incaranmu.
            </p>
            <Link href="/products">
              <Button variant="primary" pill>
                <span>Jelajah Katalog</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} isWishlisted={true} user={buyer} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav user={buyer} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
