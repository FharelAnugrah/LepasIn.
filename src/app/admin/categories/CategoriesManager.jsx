'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Tags, Package, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

// Helper agar "Lainnya" selalu berada di paling akhir urutan kategori
const sortCategoriesWithLainnyaLast = (list = []) => {
  return [...list].sort((a, b) => {
    const isALainnya = /^(lainnya|lain-lain|lainnya \/ other)$/i.test(a.name?.trim());
    const isBLainnya = /^(lainnya|lain-lain|lainnya \/ other)$/i.test(b.name?.trim());
    if (isALainnya && !isBLainnya) return 1;
    if (!isALainnya && isBLainnya) return -1;
    return a.id - b.id;
  });
};

export default function CategoriesManager({ initialCategories }) {
  const router = useRouter();
  const toast = useToast();

  const [categories, setCategories] = useState(() =>
    sortCategoriesWithLainnyaLast(initialCategories || [])
  );
  const [search, setSearch] = useState('');

  // Modal Tambah / Edit
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    category: null,
    name: '',
    error: '',
    loading: false,
  });

  // Dialog Konfirmasi Hapus
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    category: null,
    loading: false,
  });

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
      category: null,
      name: '',
      error: '',
      loading: false,
    });
  };

  const handleOpenEdit = (category) => {
    if (/^(lainnya|lain-lain)$/i.test(category.name?.trim())) {
      toast.error('Nama kategori "Lainnya" adalah kategori sistem dan tidak dapat diubah.');
      return;
    }
    setModalState({
      isOpen: true,
      mode: 'edit',
      category,
      name: category.name,
      error: '',
      loading: false,
    });
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!modalState.name.trim()) {
      setModalState((prev) => ({ ...prev, error: 'Nama kategori wajib diisi' }));
      return;
    }

    setModalState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const isAdd = modalState.mode === 'add';
      const url = isAdd
        ? '/api/admin/categories'
        : `/api/admin/categories/${modalState.category.id}`;
      const method = isAdd ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modalState.name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalState((prev) => ({
          ...prev,
          loading: false,
          error: data.error || 'Gagal menyimpan kategori',
        }));
        return;
      }

      if (data.categories) {
        setCategories(sortCategoriesWithLainnyaLast(data.categories));
      } else if (isAdd) {
        setCategories((prev) =>
          sortCategoriesWithLainnyaLast([...prev, { ...data.category, product_count: 0 }])
        );
      } else {
        setCategories((prev) =>
          sortCategoriesWithLainnyaLast(
            prev.map((c) =>
              c.id === modalState.category.id ? { ...c, name: modalState.name.trim() } : c
            )
          )
        );
      }

      if (isAdd) {
        toast.success(`Kategori "${modalState.name}" berhasil ditambahkan`);
      } else {
        toast.success('Nama kategori berhasil diperbarui');
      }

      setModalState({ isOpen: false, mode: 'add', category: null, name: '', error: '', loading: false });
      router.refresh();
    } catch (err) {
      console.error(err);
      setModalState((prev) => ({
        ...prev,
        loading: false,
        error: 'Terjadi gangguan jaringan',
      }));
    }
  };

  const handleOpenDelete = (category) => {
    if (/^(lainnya|lain-lain)$/i.test(category.name?.trim())) {
      toast.error('Kategori "Lainnya" adalah kategori sistem dan tidak dapat dihapus.');
      return;
    }
    if (category.product_count > 0) {
      toast.error(
        `Kategori "${category.name}" masih digunakan oleh ${category.product_count} produk dan tidak boleh dihapus.`
      );
      return;
    }
    setDeleteDialog({
      isOpen: true,
      category,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { category } = deleteDialog;
    if (!category) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus kategori');
        setDeleteDialog((prev) => ({ ...prev, loading: false }));
        return;
      }

      if (data.categories) {
        setCategories(sortCategoriesWithLainnyaLast(data.categories));
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== category.id));
      }
      toast.success(`Kategori "${category.name}" berhasil dihapus`);
      setDeleteDialog({ isOpen: false, category: null, loading: false });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus kategori');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Kategori Produk
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Kelola pengelompokan produk preloved di katalog LepasIn.
          </p>
        </div>
        <Button variant="primary" pill icon={Plus} onClick={handleOpenAdd}>
          Tambah Kategori
        </Button>
      </div>

      {/* Pencarian Kategori */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 text-xs md:text-sm bg-canvas border border-line rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-50 outline-none transition"
        />
      </div>

      {/* Tabel Kategori */}
      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
              <tr>
                <th className="py-3 px-5 w-16 text-center">ID</th>
                <th className="py-3 px-5">Nama Kategori</th>
                <th className="py-3 px-5">Jumlah Produk Aktif</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink-soft">
                    Kategori tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const isSystemCategory = /^(lainnya|lain-lain)$/i.test(c.name?.trim());
                  return (
                    <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-4 px-5 text-center font-mono font-bold text-ink-soft">
                        {c.id}
                      </td>
                      <td className="py-4 px-5 font-bold text-ink flex items-center gap-2">
                        <Tags className="w-4 h-4 text-primary shrink-0" />
                        <span>{c.name}</span>
                        {isSystemCategory && (
                          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-primary-50 text-primary">
                            Sistem
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            c.product_count > 0
                              ? 'bg-primary-50 text-primary'
                              : 'bg-surface text-ink-soft'
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{c.product_count} produk</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            pill
                            icon={Edit2}
                            onClick={() => handleOpenEdit(c)}
                            disabled={isSystemCategory}
                            title={
                              isSystemCategory
                                ? 'Kategori sistem tidak dapat diubah'
                                : 'Edit nama kategori'
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            pill
                            icon={Trash2}
                            onClick={() => handleOpenDelete(c)}
                            disabled={c.product_count > 0 || isSystemCategory}
                            title={
                              isSystemCategory
                                ? 'Kategori sistem tidak dapat dihapus'
                                : c.product_count > 0
                                ? 'Tidak bisa dihapus karena masih ada produk di kategori ini'
                                : 'Hapus kategori'
                            }
                          >
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Kategori */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() =>
          !modalState.loading &&
          setModalState({ isOpen: false, mode: 'add', category: null, name: '', error: '', loading: false })
        }
        title={modalState.mode === 'add' ? 'Tambah Kategori Baru' : 'Edit Nama Kategori'}
      >
        <form onSubmit={handleSubmitModal} className="flex flex-col gap-4">
          <Input
            label="Nama Kategori"
            placeholder="Contoh: Elektronik & Gadget"
            value={modalState.name}
            onChange={(e) =>
              setModalState((prev) => ({ ...prev, name: e.target.value, error: '' }))
            }
            error={modalState.error}
            autoFocus
            required
          />

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line/60">
            <Button
              type="button"
              variant="secondary"
              pill
              onClick={() =>
                setModalState({ isOpen: false, mode: 'add', category: null, name: '', error: '', loading: false })
              }
              disabled={modalState.loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              pill
              loading={modalState.loading}
            >
              Simpan Kategori
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus Kategori */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, category: null, loading: false })}
        onConfirm={handleConfirmDelete}
        loading={deleteDialog.loading}
        title="Hapus Kategori Produk?"
        message={`Apakah kamu yakin ingin menghapus kategori "${deleteDialog.category?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Kategori"
        confirmVariant="danger"
        type="danger"
      />
    </div>
  );
}
