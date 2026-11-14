'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, GraduationCap, MapPin, Search, Store, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function CampusesManager({ initialCampuses }) {
  const router = useRouter();
  const toast = useToast();

  const [campuses, setCampuses] = useState(initialCampuses);
  const [search, setSearch] = useState('');

  // Modal Tambah / Edit
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    campus: null,
    name: '',
    short_name: '',
    city: '',
    province: '',
    error: '',
    loading: false,
  });

  // Modal Hapus
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    campus: null,
    loading: false,
  });

  const filteredCampuses = campuses.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.short_name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.province.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
      campus: null,
      name: '',
      short_name: '',
      city: '',
      province: '',
      error: '',
      loading: false,
    });
  };

  const handleOpenEdit = (campus) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      campus,
      name: campus.name,
      short_name: campus.short_name,
      city: campus.city,
      province: campus.province,
      error: '',
      loading: false,
    });
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    const { name, short_name, city, province, mode, campus } = modalState;

    if (!name.trim() || !short_name.trim() || !city.trim() || !province.trim()) {
      setModalState((prev) => ({
        ...prev,
        error: 'Semua field wajib diisi',
      }));
      return;
    }

    setModalState((prev) => ({ ...prev, loading: true, error: '' }));

    try {
      const isAdd = mode === 'add';
      const url = isAdd ? '/api/admin/campuses' : `/api/admin/campuses/${campus.id}`;
      const method = isAdd ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          short_name: short_name.trim().toUpperCase(),
          city: city.trim(),
          province: province.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setModalState((prev) => ({
          ...prev,
          loading: false,
          error: data.error || 'Gagal menyimpan data perguruan tinggi',
        }));
        return;
      }

      if (isAdd) {
        setCampuses((prev) => [
          ...prev,
          { ...data.campus, user_count: 0, store_count: 0 },
        ]);
        toast.success(`Kampus ${short_name.toUpperCase()} berhasil ditambahkan`);
      } else {
        setCampuses((prev) =>
          prev.map((item) =>
            item.id === campus.id ? { ...item, ...data.campus } : item
          )
        );
        toast.success('Data kampus berhasil diperbarui');
      }

      setModalState({
        isOpen: false,
        mode: 'add',
        campus: null,
        name: '',
        short_name: '',
        city: '',
        province: '',
        error: '',
        loading: false,
      });
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

  const handleOpenDelete = (campus) => {
    if (campus.user_count > 0 || campus.store_count > 0) {
      toast.error(
        `Kampus ${campus.short_name} masih terhubung dengan ${campus.user_count} pengguna dan ${campus.store_count} toko.`
      );
      return;
    }
    setDeleteDialog({
      isOpen: true,
      campus,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { campus } = deleteDialog;
    if (!campus) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`/api/admin/campuses/${campus.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus perguruan tinggi');
        setDeleteDialog((prev) => ({ ...prev, loading: false }));
        return;
      }

      setCampuses((prev) => prev.filter((item) => item.id !== campus.id));
      toast.success(`Kampus ${campus.short_name} berhasil dihapus`);
      setDeleteDialog({ isOpen: false, campus: null, loading: false });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus kampus');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Daftar Perguruan Tinggi Se-Indonesia
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Kelola daftar universitas dan institut yang didukung di seluruh kota Indonesia.
          </p>
        </div>
        <Button variant="primary" pill icon={Plus} onClick={handleOpenAdd}>
          Tambah Kampus
        </Button>
      </div>

      {/* Pencarian */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari kampus, singkatan, kota, provinsi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-4 text-xs md:text-sm bg-canvas border border-line rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-50 outline-none transition"
        />
      </div>

      {/* Tabel Kampus */}
      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
              <tr>
                <th className="py-3 px-5">Nama Perguruan Tinggi</th>
                <th className="py-3 px-5">Singkatan</th>
                <th className="py-3 px-5">Kota / Provinsi</th>
                <th className="py-3 px-5">Komunitas</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredCampuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-soft">
                    Kampus tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCampuses.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-ink flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-pine shrink-0" />
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-primary bg-primary-50 px-2 py-0.5 rounded-md text-xs">
                        {c.short_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-ink font-medium">{c.city}</div>
                      <div className="text-[11px] text-ink-soft">{c.province}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-ink-soft" title="Pengguna">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          <span>{c.user_count || 0}</span>
                        </span>
                        <span className="text-line">|</span>
                        <span className="flex items-center gap-1 text-ink-soft" title="Toko">
                          <Store className="w-3.5 h-3.5 text-pine" />
                          <span>{c.store_count || 0}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          pill
                          icon={Edit2}
                          onClick={() => handleOpenEdit(c)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          pill
                          icon={Trash2}
                          onClick={() => handleOpenDelete(c)}
                          disabled={c.user_count > 0 || c.store_count > 0}
                          title={
                            c.user_count > 0 || c.store_count > 0
                              ? 'Tidak bisa dihapus karena masih ada pengguna/toko di kampus ini'
                              : 'Hapus kampus'
                          }
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Kampus */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() =>
          !modalState.loading &&
          setModalState({
            isOpen: false,
            mode: 'add',
            campus: null,
            name: '',
            short_name: '',
            city: '',
            province: '',
            error: '',
            loading: false,
          })
        }
        title={
          modalState.mode === 'add'
            ? 'Tambah Perguruan Tinggi Baru'
            : `Edit Kampus: ${modalState.short_name}`
        }
      >
        <form onSubmit={handleSubmitModal} className="flex flex-col gap-4">
          <Input
            label="Nama Lengkap Kampus"
            placeholder="Contoh: Universitas Hasanuddin"
            value={modalState.name}
            onChange={(e) =>
              setModalState((prev) => ({ ...prev, name: e.target.value, error: '' }))
            }
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Singkatan (Kode)"
              placeholder="Contoh: UNHAS"
              value={modalState.short_name}
              onChange={(e) =>
                setModalState((prev) => ({
                  ...prev,
                  short_name: e.target.value.toUpperCase(),
                  error: '',
                }))
              }
              required
            />
            <Input
              label="Kota"
              placeholder="Contoh: Makassar"
              value={modalState.city}
              onChange={(e) =>
                setModalState((prev) => ({ ...prev, city: e.target.value, error: '' }))
              }
              required
            />
          </div>

          <Input
            label="Provinsi"
            placeholder="Contoh: Sulawesi Selatan"
            value={modalState.province}
            onChange={(e) =>
              setModalState((prev) => ({ ...prev, province: e.target.value, error: '' }))
            }
            required
          />

          {modalState.error && (
            <p className="text-xs text-danger font-medium mt-1">{modalState.error}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60">
            <Button
              type="button"
              variant="secondary"
              pill
              onClick={() =>
                setModalState({
                  isOpen: false,
                  mode: 'add',
                  campus: null,
                  name: '',
                  short_name: '',
                  city: '',
                  province: '',
                  error: '',
                  loading: false,
                })
              }
              disabled={modalState.loading}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" pill loading={modalState.loading}>
              Simpan Kampus
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog Konfirmasi Hapus Kampus */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, campus: null, loading: false })}
        onConfirm={handleConfirmDelete}
        loading={deleteDialog.loading}
        title="Hapus Perguruan Tinggi?"
        message={`Apakah kamu yakin ingin menghapus "${deleteDialog.campus?.name}" (${deleteDialog.campus?.short_name}) dari sistem LepasIn?`}
        confirmText="Ya, Hapus Kampus"
        confirmVariant="danger"
        type="danger"
      />
    </div>
  );
}
