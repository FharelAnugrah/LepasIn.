'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, XCircle, Store, GraduationCap, RefreshCw, LogOut, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function PendingSellerClient({ user }) {
  const router = useRouter();
  const toast = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isRejected = user.seller_status === 'rejected';

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setRefreshing(false);
      toast.info('Status akun diperbarui');
    }, 600);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Akun Anda telah berhasil dihapus');
        router.push(data.redirectTo || '/register');
        router.refresh();
      } else {
        toast.error(data.error || 'Gagal menghapus akun');
        setIsDeleting(false);
        setShowConfirmDelete(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan');
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card text-center">
        {/* Status Icon */}
        <div
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5 ${
            isRejected ? 'bg-danger-50 text-danger' : 'bg-warning-50 text-warning'
          }`}
        >
          {isRejected ? (
            <XCircle className="w-8 h-8" />
          ) : (
            <Clock className="w-8 h-8 animate-pulse" />
          )}
        </div>

        {/* Status Message (Wajib persis sesuai instruksi PRD: "Akun Anda sedang ditinjau.") */}
        <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight mb-2">
          {isRejected ? 'Pengajuan Toko Ditolak' : 'Akun Anda sedang ditinjau.'}
        </h1>

        <p className="text-xs md:text-sm text-ink-soft leading-relaxed mb-6">
          {isRejected
            ? 'Maaf, pengajuan tokomu belum memenuhi syarat verifikasi penjual LepasIn. Kamu dapat menghapus akun ini dan mendaftar kembali dengan data yang valid.'
            : 'Admin LepasIn sedang memverifikasi identitas dan tokomu. Proses ini memastikan transaksi preloved antar-mahasiswa sekampus berlangsung aman dan terpercaya.'}
        </p>

        {/* Informasi Pendaftaran */}
        <div className="p-4 rounded-2xl bg-surface border border-line text-left flex flex-col gap-2.5 mb-6 text-xs">
          <div className="flex items-center justify-between border-b border-line/50 pb-2">
            <span className="text-ink-soft">Nama Penjual:</span>
            <span className="font-bold text-ink">{user.name}</span>
          </div>
          <div className="flex items-center justify-between border-b border-line/50 pb-2">
            <span className="text-ink-soft">Nama Toko:</span>
            <span className="font-bold text-ink flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-primary" />
              <span>{user.store_name || '-'}</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Asal Kampus:</span>
            <span className="font-bold text-pine flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{user.campus_name || user.campus_short_name || '-'}</span>
            </span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col gap-2.5">
          {!isRejected ? (
            <>
              <Button
                variant="primary"
                pill
                onClick={handleRefresh}
                loading={refreshing}
                icon={RefreshCw}
                className="w-full"
              >
                Cek Status Terbaru
              </Button>
              <Button
                variant="ghost"
                pill
                onClick={handleLogout}
                icon={LogOut}
                className="w-full"
              >
                Keluar Akun
              </Button>
            </>
          ) : (
            <>
              {/* Tombol Delete Account khusus Rejected */}
              <Button
                variant="danger"
                pill
                onClick={() => setShowConfirmDelete(true)}
                icon={Trash2}
                className="w-full"
              >
                Hapus Akun Saya
              </Button>
              <Button
                variant="ghost"
                pill
                onClick={handleLogout}
                icon={LogOut}
                className="w-full"
              >
                Keluar Akun
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dialog Konfirmasi Hapus Akun */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteAccount}
        loading={isDeleting}
        title="Hapus Akun Penjual?"
        message="Tindakan ini permanen. Semua data akun dan toko yang telah kamu daftarkan akan dihapus sepenuhnya dari sistem LepasIn."
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        confirmVariant="danger"
        type="danger"
      />
    </div>
  );
}
