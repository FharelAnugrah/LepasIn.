import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  Store,
  ShieldCheck,
  TrendingDown,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProductCard from '@/components/product/ProductCard';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  const selectedCampusId = sp?.campus ? Number(sp.campus) : (user?.campus_id || null);
  const selectedCategoryId = sp?.category ? Number(sp.category) : null;

  // 1. Ambil Kategori
  const categoriesRes = await query(`SELECT id, name FROM categories ORDER BY id ASC`);
  const categories = categoriesRes.rows;

  // 2. Ambil Kampus Terpilih (jika ada)
  let selectedCampusObj = null;
  if (selectedCampusId) {
    const campusRes = await query(`SELECT id, name, short_name, city FROM campuses WHERE id = $1`, [
      selectedCampusId,
    ]);
    selectedCampusObj = campusRes.rows[0] || null;
  }

  // 3. Info Keranjang & Wishlist jika Buyer
  let cartCount = 0;
  let cartTotal = 0;
  let wishlistIds = new Set();

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
    wishlistIds = new Set(wishRes.rows.map((r) => r.product_id));
  }

  // 4. Query Rekomendasi Kampus / Pilihan (Prioritas kampus terpilih/kampus buyer)
  let recommendations = [];
  try {
    const recParams = [];
    let recSql = `
      SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition, p.created_at,
             c.name AS category_name,
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
      WHERE p.stock > 0
    `;

    if (selectedCampusId) {
      recParams.push(selectedCampusId);
      recSql += ` AND s.campus_id = $${recParams.length}`;
    }

    if (selectedCategoryId) {
      recParams.push(selectedCategoryId);
      recSql += ` AND p.category_id = $${recParams.length}`;
    }

    recSql += ` ORDER BY p.created_at DESC LIMIT 8`;

    const recRes = await query(recSql, recParams);
    recommendations = recRes.rows;

    // Jika rekomendasi kampus kurang dari 4 dan filter bukan manual, tambahkan produk dari kampus lain
    if (recommendations.length < 4 && !sp?.campus) {
      const fallbackRes = await query(`
        SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition, p.created_at,
               c.name AS category_name,
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
        WHERE p.stock > 0
        ORDER BY RANDOM()
        LIMIT 8
      `);
      recommendations = fallbackRes.rows;
    }
  } catch (err) {
    console.error('Error fetching recommendations:', err);
  }

  // 5. Query "Baru Dilepas" (Semua produk terbaru)
  let latestProducts = [];
  try {
    const latestRes = await query(`
      SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition, p.created_at,
             c.name AS category_name,
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
      ORDER BY p.created_at DESC
      LIMIT 8
    `);
    latestProducts = latestRes.rows;
  } catch (err) {
    console.error('Error fetching latest products:', err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Navbar Atas */}
      <Navbar
        user={user}
        cartCount={cartCount}
        selectedCampus={selectedCampusObj}
        showSearchBar={true}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 flex flex-col gap-8">
        {/* Chip Kategori Horizontal */}
        <section className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <Link
            href="/"
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              !selectedCategoryId
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-ink hover:bg-surface-alt'
            }`}
          >
            Semua Produk
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}${selectedCampusId ? `&campus=${selectedCampusId}` : ''}`}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface text-ink hover:bg-surface-alt'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </section>

        {/* Hero Promo Banner Biru Khas LepasIn (#1E5EFF) */}
        <section className="relative overflow-hidden bg-primary rounded-card p-6 md:p-10 text-white shadow-card">
          <div className="relative z-10 max-w-xl flex flex-col gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-white w-fit">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Marketplace Mahasiswa & Anak Kost</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Lepas Barang Kostmu, Hemat Budget Kuliah!
            </h1>
            <p className="text-xs md:text-sm text-white/90 leading-relaxed">
              Jual beli barang preloved aman sesama mahasiswa di seluruh kampus Indonesia. Cari kasur, kipas, buku kuliah, dan peralatan dapur tanpa ongkos kirim mahal lewat COD sekampus.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/products">
                <Button variant="accent" size="md" pill>
                  <span>Jelajah Produk</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Button>
              </Link>
              <Link href={user?.role === 'seller' ? '/seller/products/new' : '/register?role=seller'}>
                <Button variant="outline" size="md" pill className="border-white text-white hover:bg-white/15">
                  Mulai Jual Barang
                </Button>
              </Link>
            </div>
          </div>

          {/* Dekorasi Bentuk Geometris Modern */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute right-24 top-0 -translate-y-12 w-48 h-48 rounded-full bg-accent/20 blur-xl pointer-events-none" />
        </section>

        {/* Section 1: Produk Rekomendasi Kampus / Pilihan */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-ink flex items-center gap-2">
                <span>Rekomendasi Kampus</span>
                {selectedCampusObj && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pine-50 text-pine flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{selectedCampusObj.short_name}</span>
                  </span>
                )}
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Barang preloved terdekat siap COD atau dikirim ke area kostmu.
              </p>
            </div>
            <Link
              href={`/products${selectedCampusId ? `?campus=${selectedCampusId}` : ''}`}
              className="text-xs md:text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Lihat semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-card border border-line text-xs text-ink-soft">
              Belum ada produk untuk kampus ini.{' '}
              <Link href="/products" className="text-primary font-bold hover:underline">
                Jelajahi produk dari seluruh kampus se-Indonesia
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {recommendations.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={wishlistIds.has(product.id)}
                  user={user}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Baru Dilepas */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-ink">
                Baru Dilepas
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Barang kost yang baru saja diunggah mahasiswa dari berbagai kampus.
              </p>
            </div>
            <Link
              href="/products"
              className="text-xs md:text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Katalog Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.has(product.id)}
                user={user}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Bottom Nav di Mobile */}
      <BottomNav user={user} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
