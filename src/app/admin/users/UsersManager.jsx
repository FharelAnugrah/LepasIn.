'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  Store,
  ShoppingBag,
  GraduationCap,
  AlertTriangle,
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
        <Badge variant="primary" size="xs" icon={ShieldCheck}>
          Admin
        </Badge>
      );
    }
    if (role === 'seller') {
      return (
        <Badge variant="pine" size="xs" icon={Store}>
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
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
          Kelola Pengguna
        </h1>
        <p className="text-xs md:text-sm text-ink-soft mt-1">
          Daftar seluruh akun terdaftar (Admin, Penjual, dan Pembeli) di seluruh Indonesia.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tab Role */}
        <div className="flex p-1 bg-surface rounded-xl border border-line overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Semua Peran' },
            { id: 'buyer', label: 'Pembeli' },
            { id: 'seller', label: 'Penjual' },
          
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-canvas text-primary shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama, email, kampus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs md:text-sm bg-canvas border border-line rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-50 outline-none transition"
          />
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-canvas border border-line rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-surface text-ink-soft font-semibold border-b border-line">
              <tr>
                <th className="py-3 px-5">Pengguna</th>
                <th className="py-3 px-5">Peran</th>
                <th className="py-3 px-5">Kampus</th>
                <th className="py-3 px-5">Kontak</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-soft">
                    Tidak ada pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === currentAdminId;
                  return (
                    <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-50 text-primary font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-ink flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrentAdmin && (
                                <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.2 rounded-full">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-ink-soft">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {getRoleBadge(u.role)}
                        {u.role === 'seller' && u.seller_status && (
                          <div className="text-[10px] text-ink-soft capitalize mt-0.5">
                            Status: {u.seller_status}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {u.campus_short_name ? (
                          <div>
                            <span className="font-semibold text-pine flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>{u.campus_short_name}</span>
                            </span>
                            <span className="text-[11px] text-ink-soft">{u.campus_city}</span>
                          </div>
                        ) : (
                          <span className="text-ink-soft">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-ink">{u.phone || '-'}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/users/${u.id}/edit`}>
                            <Button variant="secondary" size="sm" pill icon={Edit2}>
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            pill
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

      {/* Dialog Konfirmasi Hapus Pengguna */}
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
