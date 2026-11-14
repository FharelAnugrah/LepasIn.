'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Store,
  GraduationCap,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Clock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { SellerStatusBadge } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function SellersManager({ initialSellers, initialStatus = 'all' }) {
  const router = useRouter();
  const toast = useToast();

  const [sellers, setSellers] = useState(initialSellers);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');

  // State Dialog Konfirmasi
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    seller: null,
    action: null, // 'approve' | 'reject'
    loading: false,
  });

  const filteredSellers = sellers.filter((s) => {
    const matchStatus =
      statusFilter === 'all' ? true : s.seller_status === statusFilter;

    if (!matchStatus) return false;
    if (!search.trim()) return true;

    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.store_name && s.store_name.toLowerCase().includes(q)) ||
      (s.campus_name && s.campus_name.toLowerCase().includes(q)) ||
      (s.campus_short_name && s.campus_short_name.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q))
    );
  });

  const handleActionClick = (seller, action) => {
    setConfirmDialog({
      isOpen: true,
      seller,
      action,
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { seller, action } = confirmDialog;
    if (!seller || !action) return;

    setConfirmDialog((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`/api/admin/sellers/${seller.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal mengubah status verifikasi');
        setConfirmDialog((prev) => ({ ...prev, loading: false }));
        return;
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      setSellers((prev) =>
        prev.map((item) =>
          item.id === seller.id ? { ...item, seller_status: newStatus } : item
        )
      );

      toast.success(
        action === 'approve'
          ? `Toko ${seller.store_name} berhasil disetujui!`
          : `Pendaftaran toko ${seller.store_name} ditolak.`
      );

      setConfirmDialog({ isOpen: false, seller: null, action: null, loading: false });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan koneksi');
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
          Verifikasi & Daftar Penjual
        </h1>
        <p className="text-xs md:text-sm text-ink-soft mt-1">
          Tinjau pendaftaran toko mahasiswa, verifikasi identitas kampus, dan kelola status penjual.
        </p>
      </div>

      {/* Bar Filter & Pencarian */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tab Status */}
        <div className="flex p-1 bg-surface rounded-xl border border-line overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'pending', label: 'Menunggu (Pending)' },
            { id: 'approved', label: 'Terverifikasi' },
            { id: 'rejected', label: 'Ditolak' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-canvas text-primary shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari penjual, toko, kampus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs md:text-sm bg-canvas border border-line rounded-xl focus:border-primary focus:ring-2 focus:ring-primary-50 outline-none transition"
          />
        </div>
      </div>

      {/* Grid Kartu / Tabel Penjual */}
      {filteredSellers.length === 0 ? (
        <div className="p-12 text-center bg-canvas border border-line rounded-card">
          <Store className="w-10 h-10 text-ink-soft/40 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-ink">Tidak ada penjual yang sesuai</h2>
          <p className="text-xs text-ink-soft mt-1">
            Coba ubah filter status atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-canvas border border-line rounded-card p-5 shadow-card flex flex-col justify-between gap-4"
            >
              <div>
                {/* Baris Atas: Status & Nama Toko */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-base font-bold text-ink flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-primary shrink-0" />
                      <span>{seller.store_name || 'Nama Toko Belum Ada'}</span>
                    </h2>
                    <p className="text-xs text-ink font-medium mt-0.5">
                      Pemilik: <span className="font-semibold">{seller.name}</span>
                    </p>
                  </div>
                  <SellerStatusBadge status={seller.seller_status} />
                </div>

                {/* Info Detail */}
                <div className="p-3 rounded-xl bg-surface border border-line/60 flex flex-col gap-1.5 text-xs text-ink-soft my-2">
                  <div className="flex items-center gap-1.5 text-pine font-medium">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {seller.campus_short_name} — {seller.campus_name} ({seller.campus_city})
                    </span>
                  </div>

                  {seller.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-ink-soft" />
                      <span className="line-clamp-1">Area Kost: {seller.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-1 border-t border-line/50">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{seller.email}</span>
                  </div>

                  {seller.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{seller.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Baris Bawah: Tombol Aksi */}
              <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                {seller.seller_status === 'pending' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      pill
                      icon={CheckCircle}
                      onClick={() => handleActionClick(seller, 'approve')}
                      className="flex-1"
                    >
                      Setujui
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      pill
                      icon={XCircle}
                      onClick={() => handleActionClick(seller, 'reject')}
                      className="flex-1"
                    >
                      Tolak
                    </Button>
                  </>
                )}

                {seller.seller_status === 'rejected' && (
                  <Button
                    variant="success"
                    size="sm"
                    pill
                    icon={CheckCircle}
                    onClick={() => handleActionClick(seller, 'approve')}
                    className="w-full"
                  >
                    Ubah Jadi Disetujui
                  </Button>
                )}

                {seller.seller_status === 'approved' && (
                  <Button
                    variant="danger"
                    size="sm"
                    pill
                    icon={XCircle}
                    onClick={() => handleActionClick(seller, 'reject')}
                    className="w-full"
                  >
                    Tangguhkan / Tolak
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Konfirmasi Verifikasi */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, seller: null, action: null, loading: false })
        }
        onConfirm={handleConfirmAction}
        loading={confirmDialog.loading}
        title={
          confirmDialog.action === 'approve'
            ? 'Setujui Pendaftaran Penjual?'
            : 'Tolak Pendaftaran Penjual?'
        }
        message={
          confirmDialog.action === 'approve'
            ? `Toko "${confirmDialog.seller?.store_name}" milik ${confirmDialog.seller?.name} akan diaktifkan dan dapat mulai menjual barang preloved di kampusnya.`
            : `Pendaftaran toko "${confirmDialog.seller?.store_name}" akan ditolak. Penjual akan melihat status penolakan di halaman status.`
        }
        confirmText={confirmDialog.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
        confirmVariant={confirmDialog.action === 'approve' ? 'success' : 'danger'}
        type={confirmDialog.action === 'approve' ? 'success' : 'danger'}
      />
    </div>
  );
}
