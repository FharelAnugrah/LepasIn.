'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Store,
  ShieldCheck,
  Package,
  Heart,
  SlidersHorizontal,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import CampusSelector from '@/components/ui/CampusSelector';
import Button from '@/components/ui/Button';

export default function Navbar({
  user = null,
  cartCount = 0,
  selectedCampus = null,
  showSearchBar = true,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);

  // Sync state saat URL search params berubah tanpa cascading render
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Tutup menu saat klik luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handleCampusChange = (campus) => {
    const params = new URLSearchParams(searchParams.toString());
    if (campus && campus.id) {
      params.set('campus', campus.id);
    } else {
      params.delete('campus');
    }
    params.set('page', '1');

    if (pathname === '/' || pathname === '/products') {
      router.push(`${pathname}?${params.toString()}`);
    } else {
      router.push(`/products?${params.toString()}`);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-md border-b border-line">
      {/* Baris Atas Navbar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Sisi Kiri: Logo LepasIn atau Sapaan User */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-ink font-extrabold text-xl md:text-2xl tracking-tight"
          >
            <span className="text-primary">Lepas</span>
            <span>In</span>
            <span className="w-2 h-2 rounded-full bg-accent inline-block ml-0.5"></span>
          </Link>

          {/* Selektor Kampus di Desktop */}
          <div className="hidden md:block ml-4">
            <CampusSelector
              value={selectedCampus}
              onChange={handleCampusChange}
              allowAll={true}
              allLabel="Semua Kampus"
            />
          </div>
        </div>

        {/* Tengah: Search Bar di Desktop (jika diaktifkan) */}
        {showSearchBar && (
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Cari kipas, kasur, buku kuliah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs md:text-sm bg-surface rounded-full border border-line focus:bg-canvas focus:border-primary focus:ring-4 focus:ring-primary-50 outline-none transition"
              />
              <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>
          </div>
        )}

        {/* Sisi Kanan: Aksi Pengguna */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Keranjang Belanja (Buyer atau Guest) */}
          {(!user || user.role === 'buyer') && (
            <Link
              href="/buyer/cart"
              className="relative p-2.5 rounded-full text-ink hover:bg-surface-alt transition-colors"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5 text-ink" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* User Logged In Menu */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 md:px-3 md:py-1.5 rounded-full hover:bg-surface-alt transition-colors border border-line/70"
              >
                <div className="w-7 h-7 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-ink line-clamp-1 max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-ink-soft capitalize leading-none">
                    {user.role}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu Pengguna */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-canvas border border-line rounded-card shadow-float z-50 py-2 divide-y divide-line/60 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2">
                    <p className="text-xs text-ink-soft">Masuk sebagai</p>
                    <p className="text-xs font-bold text-ink truncate">{user.email}</p>
                    {user.campus_name && (
                      <p className="text-[11px] text-pine font-medium mt-0.5 truncate flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {user.campus_short_name || user.campus_name}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span>Dashboard Admin</span>
                      </Link>
                    )}

                    {user.role === 'seller' && (
                      <>
                        <Link
                          href={user.seller_status === 'approved' ? '/seller' : '/pending-seller'}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors font-medium"
                        >
                          <Store className="w-4 h-4 text-primary" />
                          <span>Toko Saya</span>
                        </Link>
                        {user.seller_status === 'approved' && (
                          <Link
                            href="/seller/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors"
                          >
                            <Package className="w-4 h-4 text-ink-soft" />
                            <span>Pesanan Masuk</span>
                          </Link>
                        )}
                      </>
                    )}

                    {user.role === 'buyer' && (
                      <>
                        <Link
                          href="/buyer/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors"
                        >
                          <Package className="w-4 h-4 text-ink-soft" />
                          <span>Pesanan Saya</span>
                        </Link>
                        <Link
                          href="/buyer/wishlist"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors"
                        >
                          <Heart className="w-4 h-4 text-danger" />
                          <span>Barang Favorit</span>
                        </Link>
                        <Link
                          href="/buyer/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors"
                        >
                          <User className="w-4 h-4 text-ink-soft" />
                          <span>Profil Saya</span>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-danger hover:bg-danger-50 transition-colors font-medium text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guest Actions */
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" pill>
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm" pill>
                  Daftar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Baris Pencarian & Selektor Kampus di Mobile */}
      <div className="md:hidden px-4 pb-3 flex items-center gap-2">
        <div className="flex-1">
          <CampusSelector
            value={selectedCampus}
            onChange={handleCampusChange}
            allowAll={true}
            allLabel="Semua Kampus"
            className="w-full"
          />
        </div>
        {showSearchBar && (
          <Link
            href="/products"
            className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-ink shrink-0"
            aria-label="Cari produk"
          >
            <Search className="w-4 h-4 text-ink-soft" />
          </Link>
        )}
      </div>
    </header>
  );
}
