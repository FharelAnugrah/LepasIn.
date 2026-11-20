'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Trash2, Search, Store, GraduationCap } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ConditionBadge, formatRupiah } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function ProductsModerationManager({ initialProducts }) {
  const router = useRouter();
  const toast = useToast();

  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    product: null,
    loading: false,
  });

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.store_name.toLowerCase().includes(q) ||
      p.category_name.toLowerCase().includes(q) ||
      p.campus_short_name.toLowerCase().includes(q) ||
      p.campus_name.toLowerCase().includes(q)
    );
  });

  const handleOpenDelete = (product) => {
    setDeleteDialog({
      isOpen: true,
      product,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { product } = deleteDialog;
    if (!product) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus produk');
        setDeleteDialog((prev) => ({ ...prev, loading: false }));
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success(`Produk "${product.name}" berhasil dihapus dari katalog`);
      setDeleteDialog({ isOpen: false, product: null, loading: false });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memoderasi produk');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
          Moderasi Produk Nasional
        </h1>
        <p className="text-xs md:text-sm text-ink-muted mt-1">
          Pantau seluruh katalog barang preloved dan hapus produk yang melanggar aturan komunitas kampus.
        </p>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <label htmlFor="admin-products-search" className="sr-only">
          Cari nama produk, toko, atau kampus
        </label>
        <Search
          className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="admin-products-search"
          type="search"
          placeholder="Cari nama produk, toko, kampus..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-[44px] md:min-h-[40px] pl-10 pr-4 text-base md:text-sm bg-surface border border-border-subtle rounded-lg text-ink placeholder:text-ink-muted focus:border-brand-blue transition-colors"
        />
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <div className="md:hidden divide-y divide-border-subtle">
          {filteredProducts.length === 0 ? (
            <div className="py-10 px-4 text-center text-sm text-ink-muted">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          ) : (
            filteredProducts.map((p) => (
              <div key={p.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-ink flex items-start gap-2">
                      <Package className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="line-clamp-2">{p.name}</span>
                    </div>
                    <div className="text-xs text-ink-muted tabular-nums pl-6 mt-0.5">
                      ID Produk: #{p.id} · {p.category_name}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ConditionBadge condition={p.condition} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pl-6">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-ink inline-flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-brand-blue shrink-0" aria-hidden="true" />
                      <span>{p.store_name}</span>
                    </div>
                    <div className="text-xs text-navy-900 font-medium flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 shrink-0 text-brand-blue" aria-hidden="true" />
                      <span>{p.campus_short_name} ({p.campus_city})</span>
                    </div>
                  </div>
                  <div className="text-right tabular-nums">
                    <div className="font-bold text-ink">{formatRupiah(p.price)}</div>
                    <div className="text-xs text-ink-muted">
                      Stok: <span className="font-semibold text-ink">{p.stock}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleOpenDelete(p)}
                  >
                    Hapus Pelanggaran
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface-muted text-ink-subtle font-semibold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-3 xl:px-4">Produk</th>
                <th className="py-3 px-3 xl:px-4">Toko &amp; Kampus</th>
                <th className="hidden xl:table-cell py-3 px-4">Kategori &amp; Kondisi</th>
                <th className="py-3 px-3 xl:px-4">Harga &amp; Stok</th>
                <th className="py-3 px-3 xl:px-4 text-right">Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-ink-muted">
                    Tidak ada produk yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-canvas transition-colors">
                    <td className="py-3.5 px-3 xl:px-4">
                      <div className="font-bold text-ink flex items-start gap-2">
                        <Package className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="line-clamp-2 max-w-[165px] xl:max-w-xs break-words">{p.name}</span>
                      </div>
                      <div className="text-xs text-ink-muted tabular-nums mt-0.5 pl-6">
                        ID #{p.id}
                      </div>
                      <div className="xl:hidden flex flex-wrap items-center gap-1.5 mt-1 pl-6">
                        <span className="text-xs text-ink-muted">{p.category_name}</span>
                        <ConditionBadge condition={p.condition} />
                      </div>
                    </td>
                    <td className="py-3.5 px-3 xl:px-4">
                      <div className="font-semibold text-ink flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-brand-blue shrink-0" aria-hidden="true" />
                        <span>{p.store_name}</span>
                      </div>
                      <div className="text-xs text-navy-900 font-medium flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3 h-3 shrink-0 text-brand-blue" aria-hidden="true" />
                        <span>{p.campus_short_name} ({p.campus_city})</span>
                      </div>
                    </td>
                    <td className="hidden xl:table-cell py-3.5 px-4">
                      <div className="font-medium text-ink">{p.category_name}</div>
                      <div className="mt-1">
                        <ConditionBadge condition={p.condition} />
                      </div>
                    </td>
                    <td className="py-3.5 px-3 xl:px-4 tabular-nums">
                      <div className="font-bold text-ink whitespace-nowrap">{formatRupiah(p.price)}</div>
                      <div className="text-xs text-ink-muted">
                        Stok: <span className="font-semibold text-ink">{p.stock}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 xl:px-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleOpenDelete(p)}
                      >
                        <span className="xl:hidden">Hapus</span>
                        <span className="hidden xl:inline">Hapus Pelanggaran</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, product: null, loading: false })}
        onConfirm={handleConfirmDelete}
        loading={deleteDialog.loading}
        title="Moderasi: Hapus Produk Pelanggar?"
        message={`Apakah Anda yakin ingin menghapus produk "${deleteDialog.product?.name}" milik toko ${deleteDialog.product?.store_name}? Produk akan langsung dihilangkan dari katalog publik.`}
        confirmText="Ya, Hapus Produk"
        confirmVariant="danger"
        type="danger"
      />
    </div>
  );
}
