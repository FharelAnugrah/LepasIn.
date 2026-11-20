'use client';

import { useEffect, useRef } from 'react';

/**
 * HeroAnimatedBackground
 * Latar belakang interaktif 3D berperforma tinggi untuk Hero Banner LepasIn.
 * Menggabungkan:
 * 1. Aliran gradien bercahaya multidimensi (Luminous Ambient Wave).
 * 2. Balok cahaya ambient bergerak (Campus Gold & Royal Blue Aurora Beams).
 * 3. Bidang kisi isometrik perspektif 3D yang bergeser dinamis (Isometric Grid Stream).
 * 4. Cincin orbit konsentris 3D yang berputar dengan satelit bercahaya (Constellation Orbit Rings).
 * 5. Partikel debu cahaya (Golden Campus Motes) yang melayang lembut.
 * 6. Responsif terhadap kursor mouse (Multi-depth Parallax 3D), ramah baterai & GPU-accelerated.
 * 7. Menghormati prefers-reduced-motion secara otomatis.
 */
export default function HeroAnimatedBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    if (prefersReducedMotion.matches || !finePointer.matches) return;

    const heroSection = el.closest('section') || el.parentElement;
    if (!heroSection) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;
    let isTracking = false;

    const handlePointerMove = (e) => {
      const rect = heroSection.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Normalisasi koordinat kursor dari -1 hingga +1
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      targetX = Math.max(-1, Math.min(1, x));
      targetY = Math.max(-1, Math.min(1, y));

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
      // Lerp (Linear interpolation) untuk pergerakan halus seperti kamera fisik
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      el.style.setProperty('--hero-px', currentX.toFixed(3));
      el.style.setProperty('--hero-py', currentY.toFixed(3));

      // Hentikan loop jika kursor sudah kembali mendekati 0 dan mouse keluar
      if (
        Math.abs(targetX - currentX) < 0.002 &&
        Math.abs(targetY - currentY) < 0.002 &&
        targetX === 0 &&
        targetY === 0
      ) {
        isTracking = false;
        el.style.setProperty('--hero-px', '0');
        el.style.setProperty('--hero-py', '0');
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
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden rounded-[inherit] z-0"
      style={{
        '--hero-px': '0',
        '--hero-py': '0',
      }}
    >
      {/* 1. Base Multi-Layer Gradient Canvas dengan Animasi Gelombang Cahaya */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#1E4B82_0%,#133763_45%,#0B213D_100%)] opacity-95" />
      <div className="hero-luminous-mesh absolute inset-0 opacity-40 mix-blend-screen" />

      {/* 2. Ambient Aurora Beam 1: Emas Kampus (Bawah-Kiri & Tengah) */}
      <div
        className="hero-aurora-gold absolute -bottom-24 -left-20 w-[420px] h-[420px] rounded-full blur-[72px] pointer-events-none"
        style={{
          transform: `translate3d(calc(var(--hero-px) * -22px), calc(var(--hero-py) * -18px), 0)`,
        }}
      />

      {/* 3. Ambient Aurora Beam 2: Royal Campus Blue (Atas-Kanan) */}
      <div
        className="hero-aurora-blue absolute -top-28 right-0 sm:right-10 w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none"
        style={{
          transform: `translate3d(calc(var(--hero-px) * 28px), calc(var(--hero-py) * 24px), 0)`,
        }}
      />

      {/* 4. Ambient Cyan Accent Beam (Tengah Bergerak Halus) */}
      <div
        className="hero-aurora-cyan absolute top-1/4 left-1/3 w-[340px] h-[340px] rounded-full blur-[86px] pointer-events-none"
        style={{
          transform: `translate3d(calc(var(--hero-px) * -14px), calc(var(--hero-py) * 14px), 0)`,
        }}
      />

      {/* 5. Bidang Perspektif Isometrik Bergerak (Isometric Blueprint Grid Stream) */}
      <div
        className="hero-grid-stream absolute -inset-x-10 -bottom-16 h-64 opacity-20 pointer-events-none"
        style={{
          transform: `perspective(600px) rotateX(62deg) translate3d(calc(var(--hero-px) * 12px), calc(var(--hero-py) * 10px), 0)`,
        }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hero-campus-grid"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 44 0 L 0 0 0 44"
                fill="none"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="1.5" fill="#FBBF24" opacity="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-campus-grid)" />
        </svg>
      </div>

      {/* 6. Cincin Orbit Konsentris 3D Berputar (Constellation Orbit Rings) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -right-16 sm:right-2 md:right-8 lg:right-12 w-[360px] sm:w-[420px] lg:w-[450px] h-[360px] sm:h-[420px] lg:h-[450px] pointer-events-none"
        style={{
          transform: `translate3d(calc(var(--hero-px) * 22px), calc(var(--hero-py) * 18px - 50%), 0)`,
        }}
      >
        {/* Ring Luar Berputar Searah Jarum Jam */}
        <div className="hero-orbit-outer absolute inset-0 rounded-full border border-white/20 border-dashed">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-campus-gold shadow-[0_0_14px_#FBBF24]" />
        </div>

        {/* Ring Tengah Berputar Berlawanan Arah */}
        <div className="hero-orbit-inner absolute inset-8 rounded-full border border-campus-gold/25 border-dotted">
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_#FFFFFF]" />
        </div>

        {/* Ring Inti Berdenyut Halus + Aksen Kampus Emas Melayang di Pusat Orbit */}
        <div className="hero-orbit-core absolute inset-24 sm:inset-28 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-[2px] flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-campus-gold/20 border border-campus-gold/40 text-campus-gold flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.35)]">
            <svg
              className="w-6 h-6 stroke-[1.75]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M22 10v6" />
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* 7. Elemen Isometrik Melayang & Partikel Debu Emas Kampus */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate3d(calc(var(--hero-px) * -30px), calc(var(--hero-py) * -26px), 0)`,
        }}
      >
        {/* Sparkle Emas 1 (Kiri Atas) */}
        <span
          className="hero-sparkle hero-sparkle-1 absolute top-8 left-[18%] text-campus-gold text-lg select-none opacity-70"
          style={{ textShadow: '0 0 10px rgba(251, 191, 36, 0.8)' }}
        >
          ✦
        </span>

        {/* Sparkle Emas 2 (Tengah Atas) */}
        <span
          className="hero-sparkle hero-sparkle-2 absolute top-16 left-[54%] text-campus-gold text-xs select-none opacity-60"
          style={{ textShadow: '0 0 8px rgba(251, 191, 36, 0.7)' }}
        >
          ✦
        </span>

        {/* Sparkle Putih 3 (Kanan Bawah) */}
        <span
          className="hero-sparkle hero-sparkle-3 absolute bottom-12 right-[32%] text-white text-sm select-none opacity-50"
          style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.8)' }}
        >
          ✦
        </span>

        {/* Partikel Mote Melayang 1 */}
        <div className="hero-mote hero-mote-1 absolute bottom-6 left-[12%] w-2 h-2 rounded-full bg-campus-gold/80 blur-[0.5px]" />
        {/* Partikel Mote Melayang 2 */}
        <div className="hero-mote hero-mote-2 absolute bottom-20 left-[38%] w-1.5 h-1.5 rounded-full bg-white/70 blur-[0.5px]" />
        {/* Partikel Mote Melayang 3 */}
        <div className="hero-mote hero-mote-3 absolute top-1/2 right-[20%] w-2 h-2 rounded-full bg-campus-gold/70 blur-[0.5px]" />
      </div>

      {/* 8. Garis Gelombang Arsitektur Kampus yang Bergerak di Bagian Bawah */}
      <div className="absolute inset-x-0 bottom-0 h-20 opacity-20 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="hero-wave-drift w-[200%] h-full"
        >
          <path
            d="M 0,60 C 150,90 350,30 500,60 C 650,90 850,30 1000,60 C 1150,90 1350,30 1500,60 C 1650,90 1850,30 2000,60 C 2150,90 2350,30 2400,60 L 2400,120 L 0,120 Z"
            fill="rgba(255, 255, 255, 0.12)"
          />
        </svg>
      </div>

      {/* 9. Top-Light Edge Bevel Luminous Sheen */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
    </div>
  );
}
