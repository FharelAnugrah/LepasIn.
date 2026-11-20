import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  GraduationCap,
  MapPin,
  Package,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProductCard from '@/components/product/ProductCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const storeId = Number(id);
  if (!storeId) return { title: 'Toko Tidak Ditemukan | LepasIn' };

  try {
    const res = await query(`SELECT name FROM stores WHERE id = $1`, [storeId]);
    if (res.rows.length === 0) return { title: 'Toko Tidak Ditemukan | LepasIn' };
    return {
      title: `${res.rows[0].name} | LepasIn`,
      description: `Lihat lapak preloved ${res.rows[0].name} di LepasIn sekampus.`,
    };
  } catch {
    return { title: 'Profil Toko | LepasIn' };
  }
}

export default async function StoreProfilePage({ params }) {
  const { id } = await params;
  const storeId = Number(id);

  if (!storeId) {
    notFound();
  }

  const user = await getCurrentUser();

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

  const productsRes = await query(
    `SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition,
            c.name AS category_name,
            s.name AS store_name,
            cp.short_name AS campus_short_name,
            cp.name AS campus_name,
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

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 outline-none"
      >
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-secondary hover:text-brand-blue transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>

        {/* Banner Profil Toko 3D */}
        <section className="surface-3d rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl icon-plinth-navy text-white font-bold text-2xl flex items-center justify-center shrink-0 uppercase">
              {store.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
                  {store.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-success-bg text-success-text">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Terverifikasi</span>
                </span>
              </div>
              <p className="text-xs md:text-sm text-ink-secondary font-medium mt-1">
                Pengelola: {store.seller_name}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted mt-2">
                <span className="font-semibold text-brand-blue inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {store.campus_short_name} ({store.campus_city})
                  </span>
                </span>
                {store.location && (
                  <>
                    <span className="text-border-subtle" aria-hidden="true">|</span>
                    <span className="inline-flex items-center gap-1 text-ink-secondary">
                      <MapPin className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                      <span>{store.location}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs text-ink-secondary border-t md:border-t-0 md:border-l border-border-subtle pt-4 md:pt-0 md:pl-6 w-full md:w-auto md:shrink-0 tabular-nums">
            <div className="font-bold text-ink text-sm">Informasi Toko</div>
            <div>
              Total Barang: <strong className="text-ink">{products.length} produk</strong>
            </div>
            {store.seller_phone && <div>Kontak: {store.seller_phone}</div>}

            {user && user.id !== store.user_id && (
              <div className="mt-1">
                <Link
                  href={`/chat?store_id=${store.id}`}
                  className="btn-3d btn-3d-outline inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hubungi Toko</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {store.description && (
          <div className="p-4 rounded-2xl surface-3d text-sm text-ink-secondary leading-relaxed">
            <strong className="text-ink block mb-1 text-xs uppercase tracking-wider">Catatan Penjual</strong>
            {store.description}
          </div>
        )}

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-blue" aria-hidden="true" />
              <span>Semua Barang dari {store.name}</span>
            </h2>
            <span className="text-xs text-ink-muted font-semibold tabular-nums">
              {products.length} barang tersedia
            </span>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center bg-surface rounded-xl border border-border-subtle text-sm text-ink-muted">
              Toko ini belum memiliki barang yang siap dijual.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
