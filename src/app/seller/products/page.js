import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { requireApprovedSeller } from '@/lib/auth';
import { query } from '@/lib/db';
import Button from '@/components/ui/Button';
import { ConditionBadge, formatRupiah } from '@/components/ui/Badge';
import SellerProductRowActions from './SellerProductRowActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Produk Lapak — Penjual LepasIn',
};

export default async function SellerProductsPage() {
  const seller = await requireApprovedSeller();

  const storeRes = await query(`SELECT id, name FROM stores WHERE user_id = $1`, [seller.id]);
  const store = storeRes.rows[0];

  const productsRes = await query(
    `SELECT p.id, p.name, p.price, p.original_price, p.stock, p.condition, p.created_at,
            c.name AS category_name,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Produk di Lapak Saya
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Kelola barang preloved yang kamu tawarkan ke teman sekampus.
          </p>
        </div>
        <Link href="/seller/products/new">
          <Button variant="primary" pill>
            <Plus className="w-4 h-4" />
            <span>Tambah Barang Baru</span>
          </Button>
        </Link>
      </div>

      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-soft">
            Belum ada produk yang kamu tambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
                <tr>
                  <th className="py-3 px-5">Produk</th>
                  <th className="py-3 px-5">Kategori</th>
                  <th className="py-3 px-5">Kondisi</th>
                  <th className="py-3 px-5">Harga</th>
                  <th className="py-3 px-5">Stok</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-ink">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary shrink-0" />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-ink-soft">{p.category_name}</td>
                    <td className="py-3.5 px-5">
                      <ConditionBadge condition={p.condition} />
                    </td>
                    <td className="py-3.5 px-5 font-bold text-ink">{formatRupiah(p.price)}</td>
                    <td className="py-3.5 px-5">
                      <span className={`font-semibold ${p.stock <= 0 ? 'text-danger' : 'text-ink'}`}>
                        {p.stock <= 0 ? 'Habis (0)' : `${p.stock} item`}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <SellerProductRowActions productId={p.id} productName={p.name} />
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
