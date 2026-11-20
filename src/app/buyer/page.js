import Link from 'next/link';
import {
  Package,
  Heart,
  ShoppingCart,
  MapPin,
  Store,
  GraduationCap,
} from 'lucide-react';
import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import BuyerDashboardShell from '@/components/layout/BuyerDashboardShell';
import { OrderStatusBadge, formatRupiah } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard Pembeli | LepasIn',
  description: 'Ringkasan pesanan, keranjang, favorit, dan alamat kost akun pembeli LepasIn.',
};

export default async function BuyerOverviewPage() {
  const buyer = await requireBuyer('/buyer');

  const [cartRes, statsRes, recentOrdersRes] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(ci.quantity), 0)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [buyer.id]
    ),
    query(
      `SELECT
         (SELECT COUNT(*)::int FROM orders WHERE buyer_id = $1 AND status IN ('pending_payment', 'processing', 'shipped')) AS active_orders,
         (SELECT COUNT(*)::int FROM orders WHERE buyer_id = $1 AND status = 'completed') AS completed_orders,
         (SELECT COUNT(*)::int FROM wishlists WHERE user_id = $1) AS wishlist_count,
         (SELECT COUNT(*)::int FROM addresses WHERE user_id = $1) AS address_count`,
      [buyer.id]
    ),
    query(
      `SELECT id, order_code, store_name, status, delivery_method, total_amount, created_at
       FROM orders
       WHERE buyer_id = $1
       ORDER BY created_at DESC
       LIMIT 4`,
      [buyer.id]
    ),
  ]);

  const cartCount = cartRes.rows[0]?.count || 0;
  const cartTotal = cartRes.rows[0]?.total || 0;
  const stats = statsRes.rows[0] || {
    active_orders: 0,
    completed_orders: 0,
    wishlist_count: 0,
    address_count: 0,
  };
  const recentOrders = recentOrdersRes.rows;

  return (
    <BuyerDashboardShell user={buyer} cartCount={cartCount} cartTotal={cartTotal}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              Halo, {buyer.name}
            </h1>
            <p className="text-sm text-ink-muted mt-1 flex flex-wrap items-center gap-2">
              <span>Pantau pesanan aktif, barang favorit, dan alamat kostmu di sini.</span>
              {buyer.campus_short_name && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-blue-soft text-brand-blue">
                  <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{buyer.campus_short_name}</span>
                </span>
              )}
            </p>
          </div>
          <Button href="/products" variant="primary" size="md">
            Jelajah Produk
          </Button>
        </div>

        {/* KPI Summary Cards 3D */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
          <div className="perspective-stage">
            <Link
              href="/buyer/orders"
              data-tilt-3d="kpi"
              className="tilt-3d card-3d block rounded-2xl p-5 overflow-hidden"
            >
              <div className="tilt-glare" aria-hidden="true" />
              <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
                <span className="text-xs font-semibold">Pesanan Aktif</span>
                <span className="w-8 h-8 rounded-lg icon-plinth-3d text-brand-blue flex items-center justify-center">
                  <Package className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
              <div className="depth-layer-2 text-2xl font-extrabold text-ink">{stats.active_orders}</div>
              <p className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle">
                {stats.completed_orders} transaksi selesai
              </p>
            </Link>
          </div>

          <div className="perspective-stage">
            <Link
              href="/buyer/wishlist"
              data-tilt-3d="kpi"
              className="tilt-3d card-3d block rounded-2xl p-5 overflow-hidden"
            >
              <div className="tilt-glare" aria-hidden="true" />
              <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
                <span className="text-xs font-semibold">Barang Favorit</span>
                <span className="w-8 h-8 rounded-lg bg-danger-bg border border-red-200 text-danger-text shadow-[0_2px_0_#FECACA] flex items-center justify-center">
                  <Heart className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
              <div className="depth-layer-2 text-2xl font-extrabold text-ink">{stats.wishlist_count}</div>
              <p className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle">
                Tersimpan untuk dibeli nanti
              </p>
            </Link>
          </div>

          <div className="perspective-stage">
            <Link
              href="/buyer/cart"
              data-tilt-3d="kpi"
              className="tilt-3d card-3d block rounded-2xl p-5 overflow-hidden"
            >
              <div className="tilt-glare" aria-hidden="true" />
              <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
                <span className="text-xs font-semibold">Keranjang Belanja</span>
                <span className="w-8 h-8 rounded-lg icon-plinth-gold text-ink flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
              <div className="depth-layer-2 text-2xl font-extrabold text-ink">{cartCount} item</div>
              <p className="depth-layer-1 text-xs text-brand-blue font-semibold mt-2.5 pt-2.5 border-t border-border-subtle">
                {formatRupiah(cartTotal)}
              </p>
            </Link>
          </div>
        </div>

        {/* Pesanan Terbaru */}
        <section className="surface-3d rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-ink">Pesanan Terbaru</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Status transaksi COD kampus dan pengiriman terbaru.
              </p>
            </div>
            <Link
              href="/buyer/orders"
              className="text-xs font-semibold text-brand-blue hover:underline shrink-0"
            >
              Semua Pesanan
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">
              Belum ada pesanan dibuat. Mulai cari barang kost di katalog.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href="/buyer/orders"
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-canvas transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-ink tabular-nums">#{o.order_code}</span>
                      <span className="text-border-subtle">|</span>
                      <span className="inline-flex items-center gap-1 text-ink-secondary font-medium truncate">
                        <Store className="w-3.5 h-3.5 text-brand-blue shrink-0" aria-hidden="true" />
                        <span className="truncate">{o.store_name}</span>
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      {o.delivery_method === 'meetup' ? 'COD Ketemuan di Kampus' : 'Dikirim ke Kost'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
                    <span className="font-bold text-sm text-ink tabular-nums">
                      {formatRupiah(o.total_amount)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Tautan Cepat Pengaturan Kost */}
        <div className="bg-surface border border-border-subtle rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                Alamat Kost Tersimpan ({stats.address_count})
              </p>
              <p className="text-xs text-ink-muted">
                Kelola alamat kost atau rumah untuk mempercepat checkout pengiriman.
              </p>
            </div>
          </div>
          <Button href="/buyer/addresses" variant="secondary" size="sm">
            Kelola Alamat
          </Button>
        </div>
      </div>
    </BuyerDashboardShell>
  );
}
