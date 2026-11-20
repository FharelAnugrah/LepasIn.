'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star,
  GraduationCap,
  MapPin,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Package,
  Plus,
  Minus,
  ArrowLeft,
  MessageSquare,
  MessageCircle,
  Handshake,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge, { PricePill, ConditionBadge, CampusBadge, formatRupiah } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function ProductDetailClient({
  product,
  images = [],
  reviews = [],
  user = null,
  isWishlisted = false,
}) {
  const router = useRouter();
  const toast = useToast();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const isSoldOut = product.stock <= 0;
  const isOwner = user && user.id === product.seller_user_id;
  const isAdmin = user && user.role === 'admin';
  const canChat = !isOwner && !isAdmin;
  const currentImages = images.length > 0 ? images : product.image_url ? [{ url: product.image_url }] : [];
  const activeImage = currentImages[selectedImageIndex]?.url;

  const discountPercent =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0;

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > product.stock) return product.stock;
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/login?next=/products/${product.id}`);
      return;
    }

    if (user.role !== 'buyer') {
      toast.info('Hanya akun pembeli yang dapat berbelanja');
      return;
    }

    if (isSoldOut) {
      toast.error('Stok produk ini sudah habis');
      return;
    }

    setAddingToCart(true);
    try {
      const res = await fetch('/api/buyer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, quantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menambahkan ke keranjang');
        setAddingToCart(false);
        return;
      }

      toast.success(`${quantity} barang berhasil ditambahkan ke keranjang.`);
      setAddingToCart(false);

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
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push(`/login?next=/products/${product.id}`);
      return;
    }

    if (user.role !== 'buyer') {
      toast.info('Hanya akun pembeli yang dapat menyimpan favorit');
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-secondary hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Katalog Produk</span>
        </Link>
      </div>

      {/* Layout 2 Kolom Desktop per design2.md 5.4 (5:7 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri (lg:col-span-5): Galeri Foto Utama 3D Stage & Thumbnail */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 perspective-stage">
          <div
            data-tilt-3d="stage"
            className="tilt-3d surface-3d rounded-3xl p-2.5"
          >
            <div className="tilt-glare" aria-hidden="true" />
            <div className="relative aspect-square w-full rounded-2xl bg-surface-muted overflow-hidden border border-border-subtle shadow-[inset_0_2px_8px_rgba(15,41,74,0.08)] depth-layer-1">
              {!failedImages[activeImage] && activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  unoptimized
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                  onError={() => setFailedImages((prev) => ({ ...prev, [activeImage]: true }))}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-ink-subtle gap-2">
                  <Package className="w-12 h-12 stroke-[1.5]" aria-hidden="true" />
                  <span className="text-xs font-medium">Foto produk belum tersedia</span>
                </div>
              )}

              {isSoldOut && (
                <div className="absolute inset-0 bg-ink/65 flex items-center justify-center">
                  <span className="bg-ink text-white font-bold text-sm px-4 py-1.5 rounded-full tracking-wide shadow-md">
                    BARANG TERJUAL
                  </span>
                </div>
              )}
            </div>
          </div>

          {currentImages.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-0.5">
              {currentImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`Lihat foto ${idx + 1} dari ${currentImages.length}`}
                  aria-pressed={selectedImageIndex === idx}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-brand-blue shadow-[0_3px_0_#143661] -translate-y-0.5'
                      : 'border-border-subtle hover:border-brand-blue/60 shadow-[0_2px_0_#CBD7E6] hover:-translate-y-0.5'
                  }`}
                >
                  {!failedImages[img.url] ? (
                    <Image
                      src={img.url}
                      alt={`${product.name} foto ${idx + 1}`}
                      fill
                      unoptimized
                      onError={() => setFailedImages((prev) => ({ ...prev, [img.url]: true }))}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-muted text-ink-subtle">
                      <Package className="w-5 h-5" aria-hidden="true" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan (lg:col-span-7): Info Produk, Price Pill, Store Card, Action Bar */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Badge Kampus, Kondisi, Kategori */}
          <div className="flex flex-wrap items-center gap-2">
            <CampusBadge shortName={product.campus_short_name} cityName={product.campus_city} />
            <ConditionBadge condition={product.condition} />
            <Badge variant="secondary" size="xs">
              {product.category_name}
            </Badge>
          </div>

          {/* Judul Produk */}
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight leading-snug break-words [overflow-wrap:anywhere]">
            {product.name}
          </h1>

          {/* Rating & Sisa Stok */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-secondary pb-4 border-b border-border-subtle tabular-nums">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <Star className="w-4 h-4 fill-campus-gold text-campus-gold" aria-hidden="true" />
              <span>
                {product.avg_rating && Number(product.avg_rating) > 0
                  ? Number(product.avg_rating).toFixed(1)
                  : 'Baru'}
              </span>
              <span className="text-ink-muted font-normal">
                ({product.review_count || 0} ulasan)
              </span>
            </div>
            <span className="text-border-subtle" aria-hidden="true">|</span>
            <div>
              {isSoldOut ? (
                <span className="text-danger-text font-semibold">Stok Habis</span>
              ) : (
                <span>
                  Tersisa <strong className="text-ink">{product.stock}</strong> stok barang
                </span>
              )}
            </div>
            <span className="text-border-subtle" aria-hidden="true">|</span>
            <span className="inline-flex items-center gap-1 text-brand-blue font-medium">
              <Handshake className="w-4 h-4" aria-hidden="true" />
              <span>Bisa COD Kampus</span>
            </span>
          </div>

          {/* Blok Harga: Blue Price Pill besar + Harga Coret + Hemat % (design2.md 5.4) */}
          <div className="flex flex-wrap items-center gap-3">
            <PricePill amount={product.price} size="lg" />

            {discountPercent > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-muted line-through tabular-nums">
                  {formatRupiah(product.original_price)}
                </span>
                <span className="bg-success-bg text-success-text text-xs font-bold px-2.5 py-0.5 rounded-md tabular-nums">
                  Hemat {discountPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Action Bar 3D: Kontrol Jumlah, Tambah ke Keranjang, Wishlist */}
          <div className="p-4 rounded-2xl surface-3d flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xs font-semibold text-ink-secondary">Jumlah:</span>
              <div className="inline-flex items-center bg-canvas rounded-xl border border-border-subtle p-1 shadow-[inset_0_2px_4px_rgba(15,41,74,0.06)]">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isSoldOut}
                  className="btn-3d btn-3d-secondary w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-40"
                  aria-label="Kurangi jumlah barang"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="w-10 text-center font-bold tabular-nums text-sm text-ink">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock || isSoldOut}
                  className="btn-3d btn-3d-secondary w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-40"
                  aria-label="Tambah jumlah barang"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSoldOut || addingToCart}
                className="btn-3d btn-3d-primary flex-1 disabled:opacity-50 font-semibold h-11 px-6 rounded-xl inline-flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {addingToCart
                    ? 'Menambahkan...'
                    : isSoldOut
                    ? 'Stok Habis'
                    : 'Tambah ke Keranjang'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                aria-pressed={wishlisted}
                aria-label={wishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                title={wishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                className={`btn-3d w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  wishlisted
                    ? 'bg-danger-bg border border-red-300 text-danger-text shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_3px_0_#FCA5A5]'
                    : 'btn-3d-secondary text-ink-secondary hover:text-danger-text'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${wishlisted ? 'fill-danger-text' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Kartu Info Toko & Lokasi Kost 3D */}
          <div className="rounded-2xl surface-3d p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl icon-plinth-navy text-white font-bold text-base flex items-center justify-center shrink-0 uppercase">
                {product.store_name ? product.store_name.charAt(0) : 'T'}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink text-sm md:text-base truncate">
                    {product.store_name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-success-bg text-success-text border border-green-200">
                    <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                    <span>Terverifikasi</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-blue font-semibold mt-1">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{product.campus_name}</span>
                </div>
                {product.store_location && (
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">Area Kost: {product.store_location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
              {canChat && (
                <Link
                  href={
                    user
                      ? `/chat?store_id=${product.store_id}&product_id=${product.id}`
                      : `/login?next=${encodeURIComponent(`/products/${product.id}`)}`
                  }
                  className="btn-3d btn-3d-outline inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold flex-1 sm:flex-none"
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Tanya Penjual</span>
                </Link>
              )}

              <Button href={`/stores/${product.store_id}`} variant="secondary" size="sm" className="flex-1 sm:flex-none">
                Kunjungi Toko
              </Button>
            </div>
          </div>

          {/* Deskripsi Barang */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-ink">
              Deskripsi Barang
            </h2>
            <div className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line surface-3d p-4 rounded-2xl">
              {product.description}
            </div>
          </div>
        </div>
      </div>

      {/* Section Ulasan Pembeli */}
      <section className="surface-3d rounded-2xl p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Ulasan Pembeli</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Penilaian dari Mahasiswa yang telah menyelesaikan transaksi.
            </p>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-lg tabular-nums">
            <Star className="w-5 h-5 fill-campus-gold text-campus-gold" aria-hidden="true" />
            <span className="text-ink">
              {product.avg_rating && Number(product.avg_rating) > 0
                ? Number(product.avg_rating).toFixed(1)
                : '0.0'}
            </span>
            <span className="text-xs text-ink-muted font-normal">/ 5.0</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="py-8 text-center text-sm text-ink-muted">
            <MessageSquare className="w-8 h-8 text-ink-muted mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium text-ink">Belum ada ulasan untuk barang ini.</p>
            <p className="text-xs text-ink-muted mt-1">
              Ulasan dapat ditulis setelah pesanan berstatus Selesai.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {reviews.map((rv) => (
              <div key={rv.id} className="py-4 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-blue-soft text-brand-blue font-bold text-xs flex items-center justify-center uppercase">
                      {rv.buyer_name ? rv.buyer_name.charAt(0) : 'M'}
                    </div>
                    <span className="font-semibold text-sm text-ink">{rv.buyer_name}</span>
                  </div>
                  <div className="flex items-center gap-0.5" aria-label={`Rating ${rv.rating} dari 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rv.rating
                            ? 'text-campus-gold fill-campus-gold'
                            : 'text-border-subtle fill-border-subtle'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed pl-10">
                  {rv.comment || 'Pembeli tidak meninggalkan komentar tertulis.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
