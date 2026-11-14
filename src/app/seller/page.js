import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Store,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { query } from '@/lib/db';
import { requireApprovedSeller } from '@/lib/auth';
import { formatRupiah, OrderStatusBadge, ConditionBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ringkasan Lapak — Penjual LepasIn',
};

export default async function SellerDashboardPage() {
  const seller = await requireApprovedSeller();

  const storeRes = await query(`SELECT id, name, location FROM stores WHERE user_id = $1`, [
    seller.id,
  ]);
  const store = storeRes.rows[0];

  if (!store) {
    return (
      <div className="p-8 text-center text-ink-soft">
        Toko Anda belum siap. Silakan hubungi admin.
      </div>
    );
  }

  // 1. Statistik Lapak
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

  // 2. Pesanan Masuk Terbaru
  const ordersRes = await query(
    `SELECT id, order_code, buyer_name, status, delivery_method, total_amount, created_at
     FROM orders
     WHERE store_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [store.id]
  );
  const recentOrders = ordersRes.rows;

  // 3. Produk Lapak Terbaru
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
    <div className="flex flex-col gap-8">
      {/* Header & Tombol Tambah Barang */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Ringkasan Lapak Mahasiswa
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Pantau barang kost yang kamu lepas dan kelola pesanan dari teman sekampus.
          </p>
        </div>
        <Link href="/seller/products/new">
          <Button variant="primary" pill>
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </Button>
        </Link>
      </div>

      {/* Grid Kartu Metrik Toko */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Barang */}
        <div className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="text-xs font-semibold">Total Produk Lapak</span>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            {stats.total_products}
          </div>
          <div className="text-[11px] text-ink-soft mt-2 pt-2 border-t border-line/60">
            Total stok fisik: <strong className="text-ink">{stats.total_stock} item</strong>
          </div>
        </div>

        {/* Pesanan Baru */}
        <div className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="text-xs font-semibold">Pesanan Perlu Diproses</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-warning tracking-tight">
            {stats.new_orders}
          </div>
          <div className="text-[11px] text-ink-soft mt-2 pt-2 border-t border-line/60 flex items-center justify-between">
            <span>Menunggu & diproses</span>
            <Link href="/seller/orders" className="text-primary hover:underline">
              Buka pesanan →
            </Link>
          </div>
        </div>

        {/* Pendapatan Selesai */}
        <div className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-ink-soft mb-2">
            <span className="text-xs font-semibold">Total Pendapatan Selesai</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <div className="text-xl md:text-2xl font-extrabold text-ink tracking-tight truncate">
            {formatRupiah(stats.total_earnings)}
          </div>
          <div className="text-[11px] text-ink-soft mt-2 pt-2 border-t border-line/60">
            Hasil penjualan barang preloved
          </div>
        </div>
      </div>

      {/* Tabel Pesanan Masuk Terbaru */}
      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Pesanan Masuk Terbaru</h2>
            <p className="text-xs text-ink-soft">Pesanan dari mahasiswa yang membeli barangmu.</p>
          </div>
          <Link href="/seller/orders">
            <Button variant="ghost" size="sm" pill>
              <span>Semua Pesanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-soft">
            Belum ada pesanan masuk ke tokomu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
                <tr>
                  <th className="py-3 px-4">Kode Pesanan</th>
                  <th className="py-3 px-4">Nama Pembeli</th>
                  <th className="py-3 px-4">Metode Pengiriman</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-ink">
                      {o.order_code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink">
                      {o.buyer_name}
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      {o.delivery_method === 'meetup' ? 'COD Sekampus' : 'Dikirim ke Kost'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-ink">
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
        )}
      </div>

      {/* Tabel Produk Lapak Terbaru */}
      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Barang Lapakmu</h2>
            <p className="text-xs text-ink-soft">Produk yang saat ini tampil di katalog sekampus.</p>
          </div>
          <Link href="/seller/products">
            <Button variant="ghost" size="sm" pill>
              <span>Semua Produk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-soft">
            Kamu belum menambahkan produk ke lapak ini.{' '}
            <Link href="/seller/products/new" className="text-primary font-bold hover:underline">
              Unggah barang sekarang
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
                <tr>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Kondisi</th>
                  <th className="py-3 px-4">Harga</th>
                  <th className="py-3 px-4">Sisa Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {recentProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-ink flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary shrink-0" />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-soft">
                      {p.category_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <ConditionBadge condition={p.condition} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-ink">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold ${
                          p.stock <= 0 ? 'text-danger' : 'text-ink'
                        }`}
                      >
                        {p.stock <= 0 ? 'Habis (0)' : `${p.stock} item`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
