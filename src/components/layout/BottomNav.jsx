'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Heart, User, ShoppingCart } from 'lucide-react';
import { formatRupiah } from '@/components/ui/Badge';

export default function BottomNav({
  user = null,
  cartCount: initialCartCount = 0,
  cartTotal: initialCartTotal = 0,
}) {
  const pathname = usePathname();

  const [cartCount, setCartCount] = useState(initialCartCount);
  const [cartTotal, setCartTotal] = useState(initialCartTotal);
  const [prevInitialCartCount, setPrevInitialCartCount] = useState(initialCartCount);
  const [prevInitialCartTotal, setPrevInitialCartTotal] = useState(initialCartTotal);

  if (initialCartCount !== prevInitialCartCount || initialCartTotal !== prevInitialCartTotal) {
    setPrevInitialCartCount(initialCartCount);
    setPrevInitialCartTotal(initialCartTotal);
    setCartCount(initialCartCount);
    setCartTotal(initialCartTotal);
  }

  useEffect(() => {
    function handleCartUpdated(e) {
      if (e.detail) {
        if (typeof e.detail.cartCount === 'number') {
          setCartCount(e.detail.cartCount);
        }
        if (typeof e.detail.cartTotal === 'number') {
          setCartTotal(e.detail.cartTotal);
        }
      }
    }
    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, []);

  const getOrdersLink = () => {
    if (!user) return '/login?next=/buyer/orders';
    if (user.role === 'seller') return '/seller/orders';
    if (user.role === 'admin') return '/admin';
    return '/buyer/orders';
  };

  const getProfileLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'seller') return user.seller_status === 'approved' ? '/seller' : '/pending-seller';
    return '/buyer';
  };

  const getWishlistLink = () => {
    if (!user) return '/login?next=/buyer/wishlist';
    if (user.role === 'buyer') return '/buyer/wishlist';
    return '/products';
  };

  const tabs = [
    {
      label: 'Beranda',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Pesanan',
      href: getOrdersLink(),
      icon: Package,
      isActive: pathname.startsWith('/buyer/orders') || pathname.startsWith('/seller/orders'),
    },
    {
      label: 'Favorit',
      href: getWishlistLink(),
      icon: Heart,
      isActive: pathname.startsWith('/buyer/wishlist'),
    },
    {
      label: 'Akun',
      href: getProfileLink(),
      icon: User,
      isActive:
        pathname === '/buyer' ||
        pathname.startsWith('/buyer/profile') ||
        pathname.startsWith('/buyer/addresses') ||
        pathname.startsWith('/seller') ||
        pathname.startsWith('/admin') ||
        pathname === '/pending-seller' ||
        pathname === '/login',
    },
  ];

  const showFloatingCart =
    cartCount > 0 &&
    (!user || user.role === 'buyer') &&
    pathname !== '/buyer/cart' &&
    pathname !== '/buyer/checkout';

  return (
    <>
      {/* Ruang cadangan di alur dokumen agar konten bawah tidak tertutup BottomNav / Floating Cart Bar */}
      <div
        className={`md:hidden shrink-0 ${
          showFloatingCart
            ? 'h-[calc(8.75rem+env(safe-area-inset-bottom))]'
            : 'h-[calc(4.5rem+env(safe-area-inset-bottom))]'
        }`}
        aria-hidden="true"
      />
      {/* Floating Cart Bar 3D (Khusus Mobile: Mengambang di atas BottomNav, Tersembunyi di Desktop/Laptop) */}
      {showFloatingCart && (
        <div
          role="region"
          aria-label="Ringkasan keranjang belanja"
          className="block md:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-3 sm:inset-x-4 max-w-3xl mx-auto z-40"
        >
          <div className="plinth-navy-3d text-white rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl icon-plinth-gold text-ink flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-300 tabular-nums">
                  <strong className="text-white font-semibold">{cartCount} barang</strong> di keranjang
                </p>
                <p className="text-sm sm:text-base font-bold text-white tabular-nums tracking-tight truncate">
                  {formatRupiah(cartTotal)}
                </p>
              </div>
            </div>

            <Link
              href="/buyer/cart"
              className="btn-3d btn-3d-accent inline-flex items-center justify-center min-h-[44px] md:min-h-[40px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shrink-0"
            >
              Lihat Keranjang
            </Link>
          </div>
        </div>
      )}

      {/* 4 Tab Bottom Navigation Mobile */}
      <nav
        aria-label="Navigasi utama ponsel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 border-t border-border-subtle px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-6px_22px_-8px_rgba(15,41,74,0.14)]"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={tab.isActive ? 'page' : undefined}
              className={`flex-1 min-w-0 min-h-[46px] flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all ${
                tab.isActive
                  ? 'nav-pill-3d-active font-semibold'
                  : 'text-ink-muted hover:text-ink font-medium'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 ${tab.isActive ? 'stroke-[2.25px]' : 'stroke-[1.75px]'}`}
                aria-hidden="true"
              />
              <span className="text-[11px] leading-tight truncate max-w-full">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
