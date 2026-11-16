import { requireApprovedSeller } from '@/lib/auth';
import { query } from '@/lib/db';
import { ShoppingBag, Store, MapPin } from 'lucide-react';
import { OrderStatusBadge, formatRupiah } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SellerOrderActions from './SellerOrderActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pesanan Masuk — Penjual LepasIn',
};

export default async function SellerOrdersPage() {
  const seller = await requireApprovedSeller();

  const storeRes = await query(`SELECT id FROM stores WHERE user_id = $1`, [seller.id]);
  const store = storeRes.rows[0];

  if (!store) {
    return (
      <div className="bg-canvas border border-line rounded-card p-12 text-center text-xs text-ink-soft">
        Toko Anda belum siap atau belum terdaftar. Silakan hubungi admin.
      </div>
    );
  }

  const ordersRes = await query(
    `SELECT o.id, o.order_code, o.buyer_name, o.status, o.delivery_method,
            o.shipping_recipient, o.shipping_phone, o.shipping_address,
            o.total_amount, o.note, o.created_at,
            (SELECT json_agg(json_build_object(
              'id', oi.id,
              'name', oi.product_name,
              'price', oi.unit_price,
              'quantity', oi.quantity,
              'subtotal', oi.subtotal
            )) FROM order_items oi WHERE oi.order_id = o.id) AS items
     FROM orders o
     WHERE o.store_id = $1
     ORDER BY o.created_at DESC`,
    [store.id]
  );
  const orders = ordersRes.rows;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <span>Pesanan Masuk ke Tokomu</span>
        </h1>
        <p className="text-xs md:text-sm text-ink-soft mt-1">
          Kelola pesanan dari pembeli, atur jadwal ketemuan COD sekampus atau kirim ke kost pembeli.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-canvas border border-line rounded-card p-12 text-center text-xs text-ink-soft">
          Belum ada pesanan masuk saat ini.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-ink">#{o.order_code}</span>
                  <span className="text-line">·</span>
                  <span className="text-ink font-semibold">Pembeli: {o.buyer_name}</span>
                </div>
                <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
              </div>

              <div className="flex flex-col gap-2 py-1">
                {o.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs md:text-sm">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="font-medium text-ink truncate">{item.name}</span>
                      <span className="text-ink-soft font-semibold">x{item.quantity}</span>
                    </div>
                    <span className="font-bold text-ink ml-2">
                      {formatRupiah(item.subtotal || item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {o.note && (
                <div className="text-[11px] text-ink-soft bg-surface p-2.5 rounded-lg border border-line/60">
                  <strong>Catatan dari Pembeli:</strong> {o.note}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line/60 text-xs">
                <div>
                  Metode:{' '}
                  <strong className="text-ink capitalize">
                    {o.delivery_method === 'meetup' ? 'COD Ketemuan Sekampus' : 'Kirim ke Alamat'}
                  </strong>
                </div>
                <div className="text-base font-extrabold text-primary">
                  {formatRupiah(o.total_amount)}
                </div>
              </div>

              {/* Tombol Aksi Pesanan untuk Seller */}
              <SellerOrderActions
                orderId={o.id}
                currentStatus={o.status}
                deliveryMethod={o.delivery_method}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
