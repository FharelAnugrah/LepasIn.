import Link from 'next/link';
import { Package, Store, Calendar, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { OrderStatusBadge, formatRupiah } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ReviewForm from './ReviewForm';
import BuyerOrderActions from './BuyerOrderActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Riwayat Pesanan — LepasIn',
};

export default async function BuyerOrdersPage({ searchParams }) {
  const buyer = await requireBuyer('/buyer/orders');
  const sp = await searchParams;
  const statusFilter = sp?.status || 'all';

  let sql = `
    SELECT o.id, o.order_code, o.store_name, o.status, o.delivery_method,
           o.total_amount, o.note, o.created_at,
           (SELECT json_agg(json_build_object(
             'id', oi.id,
             'product_id', oi.product_id,
             'name', oi.product_name,
             'price', oi.unit_price,
             'quantity', oi.quantity,
             'subtotal', oi.subtotal,
             'review', (SELECT json_build_object('id', rv.id, 'rating', rv.rating, 'comment', rv.comment)
                        FROM reviews rv WHERE rv.order_item_id = oi.id)
           )) FROM order_items oi WHERE oi.order_id = o.id) AS items
    FROM orders o
    WHERE o.buyer_id = $1
  `;
  const params = [buyer.id];

  if (statusFilter !== 'all') {
    params.push(statusFilter);
    sql += ` AND o.status = $2`;
  }

  sql += ` ORDER BY o.created_at DESC`;

  const res = await query(sql, params);
  const orders = res.rows;

  const cartRes = await query(
    `SELECT COALESCE(SUM(ci.quantity), 0)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1`,
    [buyer.id]
  );
  const cartCount = cartRes.rows[0]?.count || 0;
  const cartTotal = cartRes.rows[0]?.total || 0;

  const tabs = [
    { id: 'all', label: 'Semua Pesanan' },
    { id: 'pending_payment', label: 'Menunggu' },
    { id: 'processing', label: 'Diproses' },
    { id: 'shipped', label: 'Siap COD / Dikirim' },
    { id: 'completed', label: 'Selesai' },
    { id: 'cancelled', label: 'Dibatalkan' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Navbar user={buyer} cartCount={cartCount} showSearchBar={false} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            <span>Riwayat Pesanan Saya</span>
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Lacak status pengiriman atau jadwal COD ketemuan di kampus bersama penjual.
          </p>
        </div>

        {/* Tab Status Filter */}
        <div className="flex p-1 bg-surface rounded-xl border border-line overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/buyer/orders${tab.id === 'all' ? '' : `?status=${tab.id}`}`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-canvas text-primary shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* List Pesanan */}
        {orders.length === 0 ? (
          <div className="bg-canvas border border-line rounded-card p-12 text-center max-w-md mx-auto shadow-card my-6">
            <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-ink mb-1">Belum Ada Pesanan</h2>
            <p className="text-xs text-ink-soft mb-6 leading-relaxed">
              Kamu belum melakukan pemesanan barang preloved dengan status ini.
            </p>
            <Link href="/products">
              <Button variant="primary" pill>
                <span>Mulai Belanja</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col gap-3"
              >
                {/* Header Kartu Pesanan */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-ink">#{o.order_code}</span>
                    <span className="text-line">·</span>
                    <span className="text-ink-soft flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-primary" />
                      <span>{o.store_name}</span>
                    </span>
                  </div>
                  <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
                </div>

                {/* Daftar Item dalam Pesanan */}
                <div className="flex flex-col gap-3 py-1">
                  {o.items?.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 pb-2 border-b border-line/40 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-2 truncate flex-1">
                          <span className="font-medium text-ink truncate">{item.name}</span>
                          <span className="text-ink-soft font-semibold">x{item.quantity}</span>
                        </div>
                        <span className="font-bold text-ink ml-2">
                          {formatRupiah(item.subtotal || item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Area Ulasan jika pesanan selesai */}
                      {o.status === 'completed' && (
                        <div className="pt-1">
                          {item.review ? (
                            <div className="text-[11px] text-ink-soft bg-surface/70 px-3 py-1.5 rounded-lg border border-line/60 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-accent font-bold">
                                <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                                <span>{item.review.rating} / 5</span>
                                {item.review.comment && (
                                  <span className="text-ink-soft font-normal ml-1">
                                    &ldquo;{item.review.comment}&rdquo;
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-pine font-semibold">Sudah Diulas</span>
                            </div>
                          ) : (
                            <ReviewForm
                              orderItemId={item.id}
                              productId={item.product_id}
                              productName={item.name}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Catatan / Alamat bila ada */}
                {o.note && (
                  <div className="text-[11px] text-ink-soft bg-surface p-2.5 rounded-lg border border-line/60">
                    <strong>Catatan:</strong> {o.note}
                  </div>
                )}

                {/* Footer Pesanan: Total & Metode */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line/60">
                  <div className="text-xs text-ink-soft">
                    Metode:{' '}
                    <strong className="text-ink capitalize">
                      {o.delivery_method === 'meetup' ? 'COD Ketemuan di Kampus' : 'Pengiriman ke Kost'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-ink-soft block">Total Pesanan</span>
                      <span className="text-base font-extrabold text-primary">
                        {formatRupiah(o.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bar Aksi Pesanan (Chat Penjual, Konfirmasi Diterima) */}
                <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60 -mx-5 -mb-5 p-4 rounded-b-card ${
                  o.status === 'shipped'
                    ? 'bg-primary-50/50'
                    : 'bg-surface/50'
                }`}>
                  <div className="text-xs text-ink-soft flex-1 min-w-[200px]">
                    {o.status === 'pending_payment' && (
                      <span className="text-ink-soft">
                        Metode COD aktif. Silakan koordinasi titik temu di kampus bersama penjual melalui chat.
                      </span>
                    )}
                    {o.status === 'processing' && (
                      <span className="text-ink-soft">
                        {o.delivery_method === 'delivery'
                          ? 'Pesanan telah dibayar saat checkout dan kini sedang disiapkan/diproses oleh penjual.'
                          : 'Pesanan sedang disiapkan/diproses oleh penjual.'}
                      </span>
                    )}
                    {o.status === 'shipped' && (
                      <span>
                        {o.delivery_method === 'meetup'
                          ? 'Barang sudah siap COD di kampus. Selesaikan pesanan setelah menerima dan mengecek barang bersama penjual.'
                          : 'Pesanan sedang dikirim ke kost. Selesaikan pesanan setelah paket tiba dan barang dicek.'}
                      </span>
                    )}
                    {(o.status === 'completed' || o.status === 'cancelled') && (
                      <span>
                        Transaksi {o.status === 'completed' ? 'telah selesai.' : 'telah dibatalkan.'} Hubungi penjual jika ada kendala.
                      </span>
                    )}
                  </div>
                  <BuyerOrderActions
                    orderId={o.id}
                    status={o.status}
                    deliveryMethod={o.delivery_method}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <BottomNav user={buyer} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
