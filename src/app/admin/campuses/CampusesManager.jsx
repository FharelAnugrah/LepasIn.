'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, GraduationCap, Search, Store, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { preventEnterSubmitOnInput } from '@/lib/form-utils';
import {
  validateCampusName,
  validateCampusShortName,
  validateCityOrProvince,
} from '@/lib/validation';

export default function CampusesManager({ initialCampuses }) {
  const router = useRouter();
  const toast = useToast();

  const [campuses, setCampuses] = useState(initialCampuses);
  const [search, setSearch] = useState('');

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add',
    campus: null,
    name: '',
    short_name: '',
    city: '',
    province: '',
    error: '',
    fieldErrors: {},
    loading: false,
  });

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
    if (modalState.loading) return;
    const { name, short_name, city, province, mode, campus } = modalState;

    const fieldErrs = {};
    const nameErr = validateCampusName(name);
    if (nameErr) fieldErrs.name = nameErr;

    const shortNameErr = validateCampusShortName(short_name);
    if (shortNameErr) fieldErrs.short_name = shortNameErr;

    const cityErr = validateCityOrProvince(city, 'Kota');
    if (cityErr) fieldErrs.city = cityErr;

    const provErr = validateCityOrProvince(province, 'Provinsi');
    if (provErr) fieldErrs.province = provErr;

    if (Object.keys(fieldErrs).length > 0) {
      setModalState((prev) => ({
        ...prev,
        fieldErrors: fieldErrs,
        error: '',
      }));
      return;
    }

    setModalState((prev) => ({ ...prev, loading: true, error: '', fieldErrors: {} }));

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Daftar Perguruan Tinggi Se-Indonesia
          </h1>
          <p className="text-xs md:text-sm text-ink-muted mt-1">
            Kelola daftar universitas dan institut yang didukung di seluruh kota Indonesia.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
          Tambah Kampus
        </Button>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <label htmlFor="admin-campuses-search" className="sr-only">
          Cari nama kampus, singkatan, kota, atau provinsi
        </label>
        <Search
          className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="admin-campuses-search"
          type="search"
          placeholder="Cari kampus, singkatan, kota, provinsi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-[44px] md:min-h-[40px] pl-10 pr-4 text-base md:text-sm bg-surface border border-border-subtle rounded-lg text-ink placeholder:text-ink-muted focus:border-brand-blue transition-colors"
        />
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <div className="md:hidden divide-y divide-border-subtle">
          {filteredCampuses.length === 0 ? (
            <div className="py-10 px-4 text-center text-sm text-ink-muted">
              Kampus tidak ditemukan.
            </div>
          ) : (
            filteredCampuses.map((c) => (
              <div key={c.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-ink flex items-start gap-2">
                      <GraduationCap className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{c.name}</span>
                    </div>
                    <p className="text-xs text-ink-muted pl-6 mt-0.5">
                      {c.city}, {c.province}
                    </p>
                  </div>
                  <span className="font-bold tracking-wide text-brand-blue bg-brand-blue-soft px-2.5 py-0.5 rounded-md text-xs shrink-0">
                    {c.short_name}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 text-xs tabular-nums text-ink-muted">
                    <span className="inline-flex items-center gap-1" title="Pengguna">
                      <Users className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                      <span>{c.user_count || 0}</span>
                    </span>
                    <span className="text-border-subtle" aria-hidden="true">|</span>
                    <span className="inline-flex items-center gap-1" title="Toko">
                      <Store className="w-3.5 h-3.5 text-navy-900" aria-hidden="true" />
                      <span>{c.store_count || 0}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenEdit(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
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
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface-muted text-ink-subtle font-semibold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-3 xl:px-4">Nama Perguruan Tinggi</th>
                <th className="py-3 px-3 xl:px-4">Singkatan</th>
                <th className="hidden xl:table-cell py-3 px-4">Kota / Provinsi</th>
                <th className="py-3 px-3 xl:px-4">Komunitas</th>
                <th className="py-3 px-3 xl:px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredCampuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-ink-muted">
                    Kampus tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCampuses.map((c) => (
                  <tr key={c.id} className="hover:bg-canvas transition-colors">
                    <td className="py-3.5 px-3 xl:px-4">
                      <div className="font-bold text-ink flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
                        <span>{c.name}</span>
                      </div>
                      <div className="xl:hidden text-xs text-ink-muted pl-6 mt-0.5">
                        {c.city}, {c.province}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 xl:px-4">
                      <span className="font-bold tracking-wide text-brand-blue bg-brand-blue-soft px-2.5 py-0.5 rounded-md text-xs">
                        {c.short_name}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell py-3.5 px-4">
                      <div className="text-ink font-medium">{c.city}</div>
                      <div className="text-xs text-ink-muted">{c.province}</div>
                    </td>
                    <td className="py-3.5 px-3 xl:px-4">
                      <div className="flex items-center gap-2 text-xs tabular-nums">
                        <span className="flex items-center gap-1 text-ink-secondary" title="Pengguna">
                          <Users className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                          <span>{c.user_count || 0}</span>
                        </span>
                        <span className="text-border-subtle" aria-hidden="true">|</span>
                        <span className="flex items-center gap-1 text-ink-secondary" title="Toko">
                          <Store className="w-3.5 h-3.5 text-navy-900" aria-hidden="true" />
                          <span>{c.store_count || 0}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 xl:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(c)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
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
        <form
          noValidate
          onSubmit={handleSubmitModal}
          onKeyDown={preventEnterSubmitOnInput}
          className="flex flex-col gap-4"
        >
          <Input
            id="campus-name"
            label="Nama Lengkap Kampus"
            placeholder="Contoh: Universitas Hasanuddin"
            value={modalState.name}
            onChange={(e) => {
              const val = e.target.value;
              setModalState((prev) => {
                const nextFieldErrors = { ...prev.fieldErrors };
                if (nextFieldErrors.name) {
                  const err = validateCampusName(val);
                  if (err) nextFieldErrors.name = err;
                  else delete nextFieldErrors.name;
                }
                return { ...prev, name: val, error: '', fieldErrors: nextFieldErrors };
              });
            }}
            onBlur={() => {
              const err = validateCampusName(modalState.name);
              setModalState((prev) => ({
                ...prev,
                fieldErrors: {
                  ...prev.fieldErrors,
                  name: err || undefined,
                },
              }));
            }}
            error={modalState.fieldErrors?.name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="campus-short-name"
              label="Singkatan (Kode)"
              placeholder="Contoh: UNHAS"
              value={modalState.short_name}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setModalState((prev) => {
                  const nextFieldErrors = { ...prev.fieldErrors };
                  if (nextFieldErrors.short_name) {
                    const err = validateCampusShortName(val);
                    if (err) nextFieldErrors.short_name = err;
                    else delete nextFieldErrors.short_name;
                  }
                  return { ...prev, short_name: val, error: '', fieldErrors: nextFieldErrors };
                });
              }}
              onBlur={() => {
                const err = validateCampusShortName(modalState.short_name);
                setModalState((prev) => ({
                  ...prev,
                  fieldErrors: {
                    ...prev.fieldErrors,
                    short_name: err || undefined,
                  },
                }));
              }}
              error={modalState.fieldErrors?.short_name}
              required
            />
            <Input
              id="campus-city"
              label="Kota"
              placeholder="Contoh: Makassar"
              value={modalState.city}
              onChange={(e) => {
                const val = e.target.value;
                setModalState((prev) => {
                  const nextFieldErrors = { ...prev.fieldErrors };
                  if (nextFieldErrors.city) {
                    const err = validateCityOrProvince(val, 'Kota');
                    if (err) nextFieldErrors.city = err;
                    else delete nextFieldErrors.city;
                  }
                  return { ...prev, city: val, error: '', fieldErrors: nextFieldErrors };
                });
              }}
              onBlur={() => {
                const err = validateCityOrProvince(modalState.city, 'Kota');
                setModalState((prev) => ({
                  ...prev,
                  fieldErrors: {
                    ...prev.fieldErrors,
                    city: err || undefined,
                  },
                }));
              }}
              error={modalState.fieldErrors?.city}
              required
            />
          </div>

          <Input
            id="campus-province"
            label="Provinsi"
            placeholder="Contoh: Sulawesi Selatan"
            value={modalState.province}
            onChange={(e) => {
              const val = e.target.value;
              setModalState((prev) => {
                const nextFieldErrors = { ...prev.fieldErrors };
                if (nextFieldErrors.province) {
                  const err = validateCityOrProvince(val, 'Provinsi');
                  if (err) nextFieldErrors.province = err;
                  else delete nextFieldErrors.province;
                }
                return { ...prev, province: val, error: '', fieldErrors: nextFieldErrors };
              });
            }}
            onBlur={() => {
              const err = validateCityOrProvince(modalState.province, 'Provinsi');
              setModalState((prev) => ({
                ...prev,
                fieldErrors: {
                  ...prev.fieldErrors,
                  province: err || undefined,
                },
              }));
            }}
            error={modalState.fieldErrors?.province}
            required
          />

          {modalState.error && (
            <p role="alert" className="text-xs text-danger-text font-medium mt-1">
              {modalState.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
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
            <Button type="submit" variant="primary" loading={modalState.loading}>
              Simpan Kampus
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, campus: null, loading: false })}
        onConfirm={handleConfirmDelete}
        loading={deleteDialog.loading}
        title="Hapus Perguruan Tinggi?"
        message={`Apakah Anda yakin ingin menghapus "${deleteDialog.campus?.name}" (${deleteDialog.campus?.short_name}) dari sistem LepasIn?`}
        confirmText="Ya, Hapus Kampus"
        confirmVariant="danger"
        type="danger"
      />
    </div>
  );
}
