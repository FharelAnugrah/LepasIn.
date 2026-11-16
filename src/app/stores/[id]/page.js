import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  ShieldCheck,
  GraduationCap,
  MapPin,
  Package,
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const storeId = Number(id);
  if (!storeId) return { title: 'Toko Tidak Ditemukan — LepasIn' };

  try {
    const res = await query(`SELECT name FROM stores WHERE id = $1`, [storeId]);
    if (res.rows.length === 0) return { title: 'Toko Tidak Ditemukan — LepasIn' };
    return {
      title: `${res.rows[0].name} — LepasIn`,
      description: `Lihat lapak preloved ${res.rows[0].name} di LepasIn sekampus.`,
    };
  } catch {
    return { title: 'Profil Toko — LepasIn' };
  }
}

export default async function StoreProfilePage({ params }) {
  const { id } = await params;
  const storeId = Number(id);

  if (!storeId) {
    notFound();
  }

  const user = await getCurrentUser();

  // 1. Query Toko
  const storeRes = await query(
    `SELECT s.id, s.name, s.description, s.location, s.image_url, s.created_at, s.user_id,
            u.name AS seller_name, u.email AS seller_email, u.phone AS seller_phone,
            cp.id AS campus_id, cp.name AS campus_name, cp.short_name AS campus_short_name, cp.city AS campus_city
     FROM stores s
     JOIN users u ON u.id = s.user_id AND u.seller_status = 'approved'
     LEFT JOIN campuses cp ON cp.id = s.campus_id
     WHERE s.id = $1`,
    [storeId]
  );

  if (storeRes.rows.length === 0) {
    notFound();
  }

  const store = storeRes.rows[0];

  // 2. Query Produk Toko
  const productsRes = await query(
    `SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition,
            c.name AS category_name,
            s.name AS store_name,
            cp.short_name AS campus_short_name,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url,
            COALESCE(r.avg_rating, 0) AS avg_rating,
            COALESCE(r.review_count, 0) AS review_count
     FROM products p
     JOIN categories c ON c.id = p.category_id
     JOIN stores s ON s.id = p.store_id
     JOIN campuses cp ON cp.id = s.campus_id
     LEFT JOIN (SELECT product_id, ROUND(AVG(rating), 1)::float AS avg_rating, COUNT(*)::int AS review_count
                FROM reviews GROUP BY product_id) r ON r.product_id = p.id
     WHERE p.store_id = $1
     ORDER BY p.created_at DESC`,
    [storeId]
  );

  const products = productsRes.rows;

  // 3. Wishlist jika Buyer
  let wishlistIds = [];
  let cartCount = 0;
  let cartTotal = 0;

  if (user && user.role === 'buyer') {
    const wishRes = await query(`SELECT product_id FROM wishlists WHERE user_id = $1`, [user.id]);
    wishlistIds = wishRes.rows.map((r) => r.product_id);

    const cartRes = await query(
      `SELECT COALESCE(SUM(ci.quantity), 0)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Tombol Kembali */}
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-soft hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>

        {/* Banner Toko Profil */}
        <div className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary-50 text-primary font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm uppercase">
              {store.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-ink tracking-tight">
                  {store.name}
                </h1>
                <ShieldCheck className="w-5 h-5 text-pine shrink-0" title="Penjual Terverifikasi" />
              </div>
              <p className="text-xs text-ink font-medium mt-0.5">
                Pengelola: {store.seller_name}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft mt-2">
                <span className="font-semibold text-pine flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>
                    {store.campus_short_name} ({store.campus_city})
                  </span>
                </span>
                {store.location && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{store.location}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs text-ink-soft border-t md:border-t-0 md:border-l border-line/70 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div className="font-bold text-ink mb-1">Informasi Toko</div>
            <div>Total Barang: <strong className="text-ink">{products.length} produk</strong></div>
            {store.seller_phone && <div>Kontak: {store.seller_phone}</div>}

            {user && user.id !== store.user_id && (
              <div className="mt-2">
                <Link
                  href={`/chat?store_id=${store.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-50/60 text-primary hover:bg-primary hover:text-white px-3.5 py-1.5 text-xs font-semibold transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat Toko</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Deskripsi Toko jika ada */}
        {store.description && (
          <div className="p-4 rounded-card bg-surface border border-line text-xs md:text-sm text-ink-soft">
            <strong className="text-ink block mb-1">Catatan Penjual:</strong>
            {store.description}
          </div>
        )}

        {/* Daftar Barang dari Toko Ini */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span>Semua Barang dari {store.name}</span>
            </h2>
            <span className="text-xs text-ink-soft font-semibold">
              {products.length} barang tersedia
            </span>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center bg-canvas rounded-card border border-line text-xs text-ink-soft">
              Toko ini belum memiliki barang yang siap dijual.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={wishlistIds.includes(p.id)}
                  user={user}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <BottomNav user={user} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
