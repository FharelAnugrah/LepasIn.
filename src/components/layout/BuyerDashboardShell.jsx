'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Heart,
  User,
  MapPin,
  MessageCircle,
  LogOut,
  ShoppingBag,
  GraduationCap,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export default function BuyerDashboardShell({
  user,
  cartCount = 0,
  cartTotal = 0,
  children,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Ringkasan Akun',
      href: '/buyer',
      icon: LayoutDashboard,
      isActive: pathname === '/buyer',
    },
    {
      label: 'Pesanan Saya',
      href: '/buyer/orders',
      icon: Package,
      isActive: pathname.startsWith('/buyer/orders'),
    },
    {
      label: 'Barang Favorit',
      href: '/buyer/wishlist',
      icon: Heart,
      isActive: pathname.startsWith('/buyer/wishlist'),
    },
    {
      label: 'Profil & Kampus',
      href: '/buyer/profile',
      icon: User,
      isActive: pathname.startsWith('/buyer/profile'),
    },
    {
      label: 'Alamat Kost',
      href: '/buyer/addresses',
      icon: MapPin,
      isActive: pathname.startsWith('/buyer/addresses'),
    },
    {
      label: 'Chat Penjual',
      href: '/chat',
      icon: MessageCircle,
      isActive: pathname.startsWith('/chat'),
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Navbar user={user} cartCount={cartCount} showSearchBar={true} />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Desktop Left Sidebar (design2.md 5.8) */}
        <aside
          aria-label="Navigasi akun pembeli"
          className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-surface border-r border-border-subtle p-4 justify-between gap-6 sticky-sidebar-flush"
        >
          <div className="flex flex-col gap-5">
            <div className="p-3 rounded-2xl surface-3d flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl icon-plinth-navy text-white font-bold text-sm flex items-center justify-center uppercase shrink-0">
                {user.name ? user.name.charAt(0) : 'B'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">{user.name}</p>
                <p className="text-[11px] text-brand-blue font-semibold truncate flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{user.campus_short_name || 'Akun Pembeli'}</span>
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5">
              <p className="px-3 pb-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Akun Pembeli
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm transition-all ${
                      item.isActive
                        ? 'nav-pill-3d-active font-semibold'
                        : 'text-ink-secondary hover:bg-canvas hover:text-ink font-medium'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-border-subtle flex flex-col gap-1">
            <Link
              href="/products"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-secondary hover:bg-canvas hover:text-ink transition-colors"
            >
              <ShoppingBag className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
              <span>Jelajah Katalog</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-danger-text hover:bg-danger-bg transition-colors text-left"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* Konten Utama */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile Horizontal Scrollable Tab Navigation (design2.md 5.8) */}
          <nav
            aria-label="Menu akun pembeli"
            className="lg:hidden bg-surface border-b border-border-subtle px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 min-h-[40px] rounded-xl px-3.5 py-2 text-xs whitespace-nowrap transition-colors shrink-0 ${
                    item.isActive
                      ? 'bg-brand-blue-soft text-brand-blue font-semibold'
                      : 'bg-canvas border border-border-subtle text-ink-secondary font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 bg-canvas p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto outline-none"
          >
            {children}
          </main>
        </div>
      </div>

      <Footer />
      <BottomNav user={user} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
