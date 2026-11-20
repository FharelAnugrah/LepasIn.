'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Laptop, BedDouble, BookOpen, Cpu, Sparkles } from 'lucide-react';

/**
 * HeroShowcaseBadges
 * Showcase 3D melayang interaktif untuk kategori barang preloved mahasiswa.
 * Menampilkan:
 * 1. Luminous backdrop glowing disc.
 * 2. Cincin orbit konsentris.
 * 3. 4 Badge kategori barang mahasiswa (Laptop, Perabot, Buku, Elektronik) dengan efek Glass 3D.
 * 4. Starburst badge aksen emas "Hemat s/d 70%".
 * 5. Interaksi 3D tilt responsif terhadap pergerakan kursor mouse.
 */
export default function HeroShowcaseBadges() {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    if (prefersReducedMotion.matches || !finePointer.matches) return;

    const heroSection = el.closest('section') || el.parentElement;
    if (!heroSection) return;

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isTracking = false;

    const handlePointerMove = (e) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      targetX = Math.max(-1, Math.min(1, normX));
      targetY = Math.max(-1, Math.min(1, normY));

      if (!isTracking) {
        isTracking = true;
        animate();
      }
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      setTilt({
        x: parseFloat((currentY * -12).toFixed(2)),
        y: parseFloat((currentX * 14).toFixed(2)),
      });

      if (
        Math.abs(targetX - currentX) < 0.005 &&
        Math.abs(targetY - currentY) < 0.005 &&
        targetX === 0 &&
        targetY === 0
      ) {
        isTracking = false;
        setTilt({ x: 0, y: 0 });
        return;
      }

      rafId = requestAnimationFrame(animate);
    };

    heroSection.addEventListener('pointermove', handlePointerMove, { passive: true });
    heroSection.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      heroSection.removeEventListener('pointermove', handlePointerMove);
      heroSection.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[340px] sm:max-w-[380px] h-[280px] sm:h-[300px] flex items-center justify-center select-none"
      style={{ perspective: '1000px' }}
      aria-label="Showcase kategori barang preloved mahasiswa"
    >
      {/* Container Berputar Sesuai Tilt Kursor */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Luminous Backdrop Disc: Lingkaran cahaya glowing bulat */}
        <div
          className="w-56 h-56 rounded-full bg-gradient-to-tr from-campus-gold/30 via-blue-500/20 to-teal-400/20 blur-2xl absolute pointer-events-none"
          aria-hidden="true"
        />

        {/* Cincin Orbit Halus */}
        <div
          className="w-60 h-60 rounded-full border border-white/10 absolute pointer-events-none"
          aria-hidden="true"
        />

        {/* Starburst Badge Aksen Emas (Melayang di Sudut Atas Kanan) */}
        <div className="hero-starburst-pulse absolute -top-1.5 right-1 sm:right-3 z-30 pointer-events-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-campus-gold text-ink font-black text-xs shadow-[0_4px_0_#B37903] border border-amber-300/80 rotate-6 select-none">
            <Sparkles className="w-3.5 h-3.5 fill-ink/20" aria-hidden="true" />
            <span>Hemat s/d 70%</span>
          </span>
        </div>

        {/* Badge Tengah Atas: 💻 Laptop & Gadget Kuliah */}
        <Link
          href="/products?search=laptop"
          className="hero-showcase-badge-1 absolute top-3.5 left-1/2 -translate-x-1/2 z-20 group block"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateX(-50%) translateZ(28px)',
          }}
          title="Lihat Laptop & Gadget"
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.14] hover:bg-white/[0.22] backdrop-blur-md border border-white/25 hover:border-campus-gold/60 shadow-[0_8px_24px_-6px_rgba(4,13,26,0.6),inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_rgba(6,18,34,0.55)] transition-all duration-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400/30 to-navy-900/50 border border-blue-300/40 flex items-center justify-center text-blue-200 shadow-inner group-hover:scale-105 transition-transform">
              <Laptop className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-campus-gold transition-colors tracking-tight">
                Laptop & Gadget
              </span>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-[10px] font-extrabold text-emerald-300 tracking-wide">
              Mulus
            </span>
          </div>
        </Link>

        {/* Badge Kiri: 🛏️ Kasur & Perabot Kost */}
        <Link
          href="/products?search=kasur"
          className="hero-showcase-badge-2 absolute top-[94px] left-1 sm:left-3 z-10 group block"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(18px)',
          }}
          title="Lihat Perabot Kost"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.13] hover:bg-white/[0.22] backdrop-blur-md border border-white/20 hover:border-campus-gold/60 shadow-[0_8px_22px_-6px_rgba(4,13,26,0.55),inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_rgba(6,18,34,0.5)] transition-all duration-200">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400/25 to-navy-900/50 border border-amber-300/40 flex items-center justify-center text-amber-200 shadow-inner group-hover:scale-105 transition-transform">
              <BedDouble className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-slate-100 group-hover:text-campus-gold transition-colors">
              Perabot Kost
            </span>
          </div>
        </Link>

        {/* Badge Kanan: 📚 Buku & Diktat */}
        <Link
          href="/products?search=buku"
          className="hero-showcase-badge-3 absolute top-[98px] right-1 sm:right-3 z-10 group block"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(22px)',
          }}
          title="Lihat Buku Kuliah"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.13] hover:bg-white/[0.22] backdrop-blur-md border border-white/20 hover:border-campus-gold/60 shadow-[0_8px_22px_-6px_rgba(4,13,26,0.55),inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_rgba(6,18,34,0.5)] transition-all duration-200">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-400/25 to-navy-900/50 border border-indigo-300/40 flex items-center justify-center text-indigo-200 shadow-inner group-hover:scale-105 transition-transform">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-slate-100 group-hover:text-campus-gold transition-colors">
              Buku Kuliah
            </span>
          </div>
        </Link>

        {/* Badge Bawah: ⚡ Kipas & Elektronik */}
        <Link
          href="/products?search=elektronik"
          className="hero-showcase-badge-4 absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 group block"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateX(-50%) translateZ(16px)',
          }}
          title="Lihat Elektronik Kost"
        >
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/[0.13] hover:bg-white/[0.22] backdrop-blur-md border border-white/20 hover:border-campus-gold/60 shadow-[0_8px_22px_-6px_rgba(4,13,26,0.55),inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_rgba(6,18,34,0.5)] transition-all duration-200">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400/25 to-navy-900/50 border border-cyan-300/40 flex items-center justify-center text-cyan-200 shadow-inner group-hover:scale-105 transition-transform">
              <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-slate-100 group-hover:text-campus-gold transition-colors">
              Elektronik Kost
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
