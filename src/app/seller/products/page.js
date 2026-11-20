import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { requireApprovedSeller } from '@/lib/auth';
import { query } from '@/lib/db';
import Button from '@/components/ui/Button';
import { ConditionBadge, formatRupiah } from '@/components/ui/Badge';
import SellerProductRowActions from './SellerProductRowActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Produk Lapak | Penjual LepasIn',
};

export default async function SellerProductsPage() {
  const seller = await requireApprovedSeller();

  const storeRes = await query(`SELECT id, name FROM stores WHERE user_id = $1`, [seller.id]);
  const store = storeRes.rows[0];

  if (!store) {
    return (
      <div className="bg-surface border border-border-subtle rounded-xl p-10 text-center text-sm text-ink-muted">
        Toko Anda belum siap atau belum terdaftar. Silakan hubungi admin.
      </div>
    );
  }

  const productsRes = await query(
    `SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition, p.created_at,
            c.name AS category_name,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url,
            (SELECT COUNT(*)::int FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = p.id AND o.status IN ('pending_payment', 'processing', 'shipped')) AS active_orders_count,
            (SELECT COUNT(*)::int FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = p.id AND o.status = 'completed') AS completed_orders_count
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.store_id = $1
     ORDER BY p.created_at DESC`,
    [store.id]
  );
  const products = productsRes.rows;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Produk di Lapak Saya
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Kelola barang preloved yang kamu tawarkan ke teman sekampus.
          </p>
        </div>
        <Button href="/seller/products/new" variant="primary" icon={Plus}>
          Tambah Produk
        </Button>
      </div>

      <div className="surface-3d rounded-2xl overflow-hidden">
        {products.length === 0 ? (
          <div className="p-10 text-center text-sm text-ink-muted">
            <p className="mb-4">Belum ada produk yang kamu tambahkan ke lapak ini.</p>
            <Button href="/seller/products/new" variant="primary" size="sm" icon={Plus}>
              Tambah Barang Pertama
            </Button>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-border-subtle">
              {products.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-ink flex items-start gap-2">
                        <Package className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="line-clamp-2 break-words">{p.name}</span>
                      </div>
                      <p className="text-xs text-ink-muted pl-6 mt-0.5">{p.category_name}</p>
                    </div>
                    <div className="shrink-0">
                      <ConditionBadge condition={p.condition} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pl-6 tabular-nums">
                    <div>
                      <div className="font-bold text-sm text-ink">{formatRupiah(p.price)}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold ${p.stock <= 0 ? 'text-danger-text' : 'text-ink-muted'}`}>
                          {p.stock <= 0 ? 'Habis (0)' : `Stok: ${p.stock} item`}
                        </span>
                        {p.active_orders_count > 0 && (
                          <span className="text-[11px] font-semibold text-warning-text bg-warning-bg px-2 py-0.5 rounded-md border border-amber-200">
                            {p.active_orders_count} Dipesan
                          </span>
                        )}
                      </div>
                    </div>
                    <SellerProductRowActions
                      productId={p.id}
                      productName={p.name}
                      activeOrdersCount={p.active_orders_count || 0}
                      completedOrdersCount={p.completed_orders_count || 0}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-surface-muted text-ink-subtle font-semibold border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Produk</th>
                    <th className="hidden xl:table-cell py-3 px-4">Kategori</th>
                    <th className="hidden xl:table-cell py-3 px-4">Kondisi</th>
                    <th className="py-3 px-4">Harga</th>
                    <th className="py-3 px-4">Stok</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-canvas transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-ink">
                        <div className="flex items-start gap-2 max-w-xs">
                          <Package className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="line-clamp-2 break-words">{p.name}</span>
                        </div>
                        <div className="xl:hidden flex flex-wrap items-center gap-1.5 mt-1 pl-6 font-normal">
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
                      <td className="py-3.5 px-4 font-bold tabular-nums text-ink whitespace-nowrap">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`font-semibold whitespace-nowrap ${p.stock <= 0 ? 'text-danger-text' : 'text-ink'}`}>
                            {p.stock <= 0 ? 'Habis (0)' : `${p.stock} item`}
                          </span>
                          {p.active_orders_count > 0 && (
                            <span className="text-[11px] font-semibold text-warning-text bg-warning-bg px-2 py-0.5 rounded-md border border-amber-200 whitespace-nowrap">
                              {p.active_orders_count} Dipesan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <SellerProductRowActions
                          productId={p.id}
                          productName={p.name}
                          activeOrdersCount={p.active_orders_count || 0}
                          completedOrdersCount={p.completed_orders_count || 0}
                        />
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
