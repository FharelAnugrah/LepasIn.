'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function BuyerOrderActions({ orderId, status, deliveryMethod = 'meetup' }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmReceivedOpen, setConfirmReceivedOpen] = useState(false);

  const handleConfirmReceived = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/buyer/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal mengonfirmasi pesanan');
        setLoading(false);
        return;
      }

      toast.success(data.message || 'Pesanan selesai. Silakan beri ulasan barang.');
      setConfirmReceivedOpen(false);
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Button
        href={`/chat?order_id=${orderId}`}
        size="sm"
        variant="secondary"
        icon={MessageCircle}
      >
        Chat Penjual
      </Button>

      {/* Tombol Anti-Penipuan Buyer (design2.md 5.6: bg-success-text text-white rounded-lg) */}
      {status === 'shipped' && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => setConfirmReceivedOpen(true)}
            className="min-h-[40px] bg-success-text hover:bg-green-800 disabled:opacity-50 text-white font-semibold text-xs md:text-sm px-5 py-2.5 rounded-lg inline-flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Pesanan Diterima</span>
          </button>

          <ConfirmDialog
            isOpen={confirmReceivedOpen}
            onClose={() => setConfirmReceivedOpen(false)}
            onConfirm={handleConfirmReceived}
            title="Konfirmasi Pesanan Diterima?"
            message={
              deliveryMethod === 'meetup'
                ? 'Pastikan kamu telah bertemu langsung dengan penjual di kampus dan memeriksa kondisi barang sebelum menyelesaikan transaksi ini.'
                : 'Pastikan paket telah tiba di kost dan kondisi barang sesuai deskripsi sebelum menyelesaikan pesanan.'
            }
            confirmText="Ya, Pesanan Diterima"
            cancelText="Periksa Kembali"
            confirmVariant="success"
            type="success"
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
