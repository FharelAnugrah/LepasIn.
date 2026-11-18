'use client';

import { useState, useEffect } from 'react';
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
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function AdminSidebar({ user, pendingCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

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

  const navContent = (
    <div className="flex flex-col h-full bg-surface border-r border-line">
      {/* Brand & Admin Badge */}
      <div className="p-5 border-b border-line">
        <Link href="/" className="inline-flex items-center font-display text-ink font-extrabold text-xl tracking-tight mb-2">
          <span className="text-primary">Lepas</span><span>In</span><span className="w-2 h-2 rounded-full bg-accent inline-block ml-0.5"></span>
        </Link>
        <div className="flex items-center gap-2 p-2 rounded-xl bg-canvas border border-line">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-ink truncate">{user.name}</span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
              Super Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigasi Utama */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
          Menu Manajemen
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                item.isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-soft hover:text-ink hover:bg-canvas'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.isActive
                      ? 'bg-accent text-ink'
                      : 'bg-warning-50 text-warning border border-warning/20'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Navigasi Bawah */}
      <div className="p-3 border-t border-line flex flex-col gap-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-ink-soft hover:text-ink hover:bg-canvas transition"
        >
          <ArrowLeft className="w-4 h-4 text-ink-soft" />
          <span>Kembali ke Beranda</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-danger hover:bg-danger-50 transition text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Tombol Header Mobile */}
      <header className="lg:hidden sticky top-0 z-30 bg-canvas/95 backdrop-blur-md border-b border-line h-14 px-4 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center font-display text-lg text-ink font-extrabold tracking-tight">
          <span className="text-primary">Lepas</span><span>In</span><span className="font-sans text-xs font-medium text-ink-soft ml-1.5">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-11 h-11 -mr-1.5 rounded-xl text-ink hover:bg-surface-alt flex items-center justify-center cursor-pointer"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs flex">
          <div className="w-72 max-w-[80vw] h-full shadow-float animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Sidebar Desktop Permanen */}
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        {navContent}
      </aside>
    </>
  );
}
