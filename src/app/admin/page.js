import Link from 'next/link';
import {
  Users,
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { formatRupiah, SellerStatusBadge, OrderStatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ringkasan Statistik — Admin LepasIn',
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  // 1. Hitung total user & role
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

  // 2. Hitung statistik produk
  const productStatsRes = await query(`
    SELECT
      COUNT(*)::int AS total_products,
      COALESCE(SUM(stock), 0)::int AS total_stock
    FROM products
  `);
  const productStats = productStatsRes.rows[0];

  // 3. Hitung statistik pesanan & transaksi
  const orderStatsRes = await query(`
    SELECT
      COUNT(*)::int AS total_orders,
      COALESCE(SUM(total_amount), 0)::int AS total_revenue,
      COUNT(CASE WHEN status = 'completed' THEN 1 END)::int AS completed_orders
    FROM orders
  `);
  const orderStats = orderStatsRes.rows[0];

  // 4. Hitung jumlah kampus
  const campusStatsRes = await query(`SELECT COUNT(*)::int AS total_campuses FROM campuses`);
  const totalCampuses = campusStatsRes.rows[0]?.total_campuses || 0;

  // 5. Ambil 5 seller pending terbaru untuk ditindak
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

  // 6. Ambil 5 transaksi pesanan terbaru
  const recentOrdersRes = await query(`
    SELECT o.id, o.order_code, o.buyer_name, o.store_name, o.status,
           o.total_amount, o.delivery_method, o.created_at
    FROM orders o
    ORDER BY o.created_at DESC
    LIMIT 5
  `);
  const recentOrders = recentOrdersRes.rows;

  return (
    <div className="flex flex-col gap-8">
      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
          Ringkasan Statistik Nasional
        </h1>
        <p className="text-xs md:text-sm text-ink-soft mt-1">
          Pantau aktivitas transaksi preloved mahasiswa dari seluruh kampus Indonesia.
        </p>
      </div>

      {/* Kartu Peringatan Seller Pending (Jika ada) */}
      {userStats.pending_sellers > 0 && (
        <div className="p-4 md:p-5 rounded-card bg-warning-50 border border-warning/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">
                Ada {userStats.pending_sellers} Pendaftaran Penjual Baru
              </h2>
              <p className="text-xs text-ink-soft">
                Toko belum dapat mengunggah barang dan bertransaksi sebelum disetujui.
              </p>
            </div>
          </div>
          <Link href="/admin/sellers?status=pending">
            <Button variant="primary" size="sm" pill>
              <span>Tinjau Pendaftar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Grid Kartu Metrik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Pengguna */}
        <div className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="text-xs font-semibold">Total Pengguna</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="font-display text-2xl md:text-3xl font-bold tabular-nums text-ink tracking-tight">
            {userStats.total_users}
          </div>
          <div className="text-[11px] text-ink-soft mt-2 pt-2 border-t border-line/60 flex items-center justify-between tabular-nums">
            <span>{userStats.total_buyers} Pembeli</span>
            <span>{userStats.total_sellers} Penjual</span>
          </div>
        </div>

        {/* Total Toko Aktif */}
        <div className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="text-xs font-semibold">Toko Terverifikasi</span>
            <Store className="w-4 h-4 text-pine" />
          </div>
          <div className="font-display text-2xl md:text-3xl font-bold tabular-nums text-pine tracking-tight">
            {userStats.approved_sellers}
          </div>
          <div className="text-[11px] text-ink-soft mt-2 pt-2 border-t border-line/60 flex items-center justify-between tabular-nums">
            <span>{userStats.pending_sellers} Menunggu</span>
            <Link href="/admin/sellers" className="text-primary hover:underline">
              Kelola →
            </Link>
          </div>
        </div>

        {/* Total Produk */}
        <div className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="text-xs font-semibold">Produk Dilepas</span>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="font-display text-2xl md:text-3xl font-bold tabular-nums text-ink tracking-tight">
            {productStats.total_products}
          </div>
          <div className="text-[11px] text-ink-soft mt-2 pt-2 border-t border-line/60 flex items-center justify-between tabular-nums">
            <span>{productStats.total_stock} Total Stok</span>
            <Link href="/admin/products" className="text-primary hover:underline">
              Moderasi →
            </Link>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="text-xs font-semibold">Volume Transaksi</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="font-display text-xl md:text-2xl font-bold tabular-nums text-ink tracking-tight truncate">
            {formatRupiah(orderStats.total_revenue)}
          </div>
          <div className="text-[11px] text-ink-soft mt-2 pt-2 border-t border-line/60 flex items-center justify-between tabular-nums">
            <span>{orderStats.total_orders} Total Pesanan</span>
            <span className="text-success font-semibold">{orderStats.completed_orders} Selesai</span>
          </div>
        </div>
      </div>

      {/* Tabel 1: Seller yang Menunggu Persetujuan */}
      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">Verifikasi Penjual Terbaru</h2>
            <p className="text-xs text-ink-soft">Daftar mahasiswa yang baru mendaftarkan toko preloved.</p>
          </div>
          <Link href="/admin/sellers">
            <Button variant="ghost" size="sm" pill>
              <span>Semua Penjual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {pendingSellers.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-soft">
            Tidak ada pendaftar penjual yang menunggu verifikasi saat ini.
          </div>
        ) : (
          <>
            {/* Mobile Card Stack */}
            <div className="md:hidden divide-y divide-line/60">
              {pendingSellers.map((s) => (
                <div key={s.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-ink truncate">{s.name}</div>
                      <div className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
                        <Store className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{s.store_name}</span>
                      </div>
                    </div>
                    <Link href="/admin/sellers" className="shrink-0">
                      <Button variant="secondary" size="sm" pill>
                        Tinjau
                      </Button>
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft pt-1 border-t border-line/40">
                    <span className="font-semibold text-pine flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      <span>{s.campus_short_name} ({s.campus_city})</span>
                    </span>
                    <span className="truncate max-w-full">{s.email}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet & Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs xl:text-sm">
                <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
                  <tr>
                    <th className="py-3 px-3 xl:px-4">Penjual &amp; Toko</th>
                    <th className="py-3 px-3 xl:px-4">Kampus</th>
                    <th className="hidden xl:table-cell py-3 px-4">Kontak</th>
                    <th className="py-3 px-3 xl:px-4 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {pendingSellers.map((s) => (
                    <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3.5 px-3 xl:px-4 min-w-0">
                        <div className="font-bold text-ink truncate max-w-[180px] xl:max-w-none">{s.name}</div>
                        <div className="text-xs text-primary font-semibold flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[160px] xl:max-w-none">{s.store_name}</span>
                        </div>
                        <div className="xl:hidden text-[11px] text-ink-soft truncate max-w-[180px] mt-0.5">
                          {s.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 xl:px-4">
                        <div className="font-semibold text-pine flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                          <span>{s.campus_short_name}</span>
                        </div>
                        <div className="text-[11px] text-ink-soft">{s.campus_city}</div>
                      </td>
                      <td className="hidden xl:table-cell py-3.5 px-4 min-w-0">
                        <div className="text-ink truncate max-w-[220px]">{s.email}</div>
                        <div className="text-[11px] text-ink-soft tabular-nums">{s.phone || '-'}</div>
                      </td>
                      <td className="py-3.5 px-3 xl:px-4 text-right">
                        <Link href="/admin/sellers">
                          <Button variant="secondary" size="sm" pill>
                            Tinjau
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Tabel 2: Riwayat Pesanan Terbaru */}
      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Aktivitas Pesanan Terbaru</h2>
            <p className="text-xs text-ink-soft">Transaksi jual beli yang baru dibuat oleh pembeli.</p>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-soft">
            Belum ada data pesanan transaksi.
          </div>
        ) : (
          <>
            {/* Mobile Card Stack */}
            <div className="md:hidden divide-y divide-line/60">
              {recentOrders.map((o) => (
                <div key={o.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans tabular-nums font-bold tracking-wide text-ink text-xs">
                      #{o.order_code}
                    </span>
                    <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">{o.buyer_name}</div>
                      <div className="text-[11px] text-ink-soft truncate">Ke: {o.store_name}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold tabular-nums text-ink">{formatRupiah(o.total_amount)}</div>
                      <div className="text-[11px] text-ink-soft">
                        {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Kirim Paket'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet & Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs xl:text-sm">
                <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
                  <tr>
                    <th className="py-3 px-3 xl:px-4">Kode Pesanan</th>
                    <th className="py-3 px-3 xl:px-4">Pembeli &amp; Toko</th>
                    <th className="py-3 px-3 xl:px-4 hidden xl:table-cell">Metode</th>
                    <th className="py-3 px-3 xl:px-4">Total</th>
                    <th className="py-3 px-3 xl:px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3.5 px-3 xl:px-4 font-sans tabular-nums font-bold tracking-wide text-ink text-xs whitespace-nowrap">
                        {o.order_code}
                      </td>
                      <td className="py-3.5 px-3 xl:px-4 min-w-0">
                        <div className="font-semibold text-ink truncate max-w-[155px] xl:max-w-none">{o.buyer_name}</div>
                        <div className="text-[11px] text-ink-soft truncate max-w-[155px] xl:max-w-none">Ke: {o.store_name}</div>
                        <div className="text-[11px] text-ink-soft xl:hidden">
                          {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Kirim Paket'}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 xl:px-4 hidden xl:table-cell">
                        <span className="text-xs font-medium capitalize">
                          {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Kirim Paket'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 xl:px-4 font-bold tabular-nums text-ink whitespace-nowrap">
                        {formatRupiah(o.total_amount)}
                      </td>
                      <td className="py-3.5 px-3 xl:px-4">
                        <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
