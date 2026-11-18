'use client';

import { useEffect, useSyncExternalStore } from 'react';

const subscribe = (callback) => {
  if (typeof window === 'undefined') return () => {};
  try {
    window.addEventListener('storage', callback);
    window.addEventListener('lepasin_comfort_mode', callback);
  } catch {
    // Abaikan jika event listener dibatasi browser
  }
  return () => {
    try {
      window.removeEventListener('storage', callback);
      window.removeEventListener('lepasin_comfort_mode', callback);
    } catch {
      // Abaikan
    }
  };
};

const getSnapshot = () => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('lepasin_comfort_mode') === 'true';
  } catch {
    return false;
  }
};

const getServerSnapshot = () => false;

export default function AccessibilityControl() {
  const isComfortMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const root = document.documentElement;
    if (isComfortMode) {
      root.classList.add('text-size-lg', 'high-contrast');
    } else {
      root.classList.remove('text-size-lg', 'high-contrast');
    }
  }, [isComfortMode]);

  const handleToggle = () => {
    try {
      const nextState = !isComfortMode;
      localStorage.setItem('lepasin_comfort_mode', String(nextState));
      window.dispatchEvent(new Event('lepasin_comfort_mode'));
    } catch {
      // Abaikan jika storage disabled
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={
        isComfortMode
          ? 'Kembalikan ke ukuran teks standar'
          : 'Aktifkan teks besar agar lebih nyaman dibaca'
      }
      title={
        isComfortMode
          ? 'Mode Nyaman Aktif (Klik untuk ukuran normal)'
          : 'Perbesar Teks & Pertajam Tampilan'
      }
      className={`h-9 sm:h-10 w-9 sm:w-auto sm:px-3 justify-center rounded-full border text-xs font-bold transition flex items-center gap-0.5 sm:gap-1.5 cursor-pointer shrink-0 ${
        isComfortMode
          ? 'bg-primary text-white border-primary shadow-xs'
          : 'bg-surface text-ink border-line hover:bg-surface-alt'
      }`}
    >
      <span className="font-display font-bold text-sm leading-none">A</span>
      <span className="font-sans text-xs leading-none">A</span>
      <span className="hidden lg:inline font-sans font-semibold text-xs">
        {isComfortMode ? 'Teks Besar' : 'Perbesar'}
      </span>
    </button>
  );
}
