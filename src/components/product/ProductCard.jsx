'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Star, GraduationCap, Package } from 'lucide-react';
import { PricePill } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function ProductCard({
  product,
  isWishlisted = false,
  user = null,
  onWishlistToggle = null,
}) {
  const router = useRouter();
  const toast = useToast();
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isSoldOut = product.stock <= 0;

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/login?next=/products/${product.id}`);
      return;
    }

    if (user.role !== 'buyer') {
      toast.info('Hanya akun pembeli yang dapat menambahkan ke favorit');
      return;
    }

    setWishlistLoading(true);
    try {
      const res = await fetch(`/api/buyer/wishlist`, {
        method: wishlisted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (res.ok) {
        const nextState = !wishlisted;
        setWishlisted(nextState);
        toast.success(
          nextState
            ? 'Ditambahkan ke favorit'
            : 'Dihapus dari favorit'
        );
        if (onWishlistToggle) {
          onWishlistToggle(product.id, nextState);
        }
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="group relative block min-w-0 bg-canvas border border-line/80 rounded-card p-2 sm:p-2.5 md:p-3 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
      {/* Tautan Peregang ke Detail Produk (Valid HTML & Ramah Layar Sentuh Mobile) */}
      <Link
        href={`/products/${product.id}`}
        className="absolute inset-0 z-0 rounded-card"
        aria-label={`Lihat detail produk ${product.name}`}
      />

      {/* Container Foto Produk 1:1 */}
      <div className="relative aspect-square w-full rounded-2xl bg-surface overflow-hidden mb-2.5 pointer-events-none">
        {!imgError && product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            unoptimized
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-soft/60 gap-1.5 p-4 text-center">
            <Package className="w-8 h-8 stroke-[1.5]" />
            <span className="text-xs">Foto belum tersedia</span>
          </div>
        )}

        {/* Overlay Terjual Bila Stok 0 */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-ink/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full tracking-wider shadow-sm">
              TERJUAL
            </span>
          </div>
        )}
      </div>

      {/* Tombol Hati Wishlist (Melayang di Kanan Atas, z-10 agar berdiri sendiri tanpa konflik sentuhan link) */}
      <button
        type="button"
        onClick={handleWishlistClick}
        disabled={wishlistLoading}
        aria-label={wishlisted ? 'Hapus dari favorit' : 'Tambah ke favorit'}
        title={wishlisted ? 'Hapus dari favorit' : 'Tambah ke favorit'}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 w-10 h-10 rounded-full bg-white/95 shadow-sm hover:shadow-md border border-line/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer z-10 pointer-events-auto"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            wishlisted
              ? 'text-danger fill-danger'
              : 'text-ink-soft hover:text-danger'
          }`}
        />
      </button>

      {/* Price Pill Biru Kobalt Khas LepasIn */}
      <div className="relative z-0 pointer-events-none mb-1.5">
        <PricePill amount={product.price} size="sm" />
      </div>

      {/* Info Stok */}
      <div className="relative z-0 pointer-events-none font-sans text-xs text-ink-soft font-medium mb-1">
        {isSoldOut ? (
          <span className="text-danger font-semibold">Stok Habis</span>
        ) : (
          <span className="tabular-nums">Tersedia: {product.stock} stok</span>
        )}
      </div>

      {/* Rating & Kode Kampus */}
      <div className="relative z-0 pointer-events-none font-sans flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] sm:text-xs text-ink-soft mb-1 font-medium">
        <div className="flex items-center gap-0.5 text-accent font-bold tabular-nums">
          <Star className="w-3.5 h-3.5 fill-accent text-accent" />
          <span className="text-ink">
            {product.avg_rating && Number(product.avg_rating) > 0
              ? Number(product.avg_rating).toFixed(1)
              : 'Baru'}
          </span>
          {product.review_count && Number(product.review_count) > 0 && (
            <span className="text-ink-soft font-normal">
              ({product.review_count})
            </span>
          )}
        </div>
        <span>·</span>
        <div className="flex items-center gap-1 text-pine font-semibold truncate" title={`Kampus: ${product.campus_short_name || 'Kampus'}`}>
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {product.campus_short_name || 'Kampus'}
          </span>
        </div>
      </div>

      {/* Nama Produk (Maks 2 Baris) */}
      <h3 className="relative z-0 pointer-events-none font-sans text-[13px] md:text-sm font-semibold text-ink line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {product.name}
      </h3>
    </div>
  );
}
