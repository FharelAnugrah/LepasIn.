'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit2, Trash2, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function SellerProductRowActions({ productId, productName }) {
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
        setLoading(false);
        return;
      }

      toast.success(`"${productName}" berhasil dihapus`);
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
      <Link href={`/products/${productId}`} title="Lihat di Etalase Publik">
        <Button variant="ghost" size="sm" pill className="p-2">
          <Eye className="w-4 h-4 text-ink-soft hover:text-ink" />
        </Button>
      </Link>

      <Link href={`/seller/products/${productId}/edit`} title="Edit Barang">
        <Button variant="secondary" size="sm" pill className="p-2">
          <Edit2 className="w-4 h-4 text-ink" />
        </Button>
      </Link>

      <Button
        variant="ghost"
        size="sm"
        pill
        onClick={() => setDeleteModalOpen(true)}
        className="p-2 text-danger hover:bg-danger-50"
        title="Hapus Barang"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

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
    </div>
  );
}
