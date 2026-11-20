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
      <Link
        href={`/products/${productId}`}
        title="Lihat di Etalase Publik"
        aria-label={`Lihat ${productName} di etalase publik`}
        className="w-10 h-10 md:w-9 md:h-9 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-muted flex items-center justify-center transition-colors"
      >
        <Eye className="w-4 h-4" aria-hidden="true" />
      </Link>

      <Link
        href={`/seller/products/${productId}/edit`}
        title="Edit Barang"
        aria-label={`Edit ${productName}`}
        className="w-10 h-10 md:w-9 md:h-9 rounded-lg border border-border-subtle bg-canvas text-ink-secondary hover:text-ink hover:bg-surface-muted flex items-center justify-center transition-colors"
      >
        <Edit2 className="w-4 h-4" aria-hidden="true" />
      </Link>

      <button
        type="button"
        onClick={() => setDeleteModalOpen(true)}
        className="w-10 h-10 md:w-9 md:h-9 rounded-lg text-danger-text hover:bg-danger-bg flex items-center justify-center transition-colors"
        title="Hapus Barang"
        aria-label={`Hapus ${productName}`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>

      {activeOrdersCount > 0 ? (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Barang Tidak Dapat Dihapus"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-warning-bg border border-amber-200 text-warning-text flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
              Barang <strong className="text-ink">&quot;{productName}&quot;</strong> sedang dalam pesanan aktif ({activeOrdersCount} pesanan berjalan). Barang tidak dapat dihapus hingga pesanan diselesaikan atau dibatalkan.
            </p>
            <div className="flex items-center gap-2.5 w-full">
              <Button href="/seller/orders" variant="primary" size="sm" className="flex-1">
                Lihat Pesanan Masuk
              </Button>
              <Button
                variant="secondary"
                size="sm"
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
          title="Barang Memiliki Riwayat Penjualan"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-muted border border-border-subtle text-ink-secondary flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm text-ink-secondary mb-6 leading-relaxed">
              Barang <strong className="text-ink">&quot;{productName}&quot;</strong> telah terjual pada transaksi sebelumnya. Untuk menjaga arsip pesanan dan ulasan pembeli, barang ini tidak dapat dihapus.
            </p>
            <Button
              variant="secondary"
              size="sm"
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
          message={`Apakah kamu yakin ingin menghapus "${productName}" dari etalase toko?`}
          confirmText="Ya, Hapus Barang"
          cancelText="Batal"
          confirmVariant="danger"
          type="danger"
          loading={loading}
        />
      )}
    </div>
  );
}
