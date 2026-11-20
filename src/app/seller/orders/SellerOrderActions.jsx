'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Truck, Handshake, XCircle, Clock, MessageCircle } from 'lucide-react';
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

      toast.success(data.message || 'Status berhasil diperbarui.');
      setCancelModalOpen(false);
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
      <Button
        href={`/chat?order_id=${orderId}`}
        size="sm"
        variant="secondary"
        icon={MessageCircle}
      >
        Chat Pembeli
      </Button>

      {currentStatus === 'pending_payment' && (
        <>
          <Button
            size="sm"
            variant="primary"
            loading={loading}
            icon={Check}
            onClick={() => handleUpdateStatus('processing')}
          >
            Terima & Proses
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={loading}
            icon={XCircle}
            onClick={() => setCancelModalOpen(true)}
          >
            Tolak Pesanan
          </Button>
        </>
      )}

      {currentStatus === 'processing' && (
        <>
          <Button
            size="sm"
            variant="primary"
            loading={loading}
            icon={deliveryMethod === 'meetup' ? Handshake : Truck}
            onClick={() => handleUpdateStatus('shipped')}
          >
            {deliveryMethod === 'meetup' ? 'Siap Ketemuan di Kampus' : 'Kirim Barang'}
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={loading}
            icon={XCircle}
            onClick={() => setCancelModalOpen(true)}
          >
            Batalkan
          </Button>
        </>
      )}

      {currentStatus === 'shipped' && (
        <div className="flex items-center gap-2 text-xs text-navy-900 bg-info-bg px-3 py-2 rounded-lg border border-brand-blue-border font-medium">
          <Clock className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
          <span>
            {deliveryMethod === 'meetup'
              ? 'Menunggu pembeli menekan Pesanan Diterima saat COD di kampus'
              : 'Menunggu pembeli menekan Pesanan Diterima setelah paket sampai'}
          </span>
        </div>
      )}

      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => handleUpdateStatus('cancelled')}
        title="Batalkan Pesanan Ini?"
        message="Pesanan akan dibatalkan dan stok produk akan dikembalikan ke etalase tokomu."
        confirmText="Ya, Batalkan Pesanan"
        cancelText="Kembali"
        confirmVariant="danger"
        type="danger"
        loading={loading}
      />
    </div>
  );
}
