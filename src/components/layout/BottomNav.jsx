'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Heart, User, ShoppingBag } from 'lucide-react';
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

  // Tentukan rute tab berdasarkan role
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
    return '/buyer/profile';
  };

  const getWishlistLink = () => {
    if (!user) return '/login?next=/buyer/wishlist';
    if (user.role === 'buyer') return '/buyer/wishlist';
    return '/';
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
      label: 'Profil',
      href: getProfileLink(),
      icon: User,
      isActive:
        pathname.startsWith('/buyer/profile') ||
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
      {/* Ruang cadangan di alur dokumen agar konten bawah tidak tertutup BottomNav / Floating Cart di ponsel */}
      <div
        className={`md:hidden shrink-0 ${
          showFloatingCart
            ? 'h-[calc(8rem+env(safe-area-inset-bottom))]'
            : 'h-[calc(4.5rem+env(safe-area-inset-bottom))]'
        }`}
        aria-hidden="true"
      />

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        {/* Floating Cart Bar (Melayang Tepat di Atas Bottom Nav) */}
        {showFloatingCart && (
          <div className="px-3 sm:px-4 pb-2 animate-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
            <Link
              href="/buyer/cart"
              className="flex items-center justify-between gap-2 bg-primary text-white rounded-full shadow-float px-4 sm:px-5 py-2.5 sm:py-3 hover:bg-primary-hover transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="font-display text-xs sm:text-sm font-bold truncate">Lihat Keranjang</span>
                <span className="bg-white text-primary font-display text-[11px] sm:text-xs font-bold tabular-nums px-2 py-0.5 rounded-full shrink-0">
                  {cartCount}x
                </span>
              </div>
              <div className="font-display text-xs sm:text-sm font-bold tabular-nums tracking-tight shrink-0">
                {formatRupiah(cartTotal)}
              </div>
            </Link>
          </div>
        )}

        {/* 4 Tab Bottom Navigation */}
        <nav className="bg-canvas/95 backdrop-blur-md border-t border-line px-1.5 sm:px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-float pointer-events-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex-1 min-w-0 min-h-[44px] flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 rounded-xl transition-all duration-150 ${
                  tab.isActive
                    ? 'text-primary font-bold'
                    : 'text-ink-soft hover:text-ink font-medium'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 transition-transform ${
                    tab.isActive ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'
                  }`}
                />
                <span className="text-[11px] leading-tight tracking-tight truncate max-w-full">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
