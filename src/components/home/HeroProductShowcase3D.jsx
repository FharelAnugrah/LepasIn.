'use client';

import { useState, useRef, useEffect, useId } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  GraduationCap,
  ShieldCheck,
  Tag,
  Handshake,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { formatRupiah } from '@/components/ui/Badge';

/**
 * Produk Mahasiswa default berkualitas tinggi sebagai fallback
 * jika database belum terisi produk atau saat offline/koneksi dingin.
 */
const FALLBACK_SHOWCASE_PRODUCTS = [
  {
    id: 1,
    name: 'Kipas Angin Meja Mini Portabel Kost',
    price: 45000,
    original_price: 95000,
    category_name: 'Elektronik Kost',
    condition: 'like_new',
    condition_label: 'Mulus 95%',
    negotiable_label: 'Nego Santai',
    savings_percent: 52,
    store_name: 'Lapak Kost Tamalanrea',
    campus_short_name: 'UNHAS',
    campus_city: 'Makassar',
    image_url: null,
  },
  {
    id: 2,
    name: 'Kalkulator Scientific Casio fx-991EX ClassWiz',
    price: 120000,
    original_price: 290000,
    category_name: 'Buku & Alat Kuliah',
    condition: 'like_new',
    condition_label: 'Seperti Baru',
    negotiable_label: 'Nego Tipis',
    savings_percent: 58,
    store_name: 'Gudang Mahasiswa Teknik',
    campus_short_name: 'ITB',
    campus_city: 'Bandung',
    image_url: null,
  },
  {
    id: 3,
    name: 'Rak Sepatu Susun 4 Tingkat Baja Ringan',
    price: 35000,
    original_price: 85000,
    category_name: 'Perabot Kost',
    condition: 'good',
    condition_label: 'Mulus 90%',
    negotiable_label: 'Nego Santai',
    savings_percent: 59,
    store_name: 'Preloved Kost Pogung',
    campus_short_name: 'UGM',
    campus_city: 'Yogyakarta',
    image_url: null,
  },
];

function cleanTitle(rawName) {
  if (!rawName) return 'Barang Preloved Mahasiswa';
  const cleaned = rawName.replace(/<[^>]*>/g, '').trim();
  return cleaned || 'Barang Preloved Mahasiswa';
}

export default function HeroProductShowcase3D({ initialProducts = [] }) {
  // Gabungkan produk nyata dari database dengan fallback jika data sedikit
  const displayProducts =
    Array.isArray(initialProducts) && initialProducts.length > 0
      ? initialProducts.slice(0, 4).map((p, idx) => ({
          id: p.id,
          name: cleanTitle(p.name),
          price: Number(p.price) || 50000,
          original_price:
            Number(p.original_price) || Math.round((Number(p.price) || 50000) * 1.85),
          category_name: p.category_name || 'Preloved Kampus',
          condition: p.condition || 'good',
          condition_label:
            p.condition === 'like_new'
              ? 'Mulus 95%'
              : p.condition === 'good'
              ? 'Kondisi Prima'
              : 'Layak Pakai',
          negotiable_label: idx % 2 === 0 ? 'Nego Santai' : 'Siap COD',
          savings_percent: Math.min(
            75,
            Math.max(
              25,
              Math.round(
                (1 -
                  (Number(p.price) || 50000) /
                    (Number(p.original_price) || (Number(p.price) || 50000) * 1.85)) *
                  100
              )
            )
          ),
          store_name: p.store_name || 'Lapak Mahasiswa',
          campus_short_name: p.campus_short_name || 'Kampus',
          campus_city: p.campus_city || 'Indonesia',
          image_url: p.image_url || null,
        }))
      : FALLBACK_SHOWCASE_PRODUCTS;

  const [activeIndex, setActiveIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef(null);

  const activeProduct = displayProducts[activeIndex] || displayProducts[0];
  const nextProduct =
    displayProducts[(activeIndex + 1) % displayProducts.length] || displayProducts[0];
  const prevProduct =
    displayProducts[(activeIndex - 1 + displayProducts.length) % displayProducts.length] ||
    displayProducts[0];

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgError(false);
    setActiveIndex((prev) => (prev + 1) % displayProducts.length);
  };

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImgError(false);
    setActiveIndex((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
  };

  return (
    <div className="relative w-full max-w-md mx-auto perspective-stage py-3 select-none">
      {/* ==============================================================
          1. KARTU DASAR TERTUMPUK 2 (Lapisan Paling Belakang - Rotasi Negatif)
          ============================================================== */}
      <div
        aria-hidden="true"
        className="hidden sm:block absolute inset-x-2 inset-y-1 rounded-3xl bg-navy-900/60 border border-white/10 -rotate-3 translate-x-3 translate-y-3 scale-95 pointer-events-none transition-transform duration-500 shadow-2xl"
      >
        <div className="h-full w-full rounded-3xl p-5 flex flex-col justify-between opacity-30">
          <div className="flex justify-between items-center text-xs text-white/50">
            <span>{prevProduct.category_name}</span>
            <span className="font-bold text-campus-gold">Preloved Kampus</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white/70 truncate">{prevProduct.name}</span>
          </div>
        </div>
      </div>

      {/* ==============================================================
          2. KARTU TERTUMPUK 1 (Lapisan Tengah - Rotasi Positif Mengintip)
          ============================================================== */}
      <div
        aria-hidden="true"
        className="hidden sm:block absolute inset-x-1 inset-y-1 rounded-3xl bg-gradient-to-br from-[#123055]/85 to-[#0E2440]/90 border border-campus-gold/20 rotate-2 translate-x-2 translate-y-2 pointer-events-none transition-transform duration-500 shadow-xl"
      >
        <div className="h-full w-full rounded-3xl p-4 sm:p-5 flex flex-col justify-between opacity-60">
          <div className="flex justify-between items-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-campus-gold bg-campus-gold/15 px-2 py-0.5 rounded-full border border-campus-gold/30">
              {nextProduct.condition_label}
            </span>
            <span className="text-xs font-extrabold text-white/80 tabular-nums">
              {formatRupiah(nextProduct.price)}
            </span>
          </div>
        </div>
      </div>

      {/* ==============================================================
          3. KARTU UTAMA FOREGROUND 3D (Tumpukan Depan Melayang Responsif)
          ============================================================== */}
      <div
        ref={cardRef}
        data-tilt-3d="hero"
        className="tilt-3d relative rounded-3xl p-4 sm:p-5 text-white transition-all duration-300 backdrop-blur-md"
        style={{
          background:
            'linear-gradient(155deg, rgba(14, 38, 68, 0.94) 0%, rgba(10, 27, 49, 0.96) 55%, rgba(6, 18, 33, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow:
            'inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 -1px 0 rgba(0, 0, 0, 0.4), 0 12px 0 #051324, 0 28px 48px -12px rgba(4, 12, 23, 0.65)',
        }}
      >
        {/* Kilatan Refleksi Cahaya Siang & Aurora Mengikuti Kursor */}
        <div className="tilt-glare-dark" aria-hidden="true" />

        {/* -------------------------------------------------------------
            Header Kartu: Asal Kampus Penjual + Verifikasi KTM Mahasiswa
            ------------------------------------------------------------- */}
        <div className="depth-layer-1 flex items-center justify-between gap-2.5 pb-3 border-b border-white/12">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl icon-plinth-gold text-ink flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-300">
                Penjual Mahasiswa
              </p>
              <p className="text-xs font-bold text-white truncate leading-tight">
                {activeProduct.store_name} •{' '}
                <span className="text-campus-gold">{activeProduct.campus_short_name}</span>
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-emerald-400 text-slate-950 shadow-[0_2px_0_#059669] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" aria-hidden="true" />
            KTM Terverifikasi
          </span>
        </div>

        {/* -------------------------------------------------------------
            Bodi Kartu: Visual Produk 3D + Floating Badge Kondisi & Nego
            ------------------------------------------------------------- */}
        <div className="depth-layer-2 relative my-3 rounded-2xl overflow-hidden border border-white/14 bg-gradient-to-b from-[#13325B]/70 to-[#0A1D36]/80 p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
          {/* Baris Badge Kondisi: Mulus 95%, Nego Santai, COD Kampus */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Badge Kondisi Barang (Mulus 95%) */}
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-[0_1.5px_0_rgba(16,185,129,0.25)]">
              <Sparkles className="w-3 h-3 text-emerald-300 shrink-0" aria-hidden="true" />
              <span>{activeProduct.condition_label}</span>
            </span>

            {/* Badge Nego Santai */}
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-campus-gold/25 text-campus-gold border border-campus-gold/40 shadow-[0_1.5px_0_rgba(251,191,36,0.25)]">
              <Tag className="w-3 h-3 text-campus-gold shrink-0" aria-hidden="true" />
              <span>{activeProduct.negotiable_label}</span>
            </span>

            {/* Badge COD Kampus Langsung */}
            <span className="hidden xs:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-white/10 text-slate-200 border border-white/15">
              <Handshake className="w-3 h-3 text-slate-300 shrink-0" aria-hidden="true" />
              <span>COD Kampus</span>
            </span>
          </div>

          {/* Area Foto / Ilustrasi Produk Kampus */}
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#07172C]/80 border border-white/10 flex items-center justify-center group">
            {!imgError && activeProduct.image_url ? (
              <Image
                src={activeProduct.image_url}
                alt={activeProduct.name}
                fill
                unoptimized
                onError={() => setImgError(true)}
                sizes="(max-width: 640px) 90vw, 420px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-campus-gold mb-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <Package className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold text-slate-300">
                  {activeProduct.category_name}
                </span>
                <span className="text-[11px] text-slate-400">Siap serah terima langsung di kampus</span>
              </div>
            )}

            {/* Watermark Tag Kategori Melayang */}
            <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-navy-900/85 backdrop-blur-md border border-white/15 text-[10px] font-bold text-slate-200">
              {activeProduct.category_name}
            </div>
          </div>

          {/* Judul Barang Preloved */}
          <Link
            href={`/products/${activeProduct.id}`}
            className="group/link flex items-start justify-between gap-2 pt-0.5 text-left"
          >
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-2 group-hover/link:text-campus-gold transition-colors">
              {activeProduct.name}
            </h3>
            <ArrowUpRight
              className="w-4 h-4 text-slate-400 group-hover/link:text-campus-gold shrink-0 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* -------------------------------------------------------------
            Footer Kartu: Label Harga Hemat Mahasiswa + Aksi & Navigasi
            ------------------------------------------------------------- */}
        <div className="depth-layer-3 flex flex-wrap items-end justify-between gap-2.5 pt-1">
          {/* Label Harga Hemat Mahasiswa (3D Price Pill & Strikethrough) */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>Harga Hemat Mahasiswa</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-campus-gold tabular-nums tracking-tight leading-none drop-shadow-[0_2px_0_rgba(7,23,44,0.6)]">
                {formatRupiah(activeProduct.price)}
              </span>
              {activeProduct.original_price > activeProduct.price && (
                <span className="text-xs font-semibold text-slate-400 line-through tabular-nums">
                  {formatRupiah(activeProduct.original_price)}
                </span>
              )}
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                -{activeProduct.savings_percent}%
              </span>
            </div>
          </div>

          {/* Tombol Aksi Cek Barang + Switcher Produk */}
          <div className="flex items-center gap-1.5 self-center sm:self-end">
            <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/15">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Produk sebelumnya"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="text-[11px] font-bold tabular-nums text-slate-300 px-1.5">
                {activeIndex + 1}/{displayProducts.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Produk berikutnya"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-colors"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <Link
              href={`/products/${activeProduct.id}`}
              className="btn-3d btn-3d-accent text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1 shadow-md"
            >
              <span>Cek Barang</span>
            </Link>
          </div>
        </div>

        {/* Catatan Jaminan Keamanan Kampus */}
        <div className="depth-layer-1 mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-campus-gold shrink-0" aria-hidden="true" />
          <span className="truncate">
            Cek langsung fisik barang saat COD di area publik kampus ({activeProduct.campus_city}).
          </span>
        </div>
      </div>
    </div>
  );
}
