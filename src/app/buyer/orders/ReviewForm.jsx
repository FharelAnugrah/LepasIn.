'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function ReviewForm({ orderItemId, productName }) {
  const router = useRouter();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
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

      toast.success('Terima kasih atas ulasanmu.');
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
        onClick={() => setIsOpen(true)}
      >
        <Star className="w-3.5 h-3.5 text-campus-gold fill-campus-gold" aria-hidden="true" />
        <span>Beri Ulasan Barang</span>
      </Button>
    );
  }

  const activeStar = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 p-4 rounded-xl bg-canvas border border-border-subtle flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-ink">
          Penilaian untuk &ldquo;{productName}&rdquo;
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs font-medium text-ink-muted hover:text-ink px-2 py-1 rounded-md"
        >
          Tutup
        </button>
      </div>

      {/* Pemilih 1-5 Bintang #FBBF24 (design2.md 5.6) */}
      <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Pilih rating bintang 1 sampai 5">
        {[1, 2, 3, 4, 5].map((starVal) => (
          <button
            key={starVal}
            type="button"
            onMouseEnter={() => setHoverRating(starVal)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(starVal)}
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-surface transition-colors"
            aria-label={`Beri rating ${starVal} bintang`}
            aria-pressed={rating === starVal}
          >
            <Star
              className={`w-6 h-6 ${
                starVal <= activeStar
                  ? 'text-campus-gold fill-campus-gold'
                  : 'text-border-subtle fill-border-subtle'
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
        <span className="text-xs font-semibold text-ink ml-2">
          {rating === 5 && 'Sangat Bagus'}
          {rating === 4 && 'Bagus & Sesuai'}
          {rating === 3 && 'Cukup / Lumayan'}
          {rating === 2 && 'Kurang Memuaskan'}
          {rating === 1 && 'Mengecewakan'}
        </span>
      </div>

      <div>
        <label htmlFor={`review-comment-${orderItemId}`} className="sr-only">
          Komentar ulasan
        </label>
        <textarea
          id={`review-comment-${orderItemId}`}
          placeholder="Tulis pengalamanmu (misal: barang mulus sesuai foto, penjual tepat waktu saat COD)..."
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 rounded-lg bg-surface text-base md:text-sm text-ink placeholder:text-ink-muted border border-border-subtle outline-none focus:border-brand-blue focus:ring-3 focus:ring-brand-blue-soft"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => setIsOpen(false)}
        >
          Batal
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={loading}>
          Kirim Ulasan
        </Button>
      </div>
    </form>
  );
}
