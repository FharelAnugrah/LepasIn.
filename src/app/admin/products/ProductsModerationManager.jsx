'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Trash2, Search, Store, GraduationCap, AlertTriangle } from 'lucide-react';
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
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
          Moderasi Produk Nasional
        </h1>
        <p className="text-xs md:text-sm text-ink-soft mt-1">
          Pantau seluruh katalog barang preloved dan hapus produk yang melanggar aturan komunitas kampus.
        </p>
      </div>

      {/* Pencarian */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama produk, toko, kampus..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 text-xs md:text-sm bg-canvas border border-line rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-50 outline-none transition"
        />
      </div>

      {/* Tabel Moderasi */}
      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
              <tr>
                <th className="py-3 px-5">Produk</th>
                <th className="py-3 px-5">Toko & Kampus</th>
                <th className="py-3 px-5">Kategori & Kondisi</th>
                <th className="py-3 px-5">Harga & Stok</th>
                <th className="py-3 px-5 text-right">Moderasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-soft">
                    Tidak ada produk yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-ink flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary shrink-0" />
                        <span className="line-clamp-2 max-w-xs">{p.name}</span>
                      </div>
                      <div className="text-[11px] text-ink-soft mt-0.5">
                        ID Produk: #{p.id}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-ink flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-primary" />
                        <span>{p.store_name}</span>
                      </div>
                      <div className="text-[11px] text-pine font-medium flex items-center gap-1 mt-0.5">
                        <GraduationCap className="w-3 h-3" />
                        <span>{p.campus_short_name} ({p.campus_city})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-ink">{p.category_name}</div>
                      <div className="mt-1">
                        <ConditionBadge condition={p.condition} />
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-ink">{formatRupiah(p.price)}</div>
                      <div className="text-[11px] text-ink-soft">
                        Stok: <span className="font-semibold text-ink">{p.stock}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        pill
                        icon={Trash2}
                        onClick={() => handleOpenDelete(p)}
                      >
                        Hapus Pelanggaran
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Konfirmasi Moderasi Hapus Produk */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, product: null, loading: false })}
        onConfirm={handleConfirmDelete}
        loading={deleteDialog.loading}
        title="Moderasi: Hapus Produk Pelanggar?"
        message={`Apakah kamu yakin ingin menghapus produk "${deleteDialog.product?.name}" milik toko ${deleteDialog.product?.store_name}? Produk akan langsung dihilangkan dari katalog publik.`}
        confirmText="Ya, Hapus Produk"
        confirmVariant="danger"
        type="danger"
      />
    </div>
  );
}
