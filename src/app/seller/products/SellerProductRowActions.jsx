'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit2, Trash2, Eye, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function SellerProductRowActions({
  productId,
  productName,
  activeOrdersCount = 0,
  completedOrdersCount = 0,
}) {
  const router = useRouter();
  const toast = useToast();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus produk');
        setDeleteModalOpen(false);
        setLoading(false);
        router.refresh();
        return;
      }

      toast.success(`"${productName}" berhasil dihapus dari lapak`);
      setDeleteModalOpen(false);
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link href={`/products/${productId}`} title="Lihat di Etalase Publik" aria-label="Lihat di Etalase Publik">
        <Button variant="ghost" size="sm" pill className="w-11 h-11 md:w-9 md:h-9 !p-0">
          <Eye className="w-4 h-4 text-ink-soft hover:text-ink" />
        </Button>
      </Link>

      <Link href={`/seller/products/${productId}/edit`} title="Edit Barang" aria-label="Edit Barang">
        <Button variant="secondary" size="sm" pill className="w-11 h-11 md:w-9 md:h-9 !p-0">
          <Edit2 className="w-4 h-4 text-ink" />
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="sm"
        pill
        onClick={() => setDeleteModalOpen(true)}
        className="w-11 h-11 md:w-9 md:h-9 !p-0 text-danger hover:bg-danger-50"
        title="Hapus Barang"
        aria-label="Hapus Barang"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* Jika barang sedang dalam pesanan aktif pembeli */}
      {activeOrdersCount > 0 ? (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center text-center p-2">
            <div className="w-12 h-12 rounded-full bg-warning-50 text-warning flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Barang Tidak Dapat Dihapus</h3>
            <p className="text-xs md:text-sm text-ink-soft mb-6 leading-relaxed">
              Barang <strong className="text-ink">&quot;{productName}&quot;</strong> saat ini sudah di-checkout oleh pembeli dan sedang dalam pesanan aktif ({activeOrdersCount} pesanan berjalan).
              <br />
              <span className="inline-block mt-2 font-medium text-warning">
                Demi keamanan transaksi pembeli, barang ini otomatis tidak dapat dihapus dari lapak hingga pesanan diselesaikan atau dibatalkan.
              </span>
            </p>
            <div className="flex items-center gap-2.5 w-full">
              <Link href="/seller/orders" className="flex-1">
                <Button variant="primary" size="sm" pill className="w-full">
                  Lihat Pesanan Masuk
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                pill
                className="flex-1"
                onClick={() => setDeleteModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      ) : completedOrdersCount > 0 ? (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center text-center p-2">
            <div className="w-12 h-12 rounded-full bg-surface-alt text-ink-soft flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-2">Barang Memiliki Riwayat Penjualan</h3>
            <p className="text-xs md:text-sm text-ink-soft mb-6 leading-relaxed">
              Barang <strong className="text-ink">&quot;{productName}&quot;</strong> telah berhasil terjual pada transaksi sebelumnya. Demi menjaga arsip riwayat pesanan dan ulasan pembeli, barang ini tidak dapat dihapus dari sistem.
            </p>
            <Button
              variant="secondary"
              size="sm"
              pill
              className="w-full"
              onClick={() => setDeleteModalOpen(false)}
            >
              Tutup
            </Button>
          </div>
        </Modal>
      ) : (
        <ConfirmDialog
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Hapus Barang Preloved?"
          message={`Apakah Anda yakin ingin menghapus "${productName}" dari etalase toko? Barang ini tidak dapat dikembalikan lagi.`}
          confirmText="Ya, Hapus Barang"
          cancelText="Batal"
          danger
          loading={loading}
        />
      )}
    </div>
  );
}
