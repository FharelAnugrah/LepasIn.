'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Truck, CheckCircle2, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function SellerOrderActions({ orderId, currentStatus, deliveryMethod = 'meetup' }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleUpdateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal memperbarui status');
        setLoading(false);
        return;
      }

      toast.success(data.message || 'Status berhasil diperbarui!');
      setCancelModalOpen(false);
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan');
      setLoading(false);
    }
  };

  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {currentStatus === 'pending_payment' && (
        <>
          <Button
            size="sm"
            variant="primary"
            pill
            loading={loading}
            onClick={() => handleUpdateStatus('processing')}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            <span>Terima & Proses</span>
          </Button>
          <Button
            size="sm"
            variant="danger"
            pill
            disabled={loading}
            onClick={() => setCancelModalOpen(true)}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            <span>Tolak Pesanan</span>
          </Button>
        </>
      )}

      {currentStatus === 'processing' && (
        <>
          <Button
            size="sm"
            variant="primary"
            pill
            loading={loading}
            onClick={() => handleUpdateStatus('shipped')}
          >
            <Truck className="w-3.5 h-3.5 mr-1" />
            <span>
              {deliveryMethod === 'meetup' ? 'Siap Ketemuan di Kampus' : 'Kirim Barang'}
            </span>
          </Button>
          <Button
            size="sm"
            variant="danger"
            pill
            disabled={loading}
            onClick={() => setCancelModalOpen(true)}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            <span>Batalkan</span>
          </Button>
        </>
      )}

      {currentStatus === 'shipped' && (
        <Button
          size="sm"
          variant="primary"
          pill
          loading={loading}
          onClick={() => handleUpdateStatus('completed')}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          <span>Tandai Selesai & Diterima</span>
        </Button>
      )}

      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => handleUpdateStatus('cancelled')}
        title="Batalkan Pesanan Ini?"
        message="Pesanan akan dibatalkan dan stok produk akan secara otomatis dikembalikan ke etalase toko."
        confirmText="Ya, Batalkan Pesanan"
        cancelText="Kembali"
        danger
        loading={loading}
      />
    </div>
  );
}
