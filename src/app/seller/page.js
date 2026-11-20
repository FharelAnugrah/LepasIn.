import Link from 'next/link';
import {
  Package,
  TrendingUp,
  Plus,
  Clock,
} from 'lucide-react';
import { query } from '@/lib/db';
import { requireApprovedSeller } from '@/lib/auth';
import { formatRupiah, OrderStatusBadge, ConditionBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ringkasan Lapak | Penjual LepasIn',
};

export default async function SellerDashboardPage() {
  const seller = await requireApprovedSeller();

  const storeRes = await query(`SELECT id, name, location FROM stores WHERE user_id = $1`, [
    seller.id,
  ]);
  const store = storeRes.rows[0];

  if (!store) {
    return (
      <div className="p-8 text-center bg-surface border border-border-subtle rounded-xl text-sm text-ink-muted">
        Toko Anda belum siap. Silakan hubungi admin.
      </div>
    );
  }

  const statsRes = await query(
    `SELECT
      COUNT(p.id)::int AS total_products,
      COALESCE(SUM(p.stock), 0)::int AS total_stock,
      (SELECT COUNT(*)::int FROM orders WHERE store_id = $1 AND status IN ('pending_payment', 'processing')) AS new_orders,
      (SELECT COALESCE(SUM(total_amount), 0)::int FROM orders WHERE store_id = $1 AND status = 'completed') AS total_earnings
     FROM products p
     WHERE p.store_id = $1`,
    [store.id]
  );
  const stats = statsRes.rows[0];

  const ordersRes = await query(
    `SELECT id, order_code, buyer_name, status, delivery_method, total_amount, created_at
     FROM orders
     WHERE store_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [store.id]
  );
  const recentOrders = ordersRes.rows;

  const productsRes = await query(
    `SELECT p.id, p.name, p.price, p.stock, p.condition, c.name AS category_name,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.store_id = $1
     ORDER BY p.created_at DESC
     LIMIT 5`,
    [store.id]
  );
  const recentProducts = productsRes.rows;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Ringkasan Lapak Mahasiswa
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Pantau stok barang kost dan kelola pesanan masuk dari teman sekampus.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards 3D */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
        <div className="perspective-stage">
          <div data-tilt-3d="kpi" className="tilt-3d card-3d rounded-2xl p-5 h-full flex flex-col justify-between overflow-hidden">
            <div className="tilt-glare" aria-hidden="true" />
            <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
              <span className="text-xs font-semibold">Total Produk Lapak</span>
              <span className="w-8 h-8 rounded-lg icon-plinth-3d text-brand-blue flex items-center justify-center">
                <Package className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="depth-layer-2 text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
              {stats.total_products}
            </div>
            <div className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle">
              Total stok fisik: <strong className="text-ink">{stats.total_stock} item</strong>
            </div>
          </div>
        </div>

        <div className="perspective-stage">
          <div data-tilt-3d="kpi" className="tilt-3d card-3d rounded-2xl p-5 h-full flex flex-col justify-between overflow-hidden">
            <div className="tilt-glare" aria-hidden="true" />
            <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
              <span className="text-xs font-semibold">Pesanan Perlu Diproses</span>
              <span className="w-8 h-8 rounded-lg bg-warning-bg border border-amber-200 text-warning-text shadow-[0_2px_0_#FDE68A] flex items-center justify-center">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="depth-layer-2 text-2xl md:text-3xl font-extrabold text-warning-text tracking-tight">
              {stats.new_orders}
            </div>
            <div className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle flex items-center justify-between">
              <span>Menunggu dan diproses</span>
              <Link href="/seller/orders" className="text-brand-blue font-semibold hover:underline">
                Buka pesanan
              </Link>
            </div>
          </div>
        </div>

        <div className="perspective-stage">
          <div data-tilt-3d="kpi" className="tilt-3d card-3d rounded-2xl p-5 h-full flex flex-col justify-between overflow-hidden">
            <div className="tilt-glare" aria-hidden="true" />
            <div className="depth-layer-1 flex items-center justify-between text-ink-muted mb-3">
              <span className="text-xs font-semibold">Pendapatan Selesai</span>
              <span className="w-8 h-8 rounded-lg bg-success-bg border border-green-200 text-success-text shadow-[0_2px_0_#BBF7D0] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
            <div className="depth-layer-2 text-xl md:text-2xl font-extrabold text-ink tracking-tight truncate">
              {formatRupiah(stats.total_earnings)}
            </div>
            <div className="depth-layer-1 text-xs text-ink-muted mt-2.5 pt-2.5 border-t border-border-subtle">
              Dari pesanan berstatus Selesai
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Pesanan Masuk Terbaru */}
      <section className="surface-3d rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">Pesanan Masuk Terbaru</h2>
            <p className="text-xs text-ink-muted">Pesanan terbaru dari pembeli ke tokomu.</p>
          </div>
          <Link href="/seller/orders" className="text-xs font-semibold text-brand-blue hover:underline">
            Semua Pesanan
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-muted">
            Belum ada pesanan masuk ke tokomu.
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-border-subtle">
              {recentOrders.map((o) => (
                <div key={o.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="tabular-nums font-bold text-sm text-ink">
                        #{o.order_code}
                      </p>
                      <p className="text-xs text-ink-muted truncate">{o.buyer_name}</p>
                    </div>
                    <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                    <span className="text-ink-muted">
                      {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Dikirim ke Kost'}
                    </span>
                    <span className="font-bold tabular-nums text-ink">
                      {formatRupiah(o.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-surface-muted text-ink-subtle font-semibold border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Kode Pesanan</th>
                    <th className="py-3 px-4">Nama Pembeli</th>
                    <th className="hidden xl:table-cell py-3 px-4">Metode</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-canvas transition-colors">
                      <td className="py-3.5 px-4 tabular-nums font-bold text-ink">
                        #{o.order_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-ink">{o.buyer_name}</div>
                        <div className="xl:hidden text-xs text-ink-muted mt-0.5">
                          {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Dikirim ke Kost'}
                        </div>
                      </td>
                      <td className="hidden xl:table-cell py-3.5 px-4 text-ink-secondary">
                        {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Dikirim ke Kost'}
                      </td>
                      <td className="py-3.5 px-4 font-bold tabular-nums text-ink">
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

      {/* Tabel Produk Lapak Terbaru */}
      <section className="surface-3d rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border-subtle flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">Barang Lapakmu</h2>
            <p className="text-xs text-ink-muted">Produk terbaru yang tampil di katalog.</p>
          </div>
          <Link href="/seller/products" className="text-xs font-semibold text-brand-blue hover:underline">
            Semua Produk
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-muted">
            Kamu belum menambahkan produk ke lapak ini.{' '}
            <Link href="/seller/products/new" className="text-brand-blue font-semibold hover:underline">
              Unggah barang sekarang
            </Link>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-border-subtle">
              {recentProducts.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-ink flex items-start gap-2 min-w-0">
                      <Package className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="line-clamp-2 break-words">{p.name}</span>
                    </div>
                    <div className="shrink-0">
                      <ConditionBadge condition={p.condition} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs pl-6">
                    <span className="text-ink-muted">{p.category_name}</span>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="font-bold text-ink">{formatRupiah(p.price)}</span>
                      <span className={`font-semibold ${p.stock <= 0 ? 'text-danger-text' : 'text-ink-muted'}`}>
                        {p.stock <= 0 ? 'Habis' : `${p.stock} stok`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-surface-muted text-ink-subtle font-semibold border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="hidden xl:table-cell py-3 px-4">Kategori</th>
                    <th className="hidden xl:table-cell py-3 px-4">Kondisi</th>
                    <th className="py-3 px-4">Harga</th>
                    <th className="py-3 px-4">Sisa Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {recentProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-canvas transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-ink flex items-center gap-2">
                          <Package className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
                          <span>{p.name}</span>
                        </div>
                        <div className="xl:hidden flex flex-wrap items-center gap-1.5 mt-1 pl-6">
                          <span className="text-xs text-ink-muted">{p.category_name}</span>
                          <ConditionBadge condition={p.condition} />
                        </div>
                      </td>
                      <td className="hidden xl:table-cell py-3.5 px-4 text-ink-secondary">
                        {p.category_name}
                      </td>
                      <td className="hidden xl:table-cell py-3.5 px-4">
                        <ConditionBadge condition={p.condition} />
                      </td>
                      <td className="py-3.5 px-4 font-bold tabular-nums text-ink">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <span className={`font-semibold ${p.stock <= 0 ? 'text-danger-text' : 'text-ink'}`}>
                          {p.stock <= 0 ? 'Habis (0)' : `${p.stock} item`}
                        </span>
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
