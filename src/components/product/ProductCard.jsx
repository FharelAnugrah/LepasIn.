'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Package, ShoppingCart, GraduationCap, Loader2 } from 'lucide-react';
import { formatRupiah } from '@/components/ui/Badge';
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
  const [cartLoading, setCartLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isSoldOut = product.stock <= 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/login?next=/products/${product.id}`);
      return;
    }

    if (user.role !== 'buyer') {
      toast.info('Hanya akun pembeli yang dapat menambahkan barang ke keranjang');
      return;
    }

    if (isSoldOut) {
      toast.error('Stok produk ini sudah habis');
      return;
    }

    setCartLoading(true);
    try {
      const res = await fetch('/api/buyer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menambahkan ke keranjang');
        return;
      }

      toast.success('Barang berhasil ditambahkan ke keranjang.');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cart-updated', {
            detail: {
              cartCount: data.cartCount,
              cartTotal: data.cartTotal,
            },
          })
        );
      }

      router.refresh();
    } catch (err) {
      console.error('Add to cart error:', err);
      toast.error('Terjadi gangguan jaringan');
    } finally {
      setCartLoading(false);
    }
  };

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
      const res = await fetch('/api/buyer/wishlist', {
        method: wishlisted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (res.ok) {
        const nextState = !wishlisted;
        setWishlisted(nextState);
        toast.success(nextState ? 'Ditambahkan ke favorit' : 'Dihapus dari favorit');
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
    <div className="perspective-stage h-full">
      <article
        data-tilt-3d="card"
        className="group tilt-3d card-3d relative h-full flex flex-col min-w-0 rounded-2xl overflow-hidden"
      >
        {/* Pantulan cahaya siang mengikuti posisi kursor */}
        <div className="tilt-glare" aria-hidden="true" />

        {/* Tautan kartu ke halaman detail produk */}
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 z-0 rounded-2xl"
          aria-label={`Lihat detail produk ${product.name}`}
        />

        {/* 1. Foto Produk Bersih di dalam Bingkai Tray 3D */}
        <div className="p-2 pb-0 pointer-events-none depth-layer-1">
          <div className="relative aspect-[4/3] w-full rounded-xl bg-surface-muted overflow-hidden border border-border-subtle/80 shadow-[inset_0_2px_6px_rgba(15,41,74,0.08)]">
            {!imgError && product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                unoptimized
                onError={() => setImgError(true)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover transition-transform duration-300 ease-out group-hover:scale-[1.06] ${
                  isSoldOut ? 'opacity-65 grayscale-[30%]' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-ink-subtle gap-1.5 p-4 text-center">
                <Package className="w-7 h-7 stroke-[1.5]" aria-hidden="true" />
                <span className="text-xs font-medium">Foto belum tersedia</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Konten Kartu dengan Elevasi Lapisan Z: Kampus -> Nama Barang -> Harga & Stok -> Aksi */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2 pointer-events-none depth-layer-1">
            {/* Kampus */}
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue bg-brand-blue-soft border border-brand-blue-border/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_1.5px_0_#C5D6EA] px-2.5 py-0.5 rounded-lg w-fit max-w-full"
              title={product.campus_name || product.campus_short_name || 'Kampus'}
            >
              <GraduationCap className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{product.campus_short_name || 'Kampus'}</span>
            </span>

            {/* Nama Barang */}
            <h3 className="text-sm font-semibold text-ink leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-brand-blue transition-colors">
              {product.name}
            </h3>

            {/* Harga dan Stok */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pt-0.5 depth-layer-2">
              <p className="text-base sm:text-lg font-extrabold text-navy-900 tabular-nums leading-tight tracking-tight">
                {formatRupiah(product.price)}
              </p>
              {isSoldOut ? (
                <span className="text-xs font-semibold text-danger-text bg-danger-bg border border-red-200 px-2 py-0.5 rounded-md">
                  Stok Habis
                </span>
              ) : (
                <span className="text-xs font-medium text-ink-muted bg-canvas border border-border-subtle/80 px-2 py-0.5 rounded-md tabular-nums">
                  Stok {product.stock}
                </span>
              )}
            </div>
          </div>

          {/* 3. Baris Aksi Mekanis 3D: Add to Cart + Wishlist */}
          <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 pt-3 border-t border-border-subtle/80 depth-layer-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={cartLoading || isSoldOut}
              aria-label={isSoldOut ? `${product.name} stok habis` : `Tambah ${product.name} ke keranjang`}
              className="btn-3d btn-3d-primary flex-1 min-w-0 min-h-[44px] md:min-h-[40px] px-1.5 sm:px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
            >
              {cartLoading ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" aria-hidden="true" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
              )}
              {isSoldOut ? (
                <span>Habis</span>
              ) : (
                <>
                  <span className="sm:hidden">Keranjang</span>
                  <span className="hidden sm:inline">+ Keranjang</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWishlistClick}
              disabled={wishlistLoading}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? `Hapus ${product.name} dari favorit` : `Simpan ${product.name} ke favorit`}
              title={wishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
              className={`btn-3d w-11 h-11 md:w-10 md:h-10 shrink-0 rounded-xl flex items-center justify-center ${
                wishlisted
                  ? 'bg-danger-bg border border-red-300 text-danger-text shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_3px_0_#FCA5A5] hover:-translate-y-0.5 active:translate-y-0.5'
                  : 'btn-3d-secondary text-ink-muted hover:text-danger-text'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-150 ${
                  wishlisted ? 'text-danger-text fill-danger-text scale-110' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
