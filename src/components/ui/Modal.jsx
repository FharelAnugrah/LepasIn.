'use client';

import { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  showClose = true,
}) {
  const modalRef = useRef(null);
  const bodyRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Kunci scroll body dan perangkap fokus keyboard hanya saat status buka/tutup modal berubah (R-32)
  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';

    const modalEl = modalRef.current;
    const bodyEl = bodyRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const formFieldSelector =
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])';

    const timer = setTimeout(() => {
      if (modalEl && !modalEl.contains(document.activeElement)) {
        const firstField = bodyEl?.querySelector(formFieldSelector);
        if (firstField) {
          firstField.focus();
        } else {
          const focusable = modalEl.querySelectorAll(focusableSelector);
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            modalEl.focus();
          }
        }
      }
    }, 20);

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (e.key === 'Tab' && modalEl) {
        const focusable = modalEl.querySelectorAll(focusableSelector);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      if (
        previousFocus &&
        typeof previousFocus.focus === 'function' &&
        document.contains(previousFocus)
      ) {
        previousFocus.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-navy-900/55">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative w-full ${maxWidth} surface-3d animate-modal-3d rounded-t-2xl md:rounded-2xl z-10 max-h-[90dvh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] outline-none`}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between gap-2 px-5 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-border-subtle shrink-0">
            {title ? (
              <h3 id={titleId} className="text-base md:text-lg font-bold text-ink truncate">
                {title}
              </h3>
            ) : (
              <div />
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 md:w-10 md:h-10 -mr-2 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors shrink-0"
                aria-label="Tutup dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        <div ref={bodyRef} className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
