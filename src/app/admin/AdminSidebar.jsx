'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  Users,
  Tags,
  GraduationCap,
  Package,
  ArrowLeft,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export default function AdminSidebar({ user, pendingCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      label: 'Ringkasan Statistik',
      href: '/admin',
      icon: LayoutDashboard,
      isActive: pathname === '/admin',
    },
    {
      label: 'Verifikasi Penjual',
      href: '/admin/sellers',
      icon: Store,
      badge: pendingCount > 0 ? pendingCount : null,
      isActive: pathname === '/admin/sellers',
    },
    {
      label: 'Kelola Pengguna',
      href: '/admin/users',
      icon: Users,
      isActive: pathname.startsWith('/admin/users'),
    },
    {
      label: 'Kategori Produk',
      href: '/admin/categories',
      icon: Tags,
      isActive: pathname === '/admin/categories',
    },
    {
      label: 'Daftar Kampus',
      href: '/admin/campuses',
      icon: GraduationCap,
      isActive: pathname === '/admin/campuses',
    },
    {
      label: 'Moderasi Produk',
      href: '/admin/products',
      icon: Package,
      isActive: pathname === '/admin/products',
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
      {/* Mobile Header + Horizontal Scrollable Tab Navigation (design2.md 5.8) */}
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
            <span className="text-xs font-semibold text-brand-blue bg-brand-blue-soft px-2 py-0.5 rounded-md">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/"
              className="min-h-[38px] px-2.5 rounded-lg border border-border-subtle text-xs font-semibold text-ink-secondary hover:text-ink inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Beranda</span>
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
          aria-label="Menu admin"
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

      {/* Desktop Fixed Left Sidebar (design2.md 5.8) */}
      <aside
        aria-label="Navigasi admin"
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
              <div className="w-9 h-9 rounded-xl icon-plinth-navy text-campus-gold flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-ink truncate">{user.name}</span>
                <span className="text-[11px] text-brand-blue font-semibold uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <p className="px-3 pb-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Manajemen Platform
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
            <span>Kembali ke Beranda</span>
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
