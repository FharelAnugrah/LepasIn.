'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star,
  GraduationCap,
  Store,
  MapPin,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Package,
  Plus,
  Minus,
  ArrowLeft,
  Calendar,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { PricePill, ConditionBadge, CampusBadge, formatRupiah } from '@/components/ui/Badge';
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

  const isSoldOut = product.stock <= 0;
  const isOwner = user && user.id === product.seller_user_id;
  const isAdmin = user && user.role === 'admin';
  const canChat = !isOwner && !isAdmin;
  const currentImages = images.length > 0 ? images : product.image_url ? [{ url: product.image_url }] : [];
  const activeImage = currentImages[selectedImageIndex]?.url;

  // Hitung persentase hemat jika original_price > price
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

      toast.success(`${quantity} barang berhasil ditambahkan ke keranjang!`);
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
    <div className="flex flex-col gap-8 pb-16">
      {/* Breadcrumb / Navigasi Balik */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-soft hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Produk</span>
        </Link>
      </div>

      {/* Grid 2 Kolom: Kiri Foto Galeri, Kanan Detail & Aksi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Galeri Foto (5 kolom) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-square w-full rounded-card bg-surface overflow-hidden border border-line shadow-card">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-ink-soft/40 gap-2">
                <Package className="w-12 h-12 stroke-[1.5]" />
                <span className="text-xs">Foto produk belum diunggah</span>
              </div>
            )}

            {isSoldOut && (
              <div className="absolute inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center">
                <span className="bg-ink/90 text-white font-extrabold text-sm px-4 py-1.5 rounded-full tracking-wider">
                  BARANG TERJUAL
                </span>
              </div>
            )}

            {/* Tombol Wishlist di Foto Utama */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
              aria-label="Favorit"
            >
              <Heart
                className={`w-5 h-5 ${
                  wishlisted ? 'text-danger fill-danger' : 'text-ink-soft hover:text-danger'
                }`}
              />
            </button>
          </div>

          {/* Thumbnail Horizontal jika ada banyak foto */}
          {currentImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {currentImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-primary ring-2 ring-primary-50'
                      : 'border-line hover:border-primary/50'
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} thumb ${idx}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Info Lengkap & Tombol Aksi (7 kolom) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Badge Atas: Kampus, Kondisi, Kategori */}
          <div className="flex flex-wrap items-center gap-2">
            <CampusBadge shortName={product.campus_short_name} cityName={product.campus_city} />
            <ConditionBadge condition={product.condition} />
            <span className="text-xs text-ink-soft bg-surface-alt px-2.5 py-0.5 rounded-[10px] font-medium">
              {product.category_name}
            </span>
          </div>

          {/* Judul Produk */}
          <h1 className="text-xl md:text-3xl font-extrabold text-ink tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Rating & Sisa Stok */}
          <div className="flex items-center gap-3 text-xs md:text-sm text-ink-soft pb-4 border-b border-line">
            <div className="flex items-center gap-1 font-bold text-ink">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span>
                {product.avg_rating && Number(product.avg_rating) > 0
                  ? Number(product.avg_rating).toFixed(1)
                  : 'Baru'}
              </span>
              <span className="text-ink-soft font-normal">
                ({product.review_count || 0} ulasan)
              </span>
            </div>
            <span>·</span>
            <div>
              {isSoldOut ? (
                <span className="text-danger font-bold">Stok Habis</span>
              ) : (
                <span>
                  Tersisa <strong className="text-ink">{product.stock}</strong> stok barang
                </span>
              )}
            </div>
          </div>

          {/* Harga & Price Pill Besar */}
          <div className="flex flex-wrap items-center gap-3">
            <PricePill amount={product.price} size="lg" />

            {discountPercent > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm text-ink-soft line-through">
                  {formatRupiah(product.original_price)}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-danger-50 text-danger">
                  Hemat {discountPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Kartu Informasi Lapak / Toko */}
          <div className="p-4 rounded-card bg-surface border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary font-bold text-base flex items-center justify-center shrink-0 uppercase">
                {product.store_name ? product.store_name.charAt(0) : 'T'}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-ink text-sm md:text-base">
                  <span>{product.store_name}</span>
                  <ShieldCheck className="w-4 h-4 text-pine shrink-0" title="Penjual Terverifikasi" />
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-soft mt-0.5">
                  <span className="text-pine font-medium flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{product.campus_name}</span>
                  </span>
                </div>
                {product.store_location && (
                  <div className="flex items-center gap-1 text-[11px] text-ink-soft mt-0.5">
                    <MapPin className="w-3 h-3 text-ink-soft" />
                    <span>Area: {product.store_location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canChat && (
                <Link
                  href={
                    user
                      ? `/chat?store_id=${product.store_id}&product_id=${product.id}`
                      : `/login?next=${encodeURIComponent(`/products/${product.id}`)}`
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-50/60 text-primary hover:bg-primary hover:text-white px-4 py-2 text-xs font-semibold transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Chat Penjual</span>
                </Link>
              )}

              <Button href={`/stores/${product.store_id}`} variant="secondary" size="sm" pill>
                Kunjungi Toko
              </Button>
            </div>
          </div>

          {/* Deskripsi Barang */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Deskripsi Barang
            </h3>
            <div className="text-xs md:text-sm text-ink-soft leading-relaxed whitespace-pre-line bg-canvas p-4 rounded-card border border-line/70">
              {product.description}
            </div>
          </div>

          {/* Aksi Tambah ke Keranjang */}
          <div className="p-5 rounded-card bg-primary-50/40 border border-primary/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-2">
            {/* Pemilih Jumlah */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xs font-semibold text-ink">Jumlah:</span>
              <div className="flex items-center bg-canvas rounded-full border border-line p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isSoldOut}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-surface disabled:opacity-40"
                  aria-label="Kurangi"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-xs md:text-sm text-ink">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock || isSoldOut}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-surface disabled:opacity-40"
                  aria-label="Tambah"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tombol Utama */}
            <div className="flex items-center gap-2.5 flex-1">
              <Button
                variant="primary"
                size="lg"
                pill
                onClick={handleAddToCart}
                disabled={isSoldOut}
                loading={addingToCart}
                icon={ShoppingBag}
                className="flex-1"
              >
                {isSoldOut ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Ulasan Pembeli */}
      <section className="bg-canvas border border-line rounded-card p-6 md:p-8 shadow-card flex flex-col gap-6 mt-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Ulasan & Penilaian Pembeli</h2>
            <p className="text-xs text-ink-soft">
              Pengalaman sesama mahasiswa saat membeli barang ini.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-accent font-extrabold text-lg">
            <Star className="w-5 h-5 fill-accent text-accent" />
            <span className="text-ink">
              {product.avg_rating && Number(product.avg_rating) > 0
                ? Number(product.avg_rating).toFixed(1)
                : '0.0'}
            </span>
            <span className="text-xs text-ink-soft font-normal">/ 5.0</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-soft">
            <MessageSquare className="w-8 h-8 text-ink-soft/40 mx-auto mb-2" />
            <p>Belum ada ulasan untuk barang ini.</p>
            <p className="text-[11px] text-ink-soft/80 mt-0.5">
              Jadilah yang pertama membeli dan memberikan ulasan!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line/60">
            {reviews.map((rv) => (
              <div key={rv.id} className="py-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-50 text-primary font-bold text-xs flex items-center justify-center uppercase">
                      {rv.buyer_name ? rv.buyer_name.charAt(0) : 'M'}
                    </div>
                    <span className="font-bold text-xs md:text-sm text-ink">{rv.buyer_name}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rv.rating
                            ? 'text-accent fill-accent'
                            : 'text-line fill-line'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-ink-soft leading-relaxed pl-9">
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
