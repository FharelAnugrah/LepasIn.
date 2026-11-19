'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  ArrowLeft,
  LogOut,
  MessageCircle,
  GraduationCap,
} from 'lucide-react';

export default function SellerSidebar({ user, store, newOrdersCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Ringkasan Lapak',
      href: '/seller',
      icon: LayoutDashboard,
      isActive: pathname === '/seller',
    },
    {
      label: 'Kelola Produk',
      href: '/seller/products',
      icon: Package,
      isActive: pathname.startsWith('/seller/products'),
    },
    {
      label: 'Pesanan Masuk',
      href: '/seller/orders',
      icon: ShoppingBag,
      badge: newOrdersCount > 0 ? newOrdersCount : null,
      isActive: pathname.startsWith('/seller/orders'),
    },
    {
      label: 'Chat Pembeli',
      href: '/chat',
      icon: MessageCircle,
      isActive: pathname.startsWith('/chat'),
    },
    {
      label: 'Pengaturan Toko',
      href: '/seller/store',
      icon: Store,
      isActive: pathname === '/seller/store',
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
    <>
      {/* Mobile Header + Scrollable Horizontal Tab Navigation (design2.md 5.8) */}
      <div className="lg:hidden sticky top-0 z-30 bg-surface border-b border-border-subtle">
        <div className="h-14 px-4 flex items-center justify-between gap-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/"
              className="inline-flex items-baseline font-extrabold text-lg text-navy-900 tracking-tight shrink-0"
            >
              <span>LepasIn</span>
              <span
                className="w-1.5 h-1.5 rounded-full bg-campus-gold inline-block ml-0.5 mb-0.5"
                aria-hidden="true"
              />
            </Link>
            <span className="text-xs font-semibold text-brand-blue bg-brand-blue-soft px-2 py-0.5 rounded-md truncate">
              {store?.name || 'Lapak Saya'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/"
              className="min-h-[38px] px-2.5 rounded-lg border border-border-subtle text-xs font-semibold text-ink-secondary hover:text-ink inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Katalog</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Keluar akun"
              className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-danger-text hover:bg-danger-bg inline-flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Menu penjual"
          className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-surface"
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
                {item.badge && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-campus-gold text-ink text-[10px] font-bold tabular-nums">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Fixed Left Sidebar (design2.md 5.8: w-64 bg-surface border-r p-4) */}
      <aside
        aria-label="Navigasi penjual"
        className="hidden lg:flex lg:flex-col w-64 shrink-0 fixed inset-y-0 left-0 z-30 bg-surface border-r border-border-subtle p-4 justify-between gap-4"
      >
        <div className="flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-3 pb-4 border-b border-border-subtle">
            <Link
              href="/"
              className="inline-flex items-baseline font-extrabold text-xl text-navy-900 tracking-tight w-fit"
            >
              <span>LepasIn</span>
              <span
                className="w-1.5 h-1.5 rounded-full bg-campus-gold inline-block ml-0.5 mb-0.5"
                aria-hidden="true"
              />
            </Link>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl surface-3d">
              <div className="w-9 h-9 rounded-xl icon-plinth-navy text-white font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                {store?.name ? store.name.charAt(0) : 'T'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-ink truncate">
                  {store?.name || 'Lapak Saya'}
                </span>
                <span className="text-[11px] text-brand-blue font-semibold truncate flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{user.campus_short_name || 'Kampus Terdaftar'}</span>
                </span>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <p className="px-3 pb-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Menu Penjual
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    item.isActive
                      ? 'nav-pill-3d-active font-semibold'
                      : 'text-ink-secondary hover:text-ink hover:bg-canvas font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-campus-gold text-ink tabular-nums shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-border-subtle flex flex-col gap-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px] text-ink-muted shrink-0" aria-hidden="true" />
            <span>Ke Katalog Publik</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-danger-text hover:bg-danger-bg transition-colors text-left"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
