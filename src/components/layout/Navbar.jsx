'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ShoppingCart,
  Search,
  User,
  LogOut,
  Store,
  ShieldCheck,
  Package,
  Heart,
  MapPin,
  Loader2,
  X,
  MessageCircle,
  LayoutDashboard,
} from 'lucide-react';
import CampusSelector from '@/components/ui/CampusSelector';
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
    <div className="w-full h-full flex items-center justify-center text-ink-muted">
      <Package className="w-4 h-4" aria-hidden="true" />
    </div>
  );
}

export default function Navbar({
  user = null,
  cartCount: initialCartCount = 0,
  selectedCampus = null,
  campuses = null,
  showSearchBar = true,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cartCount, setCartCount] = useState(initialCartCount);
  const [prevInitialCartCount, setPrevInitialCartCount] = useState(initialCartCount);

  if (initialCartCount !== prevInitialCartCount) {
    setPrevInitialCartCount(initialCartCount);
    setCartCount(initialCartCount);
  }

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

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuTriggerRef = useRef(null);

  const [liveResults, setLiveResults] = useState({ products: [], stores: [] });
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [isLiveDropdownOpen, setIsLiveDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

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

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsLiveDropdownOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (userMenuOpen) {
          setUserMenuOpen(false);
          userMenuTriggerRef.current?.focus();
        }
        if (isLiveDropdownOpen) {
          setIsLiveDropdownOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen, isLiveDropdownOpen]);

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
    params.delete('page');
    const queryString = params.toString();
    router.push(queryString ? `/products?${queryString}` : '/products');
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUserMenuOpen(false);
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const sellerShortcutHref =
    user?.role === 'seller'
      ? user.seller_status === 'approved'
        ? '/seller'
        : '/pending-seller'
      : '/admin';

  return (
    <header className="sticky top-0 z-40 navbar-3d">
      {/* Baris Utama Navbar (Tinggi 64px) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Kiri: Brand Logo LepasIn + Campus Selector Pill */}
        <div className="flex items-center gap-2 lg:gap-3 min-w-0 shrink-0">
          <Link
            href="/"
            className="group inline-flex items-baseline font-extrabold text-xl text-navy-900 tracking-tight shrink-0 transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>LepasIn</span>
            <span
              className="w-2 h-2 rounded-[4px] bg-campus-gold inline-block ml-0.5 mb-0.5 shadow-[0_2px_0_#B87D04] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:rotate-12"
              aria-hidden="true"
            />
          </Link>

          <div className="hidden md:block max-w-[190px] lg:max-w-[230px]">
            <CampusSelector
              value={selectedCampus}
              onChange={handleCampusChange}
              campuses={campuses}
              allowAll={true}
              allLabel="Semua Kampus"
            />
          </div>
        </div>

        {/* Tengah: Search Bar Tablet & Desktop */}
        {showSearchBar && (
          <div
            className="hidden md:flex flex-1 min-w-0 max-w-sm lg:max-w-md mx-2 relative"
            ref={searchContainerRef}
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full" role="search">
              <label htmlFor="navbar-search" className="sr-only">
                Cari barang atau toko
              </label>
              <input
                id="navbar-search"
                type="text"
                placeholder="Cari kasur, kipas, buku, atau toko..."
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
                className="input-3d w-full h-10 pl-10 pr-10 text-sm bg-surface-muted/80 text-ink placeholder:text-ink-subtle rounded-full border border-border-subtle/80 focus:bg-surface focus:border-brand-blue outline-none"
              />
              <Search
                className="w-4 h-4 text-ink-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              {isLiveSearching ? (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-blue">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                </div>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsLiveDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink p-1.5 rounded-full"
                  aria-label="Bersihkan kata kunci pencarian"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </form>

            {/* Dropdown Hasil Live Search */}
            {isLiveDropdownOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2.5 dropdown-3d rounded-2xl z-50 overflow-hidden divide-y divide-border-subtle">
                {liveResults.stores?.length > 0 && (
                  <div className="p-2">
                    <div className="px-2.5 py-1 text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                      <span>Toko Terkait</span>
                    </div>
                    {liveResults.stores.map((st) => (
                      <Link
                        key={st.id}
                        href={`/stores/${st.id}`}
                        onClick={() => setIsLiveDropdownOpen(false)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-canvas transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
                            <Store className="w-3.5 h-3.5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{st.name}</p>
                            <p className="text-[11px] text-ink-muted truncate">
                              {st.location || 'Area kampus'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-blue-soft text-brand-blue shrink-0">
                          {st.campus_short_name}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {liveResults.products?.length > 0 && (
                  <div className="p-2">
                    <div className="px-2.5 py-1 text-xs font-semibold text-ink-muted flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                      <span>Produk Langsung</span>
                    </div>
                    {liveResults.products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        onClick={() => setIsLiveDropdownOpen(false)}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-canvas transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-9 h-9 rounded-lg bg-surface-muted overflow-hidden shrink-0 border border-border-subtle">
                            <NavbarItemImage src={p.image_url} alt={p.name} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{p.name}</p>
                            <p className="text-[11px] text-ink-muted truncate">
                              {p.store_name} ({p.campus_short_name})
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-brand-blue tabular-nums shrink-0">
                          {formatRupiah(p.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {!isLiveSearching &&
                  (!liveResults.products || liveResults.products.length === 0) &&
                  (!liveResults.stores || liveResults.stores.length === 0) && (
                    <div className="p-4 text-center text-xs text-ink-muted">
                      Tidak ada produk atau toko yang cocok dengan &ldquo;{searchQuery}&rdquo;
                    </div>
                  )}

                <div className="p-2 bg-canvas">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-2 px-3 text-center text-xs font-semibold text-brand-blue hover:bg-brand-blue-soft rounded-lg transition-colors"
                  >
                    Lihat semua hasil untuk &ldquo;{searchQuery}&rdquo;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kanan: Aksi Pengguna per design2.md 5.1 */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <AccessibilityControl />

          {/* Buyer Quick Actions: Wishlist & Cart */}
          {(!user || user.role === 'buyer') && (
            <>
              {user?.role === 'buyer' && (
                <Link
                  href="/buyer/wishlist"
                  className="hidden sm:inline-flex w-11 h-11 md:w-10 md:h-10 rounded-xl chip-3d items-center justify-center shrink-0"
                  aria-label="Barang Favorit"
                  title="Barang Favorit"
                >
                  <Heart className="w-4.5 h-4.5" aria-hidden="true" />
                </Link>
              )}

              <Link
                href="/buyer/cart"
                className="relative w-11 h-11 md:w-10 md:h-10 rounded-xl chip-3d flex items-center justify-center shrink-0"
                aria-label={`Keranjang Belanja${cartCount > 0 ? `, ${cartCount} barang` : ''}`}
                title="Keranjang Belanja"
              >
                <ShoppingCart className="w-4.5 h-4.5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full icon-plinth-gold text-ink text-[10px] font-extrabold tabular-nums flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Tombol Pintas Seller / Admin */}
          {user && (user.role === 'seller' || user.role === 'admin') && (
            <Link
              href={sellerShortcutHref}
              className="hidden sm:inline-flex btn-3d btn-3d-navy items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0"
            >
              {user.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-campus-gold" aria-hidden="true" />
              ) : (
                <Store className="w-4 h-4 text-campus-gold" aria-hidden="true" />
              )}
              <span>{user.role === 'admin' ? 'Panel Admin' : 'Dashboard Toko'}</span>
            </Link>
          )}

          {/* Chat Koordinasi (akses utama menuju halaman Chat sesuai role pengguna) */}
          {user &&
            (user.role === 'buyer' ||
              (user.role === 'seller' && user.seller_status === 'approved')) && (
              <Link
                href="/chat"
                className="w-11 h-11 md:w-10 md:h-10 rounded-xl chip-3d flex items-center justify-center shrink-0"
                aria-label="Pesan dan Chat"
                title="Pesan dan Chat"
              >
                <MessageCircle className="w-4.5 h-4.5" aria-hidden="true" />
              </Link>
            )}

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                ref={userMenuTriggerRef}
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="chip-3d flex items-center gap-2 min-h-[44px] md:min-h-[38px] px-2 lg:px-2.5 rounded-xl"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="Menu akun pengguna"
              >
                <span className="w-7 h-7 rounded-lg icon-plinth-navy text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {user.name ? user.name.charAt(0) : 'U'}
                </span>
                <span className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-ink line-clamp-1 max-w-[110px]">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-ink-muted capitalize leading-none">
                    {user.role}
                  </span>
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent md:hidden"
                    onClick={() => setUserMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 mt-2.5 w-[min(15.5rem,calc(100vw-1.5rem))] dropdown-3d rounded-2xl z-50 py-1.5 divide-y divide-border-subtle"
                  >
                    <div className="px-4 py-2.5">
                      <p className="text-[11px] text-ink-muted">Masuk sebagai</p>
                      <p className="text-xs font-bold text-ink truncate">{user.email}</p>
                      {user.campus_name && (
                        <p className="text-[11px] text-brand-blue font-semibold mt-1 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>{user.campus_short_name || user.campus_name}</span>
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      {user.role === 'admin' && (
                        <Link
                          role="menuitem"
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-canvas transition-colors font-medium"
                        >
                          <ShieldCheck className="w-4 h-4 text-brand-blue" aria-hidden="true" />
                          <span>Dashboard Admin</span>
                        </Link>
                      )}

                      {user.role === 'seller' && (
                        <>
                          <Link
                            role="menuitem"
                            href={user.seller_status === 'approved' ? '/seller' : '/pending-seller'}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-canvas transition-colors font-medium"
                          >
                            <Store className="w-4 h-4 text-brand-blue" aria-hidden="true" />
                            <span>Toko Saya</span>
                          </Link>
                          {user.seller_status === 'approved' && (
                            <Link
                              role="menuitem"
                              href="/seller/orders"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
                            >
                              <Package className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                              <span>Pesanan Masuk</span>
                            </Link>
                          )}
                        </>
                      )}

                      {user.role === 'buyer' && (
                        <>
                          <Link
                            role="menuitem"
                            href="/buyer"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink hover:bg-canvas transition-colors font-medium"
                          >
                            <LayoutDashboard className="w-4 h-4 text-brand-blue" aria-hidden="true" />
                            <span>Ringkasan Akun</span>
                          </Link>
                          <Link
                            role="menuitem"
                            href="/buyer/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
                          >
                            <Package className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                            <span>Pesanan Saya</span>
                          </Link>
                          <Link
                            role="menuitem"
                            href="/buyer/wishlist"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
                          >
                            <Heart className="w-4 h-4 text-danger-text" aria-hidden="true" />
                            <span>Barang Favorit</span>
                          </Link>
                          <Link
                            role="menuitem"
                            href="/buyer/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
                          >
                            <User className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                            <span>Profil & Kampus</span>
                          </Link>
                          <Link
                            role="menuitem"
                            href="/buyer/addresses"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
                          >
                            <MapPin className="w-4 h-4 text-ink-muted" aria-hidden="true" />
                            <span>Alamat Kost</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        role="menuitem"
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-danger-text hover:bg-danger-bg transition-colors font-semibold text-left"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Guest Actions 3D */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="btn-3d btn-3d-secondary inline-flex items-center justify-center min-h-[44px] md:min-h-[38px] px-3.5 text-sm font-semibold rounded-xl"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="btn-3d btn-3d-navy inline-flex items-center justify-center min-h-[44px] md:min-h-[38px] px-4 py-2 text-sm font-semibold rounded-xl"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Baris Pencarian & Selektor Kampus di Mobile (< md) */}
      <div className="md:hidden px-3 sm:px-4 pb-3 pt-1 flex items-center gap-2 border-t border-border-subtle/60 bg-surface">
        <div className="flex-1 min-w-0">
          <CampusSelector
            value={selectedCampus}
            onChange={handleCampusChange}
            campuses={campuses}
            allowAll={true}
            allLabel="Semua Kampus"
            fullWidth={true}
            className="w-full"
          />
        </div>
        {showSearchBar && (
          <Link
            href="/products"
            className="w-11 h-11 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-ink-secondary hover:text-ink shrink-0 transition-colors"
            aria-label="Cari produk di katalog"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </header>
  );
}
