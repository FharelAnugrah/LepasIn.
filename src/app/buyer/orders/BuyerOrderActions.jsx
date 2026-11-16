'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function BuyerOrderActions({ orderId, status, deliveryMethod = 'meetup' }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmReceivedOpen, setConfirmReceivedOpen] = useState(false);

  // Konfirmasi Pesanan Diterima
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

      toast.success(data.message || 'Pesanan berhasil diselesaikan! Silakan beri ulasan barang.');
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
    <div className="flex flex-wrap items-center gap-2">
      {/* Tombol Chat Penjual selalu tersedia untuk komunikasi */}
      <Button
        href={`/chat?order_id=${orderId}`}
        size="sm"
        variant="secondary"
        pill
        className="border border-line shadow-xs"
      >
        <MessageCircle className="w-3.5 h-3.5 mr-1 text-primary" />
        <span>Chat Penjual</span>
      </Button>

      {/* Tombol Pesanan Diterima jika status 'shipped' */}
      {status === 'shipped' && (
        <>
          <Button
            size="sm"
            variant="primary"
            pill
            loading={loading}
            onClick={() => setConfirmReceivedOpen(true)}
            className="shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-white" />
            <span>Pesanan Diterima</span>
          </Button>

          <ConfirmDialog
            isOpen={confirmReceivedOpen}
            onClose={() => setConfirmReceivedOpen(false)}
            onConfirm={handleConfirmReceived}
            title="Konfirmasi Pesanan Diterima?"
            message={
              deliveryMethod === 'meetup'
                ? 'Pastikan Anda telah bertemu langsung dengan penjual di kampus dan memeriksa kondisi barang preloved sebelum menyelesaikan transaksi ini demi keamanan bersama.'
                : 'Pastikan paket barang preloved telah tiba di kost dan kondisinya sesuai deskripsi sebelum menyelesaikan pesanan ini.'
            }
            confirmText="Ya, Pesanan Sudah Diterima"
            cancelText="Periksa Kembali"
            confirmVariant="primary"
            type="success"
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
