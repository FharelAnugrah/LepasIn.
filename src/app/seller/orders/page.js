import { requireApprovedSeller } from '@/lib/auth';
import { query } from '@/lib/db';
import { ShoppingBag, MapPin } from 'lucide-react';
import OrderStatusStepper from '@/components/ui/OrderStatusStepper';
import { OrderStatusBadge, formatRupiah } from '@/components/ui/Badge';
import SellerOrderActions from './SellerOrderActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pesanan Masuk | Penjual LepasIn',
};

export default async function SellerOrdersPage() {
  const seller = await requireApprovedSeller();

  const storeRes = await query(`SELECT id FROM stores WHERE user_id = $1`, [seller.id]);
  const store = storeRes.rows[0];

  if (!store) {
    return (
      <div className="bg-surface border border-border-subtle rounded-xl p-10 text-center text-sm text-ink-muted">
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
        <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-brand-blue" aria-hidden="true" />
          <span>Pesanan Masuk ke Tokomu</span>
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Kelola pesanan dari pembeli, atur jadwal COD di kampus atau pengiriman ke alamat kost.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="surface-3d rounded-2xl p-10 text-center text-sm text-ink-muted">
          Belum ada pesanan masuk saat ini.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {orders.map((o) => (
            <article
              key={o.id}
              className="card-3d rounded-2xl p-5 flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="tabular-nums font-bold tracking-wide text-ink">
                    #{o.order_code}
                  </span>
                  <span className="text-border-subtle" aria-hidden="true">|</span>
                  <span className="text-ink-secondary font-semibold">
                    Pembeli: {o.buyer_name}
                  </span>
                </div>
                <OrderStatusBadge status={o.status} deliveryMethod={o.delivery_method} />
              </div>

              <OrderStatusStepper status={o.status} deliveryMethod={o.delivery_method} />

              <div className="flex flex-col gap-2 py-1">
                {o.items?.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span className="font-semibold text-ink truncate">{item.name}</span>
                      <span className="text-ink-muted font-semibold tabular-nums shrink-0">
                        x{item.quantity}
                      </span>
                    </div>
                    <span className="font-bold tabular-nums text-ink shrink-0">
                      {formatRupiah(item.subtotal || item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {o.delivery_method === 'delivery' && o.shipping_address && (
                <div className="text-xs text-ink-secondary bg-canvas p-3 rounded-lg border border-border-subtle flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <strong className="text-ink block">
                      Tujuan Pengiriman: {o.shipping_recipient} ({o.shipping_phone})
                    </strong>
                    <span>{o.shipping_address}</span>
                  </div>
                </div>
              )}

              {o.note && (
                <div className="text-xs text-ink-secondary bg-canvas p-3 rounded-lg border border-border-subtle">
                  <strong className="text-ink">Catatan Pembeli:</strong> {o.note}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border-subtle text-xs">
                <div className="text-ink-muted">
                  Metode:{' '}
                  <strong className="text-ink">
                    {o.delivery_method === 'meetup' ? 'COD Ketemuan di Kampus' : 'Dikirim ke Alamat'}
                  </strong>
                </div>
                <div className="text-base font-bold text-brand-blue tabular-nums">
                  {formatRupiah(o.total_amount)}
                </div>
              </div>

              <SellerOrderActions
                orderId={o.id}
                currentStatus={o.status}
                deliveryMethod={o.delivery_method}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
