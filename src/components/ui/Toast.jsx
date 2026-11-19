'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  useEffect(() => {
    const handleWheel = () => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Penggerak perspektif 3D ringan (tanpa re-render React, menghormati prefers-reduced-motion)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reducedMotion.matches) return;

    let activeEl = null;
    let rafId = 0;

    const resetEl = (el) => {
      if (!el) return;
      el.removeAttribute('data-tilting');
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--tilt-lift', '0px');
      el.style.setProperty('--glare-opacity', '0');
    };

    const getIntensity = (mode) => {
      if (mode === 'hero') return { maxDeg: 4.5, lift: -3 };
      if (mode === 'stage') return { maxDeg: 4, lift: -2 };
      if (mode === 'kpi') return { maxDeg: 5.5, lift: -4 };
      return { maxDeg: 6.5, lift: -5 };
    };

    const handlePointerMove = (e) => {
      const target = e.target instanceof Element ? e.target.closest('[data-tilt-3d]') : null;

      if (activeEl && activeEl !== target) {
        resetEl(activeEl);
        activeEl = null;
      }

      if (!target) return;
      activeEl = target;

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!activeEl) return;
        const rect = activeEl.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const px = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const py = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        const { maxDeg, lift } = getIntensity(activeEl.getAttribute('data-tilt-3d'));

        const rotateX = ((0.5 - py) * 2 * maxDeg).toFixed(2);
        const rotateY = ((px - 0.5) * 2 * maxDeg).toFixed(2);

        activeEl.setAttribute('data-tilting', 'true');
        activeEl.style.setProperty('--tilt-x', `${rotateX}deg`);
        activeEl.style.setProperty('--tilt-y', `${rotateY}deg`);
        activeEl.style.setProperty('--tilt-lift', `${lift}px`);
        activeEl.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
        activeEl.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
        activeEl.style.setProperty('--glare-opacity', '1');
      });
    };

    const handlePointerReset = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (activeEl) {
        resetEl(activeEl);
        activeEl = null;
      }
    };

    const handlePointerDown = () => {
      if (activeEl) {
        activeEl.style.setProperty('--tilt-lift', '-1px');
      }
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerleave', handlePointerReset);
    window.addEventListener('blur', handlePointerReset);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (activeEl) resetEl(activeEl);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerleave', handlePointerReset);
      window.removeEventListener('blur', handlePointerReset);
    };
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifikasi"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-md px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-3 plinth-navy-3d text-white text-sm font-medium px-4 py-3 rounded-xl animate-modal-3d"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {t.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-campus-gold shrink-0" aria-hidden="true" />
              )}
              {t.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-red-300 shrink-0" aria-hidden="true" />
              )}
              {t.type === 'info' && (
                <Info className="w-4 h-4 text-brand-blue-border shrink-0" aria-hidden="true" />
              )}
              <span className="leading-snug">{t.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-white/75 hover:text-white p-1.5 rounded-lg transition-colors shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      info: (msg) => console.log('Toast info:', msg),
    };
  }
  return context;
}
