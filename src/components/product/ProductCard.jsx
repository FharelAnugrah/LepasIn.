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
    <Link
      href={`/products/${product.id}`}
      className="group block bg-canvas border border-line/80 rounded-card p-2.5 md:p-3 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Container Foto Produk 1:1 */}
      <div className="relative aspect-square w-full rounded-2xl bg-surface overflow-hidden mb-2.5">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-soft/40 gap-1.5 p-4 text-center">
            <Package className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[10px]">Belum ada foto</span>
          </div>
        )}

        {/* Tombol Hati Wishlist (Melayang di Kanan Atas) */}
        <button
          type="button"
          onClick={handleWishlistClick}
          disabled={wishlistLoading}
          aria-label={wishlisted ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              wishlisted
                ? 'text-danger fill-danger'
                : 'text-ink-soft/70 hover:text-danger'
            }`}
          />
        </button>

        {/* Overlay Terjual Bila Stok 0 */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-ink/90 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wider shadow-sm">
              TERJUAL
            </span>
          </div>
        )}
      </div>

      {/* Price Pill Biru Kobalt Khas LepasIn */}
      <div className="mb-1.5">
        <PricePill amount={product.price} size="sm" />
      </div>

      {/* Info Stok */}
      <div className="text-[11px] text-ink-soft font-medium mb-1">
        {isSoldOut ? (
          <span className="text-danger font-semibold">Stok Habis</span>
        ) : (
          <span>Tersisa {product.stock} Stok</span>
        )}
      </div>

      {/* Rating & Kode Kampus */}
      <div className="flex items-center gap-1.5 text-[11px] text-ink-soft mb-1 font-medium">
        <div className="flex items-center gap-0.5 text-accent font-bold">
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
        <div className="flex items-center gap-1 text-pine font-semibold truncate">
          <GraduationCap className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {product.campus_short_name || 'Kampus'}
          </span>
        </div>
      </div>

      {/* Nama Produk (Maks 2 Baris) */}
      <h3 className="text-xs md:text-sm font-semibold text-ink line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {product.name}
      </h3>
    </Link>
  );
}
