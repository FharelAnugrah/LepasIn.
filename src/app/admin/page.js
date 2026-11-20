import Link from 'next/link';
import {
  Users,
  Store,
  Package,
  TrendingUp,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatRupiah, OrderStatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ringkasan Statistik | Admin LepasIn',
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const userStatsRes = await query(`
    SELECT
      COUNT(*)::int AS total_users,
      COUNT(CASE WHEN role = 'buyer' THEN 1 END)::int AS total_buyers,
      COUNT(CASE WHEN role = 'seller' THEN 1 END)::int AS total_sellers,
      COUNT(CASE WHEN role = 'seller' AND seller_status = 'pending' THEN 1 END)::int AS pending_sellers,
      COUNT(CASE WHEN role = 'seller' AND seller_status = 'approved' THEN 1 END)::int AS approved_sellers
    FROM users
  `);
  const userStats = userStatsRes.rows[0];

  const productStatsRes = await query(`
    SELECT
      COUNT(*)::int AS total_products,
      COALESCE(SUM(stock), 0)::int AS total_stock
    FROM products
  `);
  const productStats = productStatsRes.rows[0];

  const orderStatsRes = await query(`
    SELECT
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(total_amount), 0)::int AS total_revenue,
      COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_orders
    FROM orders
  `);
  const orderStats = orderStatsRes.rows[0];

  const campusStatsRes = await query(`SELECT COUNT(*)::int AS total_campuses FROM campuses`);
  const totalCampuses = campusStatsRes.rows[0]?.total_campuses || 0;

  const pendingSellersRes = await query(`
    SELECT u.id, u.name, u.email, u.phone, u.created_at,
           s.name AS store_name, s.location,
           c.short_name AS campus_short_name, c.city AS campus_city
    FROM users u
    JOIN stores s ON s.user_id = u.id
    JOIN campuses c ON c.id = u.campus_id
    WHERE u.role = 'seller' AND u.seller_status = 'pending'
    ORDER BY u.created_at DESC
    LIMIT 5
  `);
  const pendingSellers = pendingSellersRes.rows;

  const recentOrdersRes = await query(`
    SELECT o.id, o.order_code, o.buyer_name, o.store_name, o.status,
           o.total_amount, o.delivery_method, o.created_at
    FROM orders o
    ORDER BY o.created_at DESC
    LIMIT 5
  `);
  const recentOrders = recentOrdersRes.rows;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Ringkasan Statistik Nasional
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Pantau aktivitas pengguna, verifikasi toko, dan transaksi lintas kampus Indonesia.
          </p>
        </div>
        <Link
          href="/admin/campuses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-blue-soft text-brand-blue hover:bg-info-bg transition-colors w-fit tabular-nums"
        >
          <GraduationCap className="w-4 h-4" aria-hidden="true" />
          <span>{totalCampuses} Kampus Terdaftar</span>
        </Link>
      </div>

      {userStats.pending_sellers > 0 && (
        <div className="p-4 md:p-5 rounded-xl bg-warning-bg border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface text-warning-text border border-amber-200 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                Ada {userStats.pending_sellers} Pendaftaran Penjual Baru
              </h2>
              <p className="text-xs text-ink-secondary">
                Toko belum dapat mengunggah barang sebelum diverifikasi dan disetujui admin.
              </p>
            </div>
          </div>
          <Button href="/admin/sellers?status=pending" variant="primary" size="sm">
            Tinjau Pendaftar
          </Button>
        </div>
      )}

      {/* Grid Kartu Metrik Utama 3D */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="perspective-stage">
          <div data-tilt-3d="kpi" className="tilt-3d card-3d rounded-2xl p-5 h-full flex flex-col justify-between overflow-hidden">
            <div className="tilt-glare" aria-hidden="true" />
            <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
              <span className="text-xs font-semibold">Total Pengguna</span>
              <span className="w-8 h-8 rounded-lg icon-plinth-3d text-brand-blue flex items-center justify-center">
                <Users className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="depth-layer-2 text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              {userStats.total_users}
            </div>
            <div className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle flex items-center justify-between">
              <span>{userStats.total_buyers} Pembeli</span>
              <span>{userStats.total_sellers} Penjual</span>
            </div>
          </div>
        </div>

        <div className="perspective-stage">
          <div data-tilt-3d="kpi" className="tilt-3d card-3d rounded-2xl p-5 h-full flex flex-col justify-between overflow-hidden">
            <div className="tilt-glare" aria-hidden="true" />
            <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
              <span className="text-xs font-semibold">Toko Terverifikasi</span>
              <span className="w-8 h-8 rounded-lg bg-success-bg border border-green-200 text-success-text shadow-[0_2px_0_#BBF7D0] flex items-center justify-center">
                <Store className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="depth-layer-2 text-2xl md:text-3xl font-extrabold text-success-text tracking-tight">
              {userStats.approved_sellers}
            </div>
            <div className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle flex items-center justify-between">
              <span>{userStats.pending_sellers} Menunggu</span>
              <Link href="/admin/sellers" className="text-brand-blue font-semibold hover:underline">
                Kelola
              </Link>
            </div>
          </div>
        </div>

        <div className="perspective-stage">
          <div data-tilt-3d="kpi" className="tilt-3d card-3d rounded-2xl p-5 h-full flex flex-col justify-between overflow-hidden">
            <div className="tilt-glare" aria-hidden="true" />
            <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
              <span className="text-xs font-semibold">Produk Dilepas</span>
              <span className="w-8 h-8 rounded-lg icon-plinth-3d text-brand-blue flex items-center justify-center">
                <Package className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="depth-layer-2 text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              {productStats.total_products}
            </div>
            <div className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle flex items-center justify-between">
              <span>{productStats.total_stock} Total Stok</span>
              <Link href="/admin/products" className="text-brand-blue font-semibold hover:underline">
                Moderasi
              </Link>
            </div>
          </div>
        </div>

        <div className="perspective-stage">
          <div data-tilt-3d="kpi" className="tilt-3d card-3d rounded-2xl p-5 h-full flex flex-col justify-between overflow-hidden">
            <div className="tilt-glare" aria-hidden="true" />
            <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
              <span className="text-xs font-semibold">Volume Transaksi</span>
              <span className="w-8 h-8 rounded-lg icon-plinth-gold text-ink flex items-center justify-center">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="depth-layer-2 text-xl md:text-2xl font-extrabold text-ink tracking-tight truncate">
              {formatRupiah(orderStats.total_revenue)}
            </div>
            <div className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle flex items-center justify-between">
              <span>{orderStats.total_orders} Pesanan</span>
              <span className="text-success-text font-semibold">{orderStats.completed_orders} Selesai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel 1: Verifikasi Penjual Terbaru */}
      <section className="surface-3d rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">Verifikasi Penjual Terbaru</h2>
            <p className="text-xs text-ink-muted">Mahasiswa yang baru mendaftarkan toko preloved.</p>
          </div>
          <Link href="/admin/sellers" className="text-xs font-semibold text-brand-blue hover:underline">
            Semua Penjual
          </Link>
        </div>

        {pendingSellers.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-muted">
            Tidak ada pendaftar penjual yang menunggu verifikasi saat ini.
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-border-subtle">
              {pendingSellers.map((s) => (
                <div key={s.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-ink truncate">{s.name}</div>
                      <div className="text-xs text-brand-blue font-semibold flex items-center gap-1 mt-0.5">
                        <Store className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{s.store_name}</span>
                      </div>
                    </div>
                    <Button href="/admin/sellers" variant="secondary" size="sm" className="shrink-0">
                      Tinjau
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted pt-1 border-t border-border-subtle">
                    <span className="font-semibold text-brand-blue flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{s.campus_short_name} ({s.campus_city})</span>
                    </span>
                    <span className="truncate max-w-full">{s.email}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs xl:text-sm">
                <thead className="bg-surface-muted text-ink-subtle font-semibold border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Penjual & Toko</th>
                    <th className="py-3 px-4">Kampus</th>
                    <th className="hidden xl:table-cell py-3 px-4">Kontak</th>
                    <th className="py-3 px-4 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {pendingSellers.map((s) => (
                    <tr key={s.id} className="hover:bg-canvas transition-colors">
                      <td className="py-3.5 px-4 min-w-0">
                        <div className="font-bold text-ink truncate max-w-[180px] xl:max-w-none">{s.name}</div>
                        <div className="text-xs text-brand-blue font-semibold flex items-center gap-1 mt-0.5">
                          <Store className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate max-w-[160px] xl:max-w-none">{s.store_name}</span>
                        </div>
                        <div className="xl:hidden text-xs text-ink-muted truncate max-w-[180px] mt-0.5">
                          {s.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-brand-blue flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{s.campus_short_name}</span>
                        </div>
                        <div className="text-xs text-ink-muted">{s.campus_city}</div>
                      </td>
                      <td className="hidden xl:table-cell py-3.5 px-4 min-w-0">
                        <div className="text-ink truncate max-w-[220px]">{s.email}</div>
                        <div className="text-xs text-ink-muted tabular-nums">{s.phone || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button href="/admin/sellers" variant="secondary" size="sm">
                          Tinjau
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Tabel 2: Aktivitas Pesanan Terbaru */}
      <section className="surface-3d rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border-subtle">
          <h2 className="text-base font-bold text-ink">Aktivitas Pesanan Terbaru</h2>
          <p className="text-xs text-ink-muted">Transaksi jual beli terbaru di platform.</p>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-muted">
            Belum ada data pesanan transaksi.
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-border-subtle">
              {recentOrders.map((o) => (
                <div key={o.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular-nums font-bold tracking-wide text-ink text-xs">
                      #{o.order_code}
                    </span>
                    <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">{o.buyer_name}</div>
                      <div className="text-xs text-ink-muted truncate">Ke: {o.store_name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold tabular-nums text-ink">{formatRupiah(o.total_amount)}</div>
                      <div className="text-xs text-ink-muted">
                        {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Kirim Paket'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs xl:text-sm">
                <thead className="bg-surface-muted text-ink-subtle font-semibold border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Kode Pesanan</th>
                    <th className="py-3 px-4">Pembeli & Toko</th>
                    <th className="py-3 px-4 hidden xl:table-cell">Metode</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-canvas transition-colors">
                      <td className="py-3.5 px-4 tabular-nums font-bold text-ink text-xs whitespace-nowrap">
                        #{o.order_code}
                      </td>
                      <td className="py-3.5 px-4 min-w-0">
                        <div className="font-semibold text-ink truncate max-w-[160px] xl:max-w-none">{o.buyer_name}</div>
                        <div className="text-xs text-ink-muted truncate max-w-[160px] xl:max-w-none">Ke: {o.store_name}</div>
                        <div className="text-xs text-ink-muted xl:hidden">
                          {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Kirim Paket'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hidden xl:table-cell text-ink-secondary">
                        {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Kirim Paket'}
                      </td>
                      <td className="py-3.5 px-4 font-bold tabular-nums text-ink whitespace-nowrap">
                        {formatRupiah(o.total_amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
