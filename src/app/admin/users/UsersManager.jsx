'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  Store,
  ShoppingBag,
  GraduationCap,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function UsersManager({ initialUsers, currentAdminId }) {
  const router = useRouter();
  const toast = useToast();

  const [users, setUsers] = useState(initialUsers);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    user: null,
    loading: false,
  });

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' ? true : u.role === roleFilter;
    if (!matchRole) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.campus_name && u.campus_name.toLowerCase().includes(q)) ||
      (u.campus_short_name && u.campus_short_name.toLowerCase().includes(q))
    );
  });

  const handleOpenDelete = (u) => {
    if (u.id === currentAdminId) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    setDeleteDialog({
      isOpen: true,
      user: u,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { user: target } = deleteDialog;
    if (!target) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus pengguna');
        setDeleteDialog((prev) => ({ ...prev, loading: false }));
        return;
      }

      setUsers((prev) => prev.filter((item) => item.id !== target.id));
      toast.success(`Pengguna ${target.name} berhasil dihapus`);
      setDeleteDialog({ isOpen: false, user: null, loading: false });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus pengguna');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <Badge variant="navy" size="xs" icon={ShieldCheck}>
          Admin
        </Badge>
      );
    }
    if (role === 'seller') {
      return (
        <Badge variant="mint" size="xs" icon={Store}>
          Penjual
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" size="xs" icon={ShoppingBag}>
        Pembeli
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
          Kelola Pengguna
        </h1>
        <p className="text-xs md:text-sm text-ink-muted mt-1">
          Daftar seluruh akun terdaftar (Admin, Penjual, dan Pembeli) di seluruh Indonesia.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter peran pengguna"
          className="inline-flex p-1 bg-surface-muted rounded-xl border border-border-subtle overflow-x-auto no-scrollbar"
        >
          {[
            { id: 'all', label: 'Semua Peran' },
            { id: 'buyer', label: 'Pembeli' },
            { id: 'seller', label: 'Penjual' },
          ].map((tab) => {
            const active = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRoleFilter(tab.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-surface text-brand-blue font-bold shadow-xs'
                    : 'text-ink-subtle font-semibold hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <label htmlFor="admin-users-search" className="sr-only">
            Cari pengguna berdasarkan nama, email, atau kampus
          </label>
          <Search
            className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="admin-users-search"
            type="search"
            placeholder="Cari nama, email, kampus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] md:min-h-[40px] pl-10 pr-4 text-base md:text-sm bg-surface border border-border-subtle rounded-lg text-ink placeholder:text-ink-muted focus:border-brand-blue transition-colors"
          />
        </div>
      </div>

      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <div className="md:hidden divide-y divide-border-subtle">
          {filteredUsers.length === 0 ? (
            <div className="py-10 px-4 text-center text-sm text-ink-muted">
              Tidak ada pengguna yang cocok.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isCurrentAdmin = u.id === currentAdminId;
              return (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-blue-soft text-brand-blue font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                      {u.name ? u.name.charAt(0) : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-sm text-ink flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{u.name}</span>
                          {isCurrentAdmin && (
                            <span className="text-[11px] bg-navy-900 text-white font-semibold px-2 py-0.5 rounded-full shrink-0">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="shrink-0">{getRoleBadge(u.role)}</div>
                      </div>
                      <p className="text-xs text-ink-muted break-all mt-0.5">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-secondary pl-12">
                    {u.campus_short_name && (
                      <span className="font-semibold text-navy-900 inline-flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
                        <span>{u.campus_short_name}</span>
                      </span>
                    )}
                    {u.phone && <span className="text-ink tabular-nums">{u.phone}</span>}
                    {u.role === 'seller' && u.seller_status && (
                      <span className="capitalize text-ink-muted">Status: {u.seller_status}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      href={`/admin/users/${u.id}/edit`}
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleOpenDelete(u)}
                      disabled={isCurrentAdmin}
                      title={isCurrentAdmin ? 'Tidak dapat menghapus akun sendiri' : 'Hapus pengguna'}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface-muted text-ink-subtle font-semibold border-b border-border-subtle">
              <tr>
                <th className="py-3 px-3 xl:px-4">Pengguna</th>
                <th className="py-3 px-3 xl:px-4">Peran</th>
                <th className="py-3 px-3 xl:px-4">Kampus</th>
                <th className="hidden xl:table-cell py-3 px-4">Kontak</th>
                <th className="py-3 px-3 xl:px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-ink-muted">
                    Tidak ada pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === currentAdminId;
                  return (
                    <tr key={u.id} className="hover:bg-canvas transition-colors">
                      <td className="py-3.5 px-3 xl:px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-blue-soft text-brand-blue font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-ink flex items-center gap-1.5 flex-wrap">
                              <span>{u.name}</span>
                              {isCurrentAdmin && (
                                <span className="text-[11px] bg-navy-900 text-white font-semibold px-2 py-0.5 rounded-full">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-ink-muted break-all">{u.email}</div>
                            {u.phone && (
                              <div className="xl:hidden text-xs text-ink-secondary tabular-nums mt-0.5">
                                {u.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 xl:px-4">
                        {getRoleBadge(u.role)}
                        {u.role === 'seller' && u.seller_status && (
                          <div className="text-[11px] text-ink-muted capitalize mt-1">
                            Status: {u.seller_status}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 xl:px-4">
                        {u.campus_short_name ? (
                          <div>
                            <span className="font-semibold text-navy-900 flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5 shrink-0 text-brand-blue" aria-hidden="true" />
                              <span>{u.campus_short_name}</span>
                            </span>
                            <span className="text-xs text-ink-muted">{u.campus_city}</span>
                          </div>
                        ) : (
                          <span className="text-ink-muted">-</span>
                        )}
                      </td>
                      <td className="hidden xl:table-cell py-3.5 px-4">
                        <span className="text-ink-secondary tabular-nums">{u.phone || '-'}</span>
                      </td>
                      <td className="py-3.5 px-3 xl:px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button
                            href={`/admin/users/${u.id}/edit`}
                            variant="secondary"
                            size="sm"
                            icon={Edit2}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleOpenDelete(u)}
                            disabled={isCurrentAdmin}
                            title={isCurrentAdmin ? 'Tidak dapat menghapus akun sendiri' : 'Hapus pengguna'}
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

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null, loading: false })}
        onConfirm={handleConfirmDelete}
        loading={deleteDialog.loading}
        title="Hapus Pengguna?"
        message={`Apakah Anda yakin ingin menghapus akun "${deleteDialog.user?.name}" (${deleteDialog.user?.email})? Seluruh data yang terkait dengan akun ini akan ikut terhapus.`}
        confirmText="Ya, Hapus Pengguna"
        confirmVariant="danger"
        type="danger"
      />
    </div>
  );
}
