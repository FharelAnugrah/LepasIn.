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

}
