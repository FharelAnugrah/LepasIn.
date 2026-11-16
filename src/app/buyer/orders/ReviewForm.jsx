'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function ReviewForm({ orderItemId, productId, productName }) {
  const router = useRouter();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/buyer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_item_id: orderItemId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal mengirim ulasan');
        setLoading(false);
        return;
      }

      toast.success('Terima kasih atas ulasanmu! ⭐');
      setIsOpen(false);
      setLoading(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="secondary"
        size="sm"
        pill
        onClick={() => setIsOpen(true)}
        className="text-xs font-bold"
      >
        <Star className="w-3.5 h-3.5 text-accent fill-accent mr-1" />
        <span>Beri Ulasan Barang</span>
      </Button>
    );
  }

  const activeStar = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 p-3.5 rounded-xl bg-surface border border-line flex flex-col gap-3 animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink">
          Beri Penilaian untuk &quot;{productName}&quot;
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-ink-soft hover:text-ink"
        >
          Tutup
        </button>
      </div>

      {/* Seleksi Bintang 1 - 5 */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((starVal) => (
          <button
            key={starVal}
            type="button"
            onMouseEnter={() => setHoverRating(starVal)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(starVal)}
            className="p-1 hover:scale-110 transition-transform cursor-pointer"
            aria-label={`Beri rating ${starVal} bintang`}
          >
            <Star
              className={`w-6 h-6 ${
                starVal <= activeStar
                  ? 'text-accent fill-accent'
                  : 'text-line fill-line'
              }`}
            />
          </button>
        ))}
        <span className="text-xs font-bold text-ink ml-2">
          {rating === 5 && 'Sangat Bagus!'}
          {rating === 4 && 'Bagus & Sesuai'}
          {rating === 3 && 'Cukup / Lumayan'}
          {rating === 2 && 'Kurang Memuaskan'}
          {rating === 1 && 'Mengecewakan'}
        </span>
      </div>

      <textarea
        placeholder="Tulis ulasan pengalamanmu (misal: barang masih mulus, penjual ramah, tepat waktu saat COD)..."
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full p-2.5 rounded-xl bg-canvas text-xs md:text-sm border border-line outline-none focus:border-primary"
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          pill
          disabled={loading}
          onClick={() => setIsOpen(false)}
        >
          Batal
        </Button>
        <Button type="submit" variant="primary" size="sm" pill loading={loading}>
          Kirim Ulasan
        </Button>
      </div>
    </form>
  );
}
