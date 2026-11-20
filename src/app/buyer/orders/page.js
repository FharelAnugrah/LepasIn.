import Link from 'next/link';
import { Package, Store, Star } from 'lucide-react';
import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import BuyerDashboardShell from '@/components/layout/BuyerDashboardShell';
import OrderStatusStepper from '@/components/ui/OrderStatusStepper';
import { OrderStatusBadge, formatRupiah } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ReviewForm from './ReviewForm';
import BuyerOrderActions from './BuyerOrderActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Riwayat Pesanan | LepasIn',
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
    <BuyerDashboardShell user={buyer} cartCount={cartCount} cartTotal={cartTotal}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-blue" aria-hidden="true" />
            <span>Riwayat Pesanan Saya</span>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Lacak progres pesanan COD kampus maupun pengiriman ke kost dan beri ulasan setelah selesai.
          </p>
        </div>

        {/* Tab Status Filter */}
        <nav
          aria-label="Filter status pesanan"
          className="flex items-center gap-2 p-1.5 surface-3d rounded-2xl overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/buyer/orders${tab.id === 'all' ? '' : `?status=${tab.id}`}`}
              aria-current={statusFilter === tab.id ? 'page' : undefined}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap inline-flex items-center ${
                statusFilter === tab.id
                  ? 'chip-3d-active font-semibold'
                  : 'chip-3d font-medium'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {orders.length === 0 ? (
          <div className="surface-3d rounded-2xl p-10 text-center max-w-md mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl icon-plinth-3d text-brand-blue flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-ink mb-1">Belum Ada Pesanan</h2>
            <p className="text-xs md:text-sm text-ink-muted mb-5 leading-relaxed">
              Belum ada pesanan preloved dengan status ini.
            </p>
            <Button href="/products" variant="primary">Mulai Belanja</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {orders.map((o) => (
              <article
                key={o.id}
                className="card-3d rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="p-5 flex flex-col gap-4">
                  {/* Header Kartu Pesanan */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="tabular-nums font-bold tracking-wide text-ink">
                        #{o.order_code}
                      </span>
                      <span className="text-border-subtle" aria-hidden="true">|</span>
                      <span className="text-ink-secondary font-medium inline-flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                        <span>{o.store_name}</span>
                      </span>
                    </div>
                    <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
                  </div>

                  {/* Stepper Tracking 4 Tahap (ORD-2, ORD-7, design2.md 5.6) */}
                  <OrderStatusStepper status={o.status} deliveryMethod={o.delivery_method} />

                  {/* Daftar Item */}
                  <div className="flex flex-col gap-3 pt-1">
                    {o.items?.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex flex-col gap-2 pb-3 border-b border-border-subtle last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-semibold text-ink truncate">{item.name}</span>
                            <span className="text-ink-muted font-semibold shrink-0 tabular-nums">
                              x{item.quantity}
                            </span>
                          </div>
                          <span className="font-bold tabular-nums text-ink shrink-0">
                            {formatRupiah(item.subtotal || item.price * item.quantity)}
                          </span>
                        </div>

                        {o.status === 'completed' && (
                          <div>
                            {item.review ? (
                              <div className="text-xs text-ink-secondary bg-canvas px-3.5 py-2 rounded-lg border border-border-subtle flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5 font-semibold min-w-0">
                                  <Star
                                    className="w-3.5 h-3.5 fill-campus-gold text-campus-gold shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="text-ink tabular-nums">{item.review.rating} / 5</span>
                                  {item.review.comment && (
                                    <span className="text-ink-secondary font-normal ml-1 break-words">
                                      &ldquo;{item.review.comment}&rdquo;
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-success-text bg-success-bg px-2 py-0.5 rounded-md font-semibold shrink-0">
                                  Sudah Diulas
                                </span>
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

                  {o.note && (
                    <div className="text-xs text-ink-secondary bg-canvas p-3 rounded-lg border border-border-subtle">
                      <strong className="text-ink">Catatan:</strong> {o.note}
                    </div>
                  )}

                  {/* Footer Ringkasan */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border-subtle">
                    <div className="text-xs text-ink-muted">
                      Metode:{' '}
                      <strong className="text-ink">
                        {o.delivery_method === 'meetup' ? 'COD Ketemuan di Kampus' : 'Dikirim ke Alamat'}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-ink-muted block">Total Pesanan</span>
                      <span className="text-base font-bold text-brand-blue tabular-nums">
                        {formatRupiah(o.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bar Aksi & Banner Anti-Penipuan Buyer (design2.md 5.6) */}
                {o.status === 'shipped' ? (
                  <div className="bg-info-bg border-t border-brand-blue-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-navy-900 leading-relaxed flex-1">
                      <strong className="block font-bold mb-0.5">
                        Periksa kondisi barang sebelum menyelesaikan pesanan
                      </strong>
                      <span>
                        {o.delivery_method === 'meetup'
                          ? 'Pastikan kamu sudah mengecek fisik dan fungsi barang saat ketemuan COD di kampus sebelum menekan tombol Pesanan Diterima.'
                          : 'Pastikan paket sudah tiba di kost dan kondisi barang sesuai deskripsi sebelum menekan tombol Pesanan Diterima.'}
                      </span>
                    </div>
                    <BuyerOrderActions
                      orderId={o.id}
                      status={o.status}
                      deliveryMethod={o.delivery_method}
                    />
                  </div>
                ) : (
                  <div className="bg-canvas border-t border-border-subtle px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink-muted">
                      {o.status === 'pending_payment' &&
                        'Metode COD aktif. Koordinasikan waktu dan titik temu di kampus bersama penjual.'}
                      {o.status === 'processing' &&
                        'Pesanan sedang disiapkan oleh penjual.'}
                      {o.status === 'completed' &&
                        'Transaksi selesai. Silakan berikan ulasan untuk membantu Mahasiswa lain.'}
                      {o.status === 'cancelled' &&
                        'Transaksi dibatalkan dan stok barang telah dikembalikan.'}
                    </p>
                    <BuyerOrderActions
                      orderId={o.id}
                      status={o.status}
                      deliveryMethod={o.delivery_method}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </BuyerDashboardShell>
  );
}
