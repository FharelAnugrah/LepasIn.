'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  AlertCircle,
  Store,
  GraduationCap,
  RefreshCw,
  LogOut,
  Trash2,
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

  useEffect(() => {
    if (!viewingPhoto) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') setViewingPhoto(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewingPhoto]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/auth/refresh-session', { method: 'POST' });
      const data = await res.json();
      if (data?.user?.sellerStatus === 'approved') {
        toast.success('Selamat, toko Anda telah disetujui admin.');
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
    <div className="max-w-lg mx-auto mt-12">
      <div className="surface-3d rounded-3xl p-8 text-center">
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-baseline font-extrabold text-xl text-navy-900 tracking-tight"
          >
            <span>LepasIn</span>
            <span
              className="w-2 h-2 rounded-[4px] bg-campus-gold inline-block ml-0.5 mb-0.5 shadow-[0_2px_0_#B87D04]"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Ikon Status 3D */}
        <div
          className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_0_rgba(15,41,74,0.12)] ${
            isRejected
              ? 'bg-danger-bg text-danger-text border border-red-200'
              : 'bg-warning-bg text-warning-text border border-amber-200'
          }`}
        >
          {isRejected ? (
            <AlertCircle className="w-8 h-8" aria-hidden="true" />
          ) : (
            <Clock className="w-8 h-8" aria-hidden="true" />
          )}
        </div>

        {/* Judul Status (design2.md 5.8) */}
        <h1 className="text-2xl font-bold text-ink tracking-tight mb-2">
          {isSuspended
            ? 'Akses Toko Ditangguhkan'
            : isInitialRejected
            ? 'Pendaftaran Toko Ditolak'
            : 'Akun Anda sedang ditinjau.'}
        </h1>

        <p className="text-sm text-ink-secondary leading-relaxed mb-6">
          {isSuspended
            ? 'Akses toko dan operasional tokomu telah ditangguhkan oleh admin LepasIn. Etalase produk tokomu saat ini disembunyikan dari katalog publik.'
            : isInitialRejected
            ? 'Pengajuan pendaftaran tokomu belum memenuhi syarat verifikasi penjual LepasIn. Kamu dapat menghapus pengajuan ini untuk mendaftar ulang dengan data KTM yang valid.'
            : 'Admin LepasIn sedang memeriksa identitas dan data tokomu agar jual beli antarMahasiswa sekampus tetap aman dan terpercaya.'}
        </p>

        {isRejected && (
          <div className="p-4 mb-6 rounded-xl bg-danger-bg border border-red-200 text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-danger-text shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-danger-text">
                {isSuspended ? 'Penangguhan Aktif' : 'Verifikasi Tidak Lolos'}
              </p>
              <p className="text-ink-secondary mt-0.5">
                {isSuspended
                  ? 'Hubungi admin LepasIn untuk klarifikasi, atau hapus akun untuk membersihkan seluruh data toko.'
                  : 'Pastikan foto selfie bersama KTM terlihat jelas dan data kampus sesuai saat mendaftar ulang.'}
              </p>
            </div>
          </div>
        )}

        {/* Ringkasan Nama Toko & Kampus Terdaftar (design2.md 5.8) */}
        <div className="p-4 rounded-xl bg-canvas border border-border-subtle text-left flex flex-col gap-2.5 mb-6 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
            <span className="text-ink-muted">Nama Penjual</span>
            <span className="font-semibold text-ink">{user.name}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
            <span className="text-ink-muted">Nama Toko</span>
            <span className="font-semibold text-ink inline-flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
              <span>{user.store_name || '-'}</span>
            </span>
          </div>
          <div
            className={`flex items-center justify-between gap-2 ${
              isSuspended && user.products_count !== undefined
                ? 'border-b border-border-subtle pb-2'
                : ''
            }`}
          >
            <span className="text-ink-muted">Kampus Terdaftar</span>
            <span className="font-semibold text-brand-blue inline-flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{user.campus_name || user.campus_short_name || '-'}</span>
            </span>
          </div>
          {isSuspended && user.products_count !== undefined && (
            <div className="flex items-center justify-between gap-2 tabular-nums">
              <span className="text-ink-muted">Produk Terdaftar</span>
              <span className="font-semibold text-ink">{user.products_count} produk (dibekukan)</span>
            </div>
          )}
        </div>

        {/* Lampiran Foto Verifikasi */}
        {user.id_card_url && (
          <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-left flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setViewingPhoto(true)}
                className="relative w-11 h-11 rounded-lg overflow-hidden border border-border-subtle shrink-0"
                aria-label="Lihat foto verifikasi KTM"
              >
                <Image
                  src={user.id_card_url}
                  alt="Foto Verifikasi KTM"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="44px"
                />
              </button>
              <div className="min-w-0">
                <p className="font-semibold text-ink text-xs flex items-center gap-1.5 truncate">
                  <CreditCard className="w-3.5 h-3.5 text-brand-blue shrink-0" aria-hidden="true" />
                  <span>Foto Selfie & KTM</span>
                </p>
                <p className="text-[11px] text-ink-muted truncate">
                  Tersimpan untuk verifikasi admin
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
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
                onClick={handleRefresh}
                loading={refreshing}
                icon={RefreshCw}
                className="w-full"
              >
                Cek Status Terbaru
              </Button>
              <Button
                variant="secondary"
                onClick={handleLogout}
                icon={LogOut}
                className="w-full"
              >
                Keluar
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="w-full min-h-[44px] bg-danger-text hover:bg-red-800 text-white font-semibold text-sm rounded-lg px-5 py-2.5 inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Hapus Akun</span>
              </button>
              <Button
                variant="secondary"
                onClick={handleLogout}
                icon={LogOut}
                className="w-full"
              >
                Keluar
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteAccount}
        loading={isDeleting}
        title={
          isSuspended
            ? 'Hapus Akun dan Toko yang Ditangguhkan?'
            : 'Hapus Akun dan Pengajuan Pendaftaran?'
        }
        message={
          isSuspended
            ? 'Tindakan ini permanen. Seluruh data akun, toko, produk, dan riwayat tokomu akan dihapus dari LepasIn.'
            : 'Tindakan ini permanen. Data akun dan pengajuan toko yang ditolak akan dihapus agar kamu dapat mendaftar ulang.'
        }
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        confirmVariant="danger"
        type="danger"
      />

      {viewingPhoto && user.id_card_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto verifikasi KTM"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70"
        >
          <div className="bg-surface border border-border-subtle rounded-2xl max-w-lg w-full p-5 shadow-lg flex flex-col gap-4 max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="min-w-0">
                <h2 className="font-bold text-ink text-sm md:text-base flex items-center gap-2 truncate">
                  <CreditCard className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
                  <span>Foto Verifikasi Identitas (Selfie + KTM)</span>
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Foto yang dikirimkan saat pendaftaran toko
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhoto(false)}
                className="w-10 h-10 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted flex items-center justify-center"
                aria-label="Tutup foto"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-surface-muted border border-border-subtle">
              <Image
                src={user.id_card_url}
                alt="Foto Selfie dengan KTM"
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 640px) 90vw, 500px"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <p className="text-ink-muted">
                Pastikan kartu identitas terbaca jelas agar verifikasi dapat disetujui.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setViewingPhoto(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
