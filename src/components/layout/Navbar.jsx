'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Loader2,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import CampusSelector from '@/components/ui/CampusSelector';
import Button from '@/components/ui/Button';
import AccessibilityControl from '@/components/ui/AccessibilityControl';
import { formatRupiah } from '@/components/ui/Badge';

function NavbarItemImage({ src, alt }) {
  const [error, setError] = useState(false);
  if (!error && src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        onError={() => setError(true)}
        className="object-cover"
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-ink-soft/40">
      <Package className="w-4 h-4" />
    </div>
  );
}

export default function Navbar({
  user = null,
  cartCount: initialCartCount = 0,
  selectedCampus = null,
  showSearchBar = true,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cartCount, setCartCount] = useState(initialCartCount);
  const [prevInitialCartCount, setPrevInitialCartCount] = useState(initialCartCount);

  // Sync state bila prop dari server berubah
  if (initialCartCount !== prevInitialCartCount) {
    setPrevInitialCartCount(initialCartCount);
    setCartCount(initialCartCount);
  }

  // Dengarkan event pembaruan keranjang realtime dari client action
  useEffect(() => {
    function handleCartUpdated(e) {
      if (e.detail && typeof e.detail.cartCount === 'number') {
        setCartCount(e.detail.cartCount);
      }
    }
    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, []);

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

  // Live / Instant Search State
  const [liveResults, setLiveResults] = useState({ products: [], stores: [] });
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [isLiveDropdownOpen, setIsLiveDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Live / Instant Search saat pengguna mengetik di Navbar (debounce 250ms)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLiveSearching(true);
      try {
        const campusParam = selectedCampus?.id ? `&campus=${selectedCampus.id}` : '';
        const res = await fetch(`/api/search/instant?q=${encodeURIComponent(trimmed)}${campusParam}`);
        if (res.ok) {
          const data = await res.json();
          setLiveResults(data);
          setIsLiveDropdownOpen(true);
        }
      } catch (err) {
        console.error('Instant live search error:', err);
      } finally {
        setIsLiveSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCampus]);

  // Tutup menu & dropdown saat klik luar
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsLiveDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsLiveDropdownOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    if (params.get('campus') === 'all') {
      params.delete('campus');
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handleCampusChange = (campus) => {
    const params = new URLSearchParams(searchParams.toString());

    if (pathname === '/') {
      // Di beranda, tandai "Semua Kampus" secara eksplisit agar tidak fallback ke kampus default user
      if (campus && campus.id) {
        params.set('campus', String(campus.id));
      } else {
        params.set('campus', 'all');
      }
      params.delete('page');
      const queryString = params.toString();
      router.push(queryString ? `/?${queryString}` : '/');
      return;
    }

    if (campus && campus.id) {
      params.set('campus', String(campus.id));
    } else {
      params.delete('campus');
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
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
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-3">
        {/* Sisi Kiri: Logo LepasIn & Selektor Kampus */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center font-display text-ink font-extrabold text-base sm:text-xl md:text-2xl tracking-tight shrink-0"
          >
            <span className="text-primary">Lepas</span><span>In</span><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent inline-block ml-0.5"></span>
          </Link>

          {/* Selektor Kampus di Tablet & Desktop */}
          <div className="hidden md:block md:ml-1 lg:ml-3 max-w-[175px] lg:max-w-[230px]">
            <CampusSelector
              value={selectedCampus}
              onChange={handleCampusChange}
              allowAll={true}
              allLabel="Semua Kampus"
            />
          </div>
        </div>

        {/* Tengah: Search Bar di Tablet & Desktop (Live / Instant Search) */}
        {showSearchBar && (
          <div className="hidden md:flex flex-1 min-w-0 max-w-xs lg:max-w-md mx-2 lg:mx-4 relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Cari barang atau toko..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length < 2) {
                    setIsLiveDropdownOpen(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setIsLiveDropdownOpen(true);
                }}
                className="w-full h-10 pl-9 lg:pl-10 pr-9 lg:pr-10 text-base md:text-sm bg-surface rounded-full border border-line focus:bg-canvas focus:border-primary focus:ring-4 focus:ring-primary-50 outline-none transition"
              />
              <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {isLiveSearching ? (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsLiveDropdownOpen(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink p-0.5 cursor-pointer"
                  title="Bersihkan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </form>

            {/* Dropdown Live Search Popover */}
            {isLiveDropdownOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-canvas border border-line rounded-card shadow-float z-50 overflow-hidden divide-y divide-line/60 animate-in fade-in zoom-in-95 duration-150">
                {/* Section Toko Ditemukan */}
                {liveResults.stores?.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1 text-[11px] font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-primary" />
                      <span>Toko Terkait</span>
                    </div>
                    {liveResults.stores.map((st) => (
                      <Link
                        key={st.id}
                        href={`/stores/${st.id}`}
                        onClick={() => setIsLiveDropdownOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-alt transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-primary-50 text-primary flex items-center justify-center shrink-0">
                            <Store className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink truncate">{st.name}</p>
                            <p className="text-[10px] text-ink-soft truncate">{st.location || 'Area kampus'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pine-50 text-pine shrink-0">
                          {st.campus_short_name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Section Produk Ditemukan */}
                {liveResults.products?.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1 text-[11px] font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-primary" />
                      <span>Produk Langsung</span>
                    </div>
                    {liveResults.products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        onClick={() => setIsLiveDropdownOpen(false)}
                        className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-surface-alt transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-9 h-9 rounded-lg bg-surface overflow-hidden shrink-0 border border-line/60">
                            <NavbarItemImage src={p.image_url} alt={p.name} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{p.name}</p>
                            <p className="text-[10px] text-ink-soft truncate">
                              Toko {p.store_name} · {p.campus_short_name}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-sans text-xs font-bold text-primary tabular-nums">
                            {formatRupiah(p.price)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Kosong */}
                {!isLiveSearching &&
                  (!liveResults.products || liveResults.products.length === 0) &&
                  (!liveResults.stores || liveResults.stores.length === 0) && (
                    <div className="p-5 text-center text-xs text-ink-soft">
                      Tidak ada produk atau toko yang cocok dengan &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}

                {/* Tombol Lihat Semua Hasil */}
                <div className="p-2 bg-surface">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-2 px-3 text-center text-xs font-bold text-primary hover:bg-primary-50 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Lihat semua hasil untuk &ldquo;{searchQuery}&rdquo;</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sisi Kanan: Aksi Pengguna */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0">
          {/* Pengatur Aksesibilitas & Kenyamanan Baca (Multi-Generasi) */}
          <AccessibilityControl />

          {/* Keranjang Belanja (Buyer atau Guest) */}
          {(!user || user.role === 'buyer') && (
            <Link
              href="/buyer/cart"
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full text-ink hover:bg-surface-alt transition-colors flex items-center justify-center shrink-0"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5 text-ink" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold tabular-nums flex items-center justify-center shadow-sm">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Chat Pesanan (Buyer atau Seller) */}
          {user && (
            <Link
              href="/chat"
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full text-ink hover:bg-surface-alt transition-colors flex items-center justify-center shrink-0"
              aria-label="Pesan dan Chat"
              title="Pesan & Chat Koordinasi"
            >
              <MessageCircle className="w-5 h-5 text-ink" />
            </Link>
          )}

          {/* User Logged In Menu */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 lg:px-3 lg:py-1.5 rounded-full hover:bg-surface-alt transition-colors border border-line/70"
                aria-expanded={userMenuOpen}
                aria-label="Menu pengguna"
              >
                <div className="w-7 h-7 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
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
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent md:hidden"
                    onClick={() => setUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-[min(14rem,calc(100vw-1.5rem))] bg-canvas border border-line rounded-card shadow-float z-50 py-2 divide-y divide-line/60 animate-in fade-in zoom-in-95 duration-150">
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
                          <>
                            <Link
                              href="/seller/orders"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors"
                            >
                              <Package className="w-4 h-4 text-ink-soft" />
                              <span>Pesanan Masuk</span>
                            </Link>
                            <Link
                              href="/chat"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors"
                            >
                              <MessageCircle className="w-4 h-4 text-primary" />
                              <span>Chat Pembeli</span>
                            </Link>
                          </>
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
                          href="/chat"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-surface-alt transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-primary" />
                          <span>Chat Penjual</span>
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
                </>
              )}
            </div>
          ) : (
            /* Guest Actions */
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" pill className="!px-2 sm:!px-3.5">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm" pill className="!px-2.5 sm:!px-4">
                  Daftar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Baris Pencarian & Selektor Kampus di Mobile */}
      <div className="md:hidden px-3 sm:px-4 pb-2.5 flex items-center gap-2">
        <div className="flex-1 min-w-0">
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
            className="w-11 h-11 rounded-full bg-surface border border-line flex items-center justify-center text-ink shrink-0 hover:bg-surface-alt transition-colors"
            aria-label="Cari produk"
          >
            <Search className="w-4 h-4 text-ink-soft" />
          </Link>
        )}
      </div>
    </header>
  );
}
