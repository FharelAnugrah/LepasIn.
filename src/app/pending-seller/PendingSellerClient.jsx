'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Clock,
  XCircle,
  ShieldAlert,
  Store,
  GraduationCap,
  RefreshCw,
  LogOut,
  Trash2,
  AlertTriangle,
  Eye,
  CreditCard,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function PendingSellerClient({ user }) {
  const router = useRouter();
  const toast = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(false);

  const isRejected = user.seller_status === 'rejected';
  const wasPreviouslyApproved = Boolean(
    user.was_approved || (user.products_count && user.products_count > 0)
  );
  const isSuspended = isRejected && wasPreviouslyApproved;
  const isInitialRejected = isRejected && !wasPreviouslyApproved;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/auth/refresh-session', { method: 'POST' });
      const data = await res.json();
      if (data?.user?.sellerStatus === 'approved') {
        toast.success('Selamat! Toko Anda telah disetujui admin 🎉');
        router.push('/seller');
        router.refresh();
        return;
      }
    } catch (err) {
      console.error('Refresh session error:', err);
    }
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
        toast.success(
          isSuspended
            ? 'Akun dan toko Anda telah berhasil dihapus'
            : 'Data pengajuan telah dihapus. Silakan mendaftar kembali.'
        );
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
            isSuspended
              ? 'bg-danger-50 text-danger ring-8 ring-danger-50/50'
              : isInitialRejected
              ? 'bg-danger-50 text-danger'
              : 'bg-warning-50 text-warning'
          }`}
        >
          {isSuspended ? (
            <ShieldAlert className="w-8 h-8" />
          ) : isInitialRejected ? (
            <XCircle className="w-8 h-8" />
          ) : (
            <Clock className="w-8 h-8 animate-pulse" />
          )}
        </div>

        {/* Status Title */}
        <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight mb-2">
          {isSuspended
            ? 'Akses Toko Ditangguhkan'
            : isInitialRejected
            ? 'Pendaftaran Toko Ditolak'
            : 'Akun Anda sedang ditinjau.'}
        </h1>

        {/* Status Description */}
        <p className="text-xs md:text-sm text-ink-soft leading-relaxed mb-6">
          {isSuspended
            ? 'Akses toko dan operasional tokomu telah ditangguhkan atau dinonaktifkan oleh tim admin LepasIn karena hasil tinjauan kepatuhan atau laporan pelanggaran aturan. Etalase produk tokomu saat ini dibekukan dari pencarian.'
            : isInitialRejected
            ? 'Maaf, pengajuan pendaftaran tokomu belum memenuhi syarat verifikasi penjual LepasIn. Kamu dapat menghapus pengajuan ini dan mendaftar kembali menggunakan data identitas kampus yang valid.'
            : 'Admin LepasIn sedang memverifikasi identitas dan tokomu. Proses ini memastikan transaksi preloved antar-mahasiswa sekampus berlangsung aman dan terpercaya.'}
        </p>

        {/* Alert Callout Khusus Rejected */}
        {isSuspended && (
          <div className="p-3.5 mb-6 rounded-2xl bg-danger-50/70 border border-danger/20 text-left flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-danger">Status Toko: Penangguhan Aktif</p>
              <p className="text-danger/80 text-[11px] mt-0.5 leading-normal">
                Jika kamu merasa ini adalah kekeliruan atau ingin mengajukan klarifikasi/banding, silakan hubungi admin kampus LepasIn. Kamu juga dapat memilih menghapus akun dan seluruh data tokomu di bawah ini.
              </p>
            </div>
          </div>
        )}

        {isInitialRejected && (
          <div className="p-3.5 mb-6 rounded-2xl bg-danger-50/70 border border-danger/20 text-left flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-danger">Status Verifikasi: Tidak Lolos</p>
              <p className="text-danger/80 text-[11px] mt-0.5 leading-normal">
                Data pendaftaran atau KTM yang dikirimkan tidak memenuhi persyaratan verifikasi kampus. Silakan hapus pengajuan ini agar dapat mendaftar kembali dengan data yang sesuai.
              </p>
            </div>
          </div>
        )}

        {/* Informasi Pendaftaran / Toko */}
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
          <div className={`flex items-center justify-between ${isSuspended && user.products_count !== undefined ? 'border-b border-line/50 pb-2' : ''}`}>
            <span className="text-ink-soft">Asal Kampus:</span>
            <span className="font-bold text-pine flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{user.campus_name || user.campus_short_name || '-'}</span>
            </span>
          </div>
          {isSuspended && user.products_count !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Produk Terdaftar:</span>
              <span className="font-bold text-ink">{user.products_count} produk (dibekukan)</span>
            </div>
          )}
        </div>

        {/* Foto Verifikasi Terlampir (Selfie + KTM) */}
        {user.id_card_url && (
          <div className="p-3 rounded-2xl bg-surface border border-line text-left flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setViewingPhoto(true)}
                className="relative w-11 h-11 rounded-lg overflow-hidden border border-line shrink-0 cursor-pointer hover:opacity-90 transition group"
                title="Lihat foto verifikasi"
              >
                <Image
                  src={user.id_card_url}
                  alt="Foto Verifikasi KTM"
                  fill
                  className="object-cover"
                  sizes="44px"
                />
                <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </button>
              <div className="min-w-0">
                <p className="font-bold text-ink text-xs flex items-center gap-1.5 truncate">
                  <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Foto Selfie & KTM</span>
                </p>
                <p className="text-[11px] text-ink-soft truncate">
                  Telah terkirim untuk verifikasi admin
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              icon={Eye}
              onClick={() => setViewingPhoto(true)}
            >
              Lihat
            </Button>
          </div>
        )}

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
                {isSuspended ? 'Hapus Akun & Toko Saya' : 'Hapus Pengajuan & Daftar Ulang'}
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
        title={
          isSuspended
            ? 'Hapus Akun & Toko yang Ditangguhkan?'
            : 'Hapus Pengajuan Pendaftaran?'
        }
        message={
          isSuspended
            ? 'Tindakan ini permanen. Seluruh data akun, toko, etalase produk, dan riwayat tokomu akan dihapus secara permanen dari sistem LepasIn.'
            : 'Tindakan ini permanen. Data pengajuan pendaftaran toko yang ditolak akan dihapus. Setelah ini kamu dapat mendaftar kembali dengan data identitas kampus yang valid.'
        }
        confirmText={isSuspended ? 'Ya, Hapus Akun & Toko' : 'Ya, Hapus Pengajuan'}
        cancelText="Batal"
        confirmVariant="danger"
        type="danger"
      />

      {/* Modal Lightbox Foto Verifikasi (Selfie + KTM) */}
      {viewingPhoto && user.id_card_url && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-canvas border border-line rounded-card max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="min-w-0">
                <h3 className="font-bold text-ink text-sm md:text-base flex items-center gap-2 truncate">
                  <CreditCard className="w-4 h-4 text-primary shrink-0" />
                  <span>Foto Verifikasi Identitas (Selfie + KTM)</span>
                </h3>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  Foto yang Anda kirimkan saat pendaftaran toko
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhoto(false)}
                className="p-1.5 text-ink-soft hover:text-ink hover:bg-surface rounded-lg transition cursor-pointer"
                aria-label="Tutup foto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-surface border border-line">
              <Image
                src={user.id_card_url}
                alt="Foto Selfie dengan KTM"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 90vw, 500px"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <p className="text-ink-soft text-[11px]">
                Pastikan kartu identitas terbaca jelas agar verifikasi dapat disetujui.
              </p>
              <Button
                variant="secondary"
                size="sm"
                pill
                onClick={() => setViewingPhoto(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
