'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  Check,
  Store,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import Modal from '@/components/ui/Modal';

const MAX_FILTER_PRICE = 1000000000;

function sanitizePriceInput(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function validatePriceRange(minVal, maxVal) {
  const hasMin = minVal !== '' && minVal !== null && minVal !== undefined;
  const hasMax = maxVal !== '' && maxVal !== null && maxVal !== undefined;

  if ((hasMin && Number(minVal) > MAX_FILTER_PRICE) || (hasMax && Number(maxVal) > MAX_FILTER_PRICE)) {
    return 'Nominal harga maksimal Rp 1.000.000.000.';
  }

  if (hasMin && hasMax && Number(minVal) > Number(maxVal)) {
    return 'Harga minimum tidak boleh lebih besar dari harga maksimum.';
  }

  return '';
}

export default function ProductCatalog({
  initialProducts,
  pagination,
  filters,
  categories,
  campuses,
  stores = [],
  matchedStores = [],
  selectedStore = null,
  user,
  wishlistIds = [],
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [q, setQ] = useState(filters.q || '');
  const [prevFilterQ, setPrevFilterQ] = useState(filters.q || '');
  if ((filters.q || '') !== prevFilterQ) {
    setPrevFilterQ(filters.q || '');
    setQ(filters.q || '');
  }

  const [campus, setCampus] = useState(
    campuses.find((c) => c.id === Number(filters.campus)) || null
  );
  const [prevFilterCampus, setPrevFilterCampus] = useState(filters.campus || null);
  if ((filters.campus || null) !== prevFilterCampus) {
    setPrevFilterCampus(filters.campus || null);
    setCampus(campuses.find((c) => c.id === Number(filters.campus)) || null);
  }
  const [category, setCategory] = useState(filters.category ? Number(filters.category) : null);
  const [prevFilterCategory, setPrevFilterCategory] = useState(filters.category || null);
  if ((filters.category || null) !== prevFilterCategory) {
    setPrevFilterCategory(filters.category || null);
    setCategory(filters.category ? Number(filters.category) : null);
  }

  const [store, setStore] = useState(filters.store ? Number(filters.store) : null);
  const [prevFilterStore, setPrevFilterStore] = useState(filters.store || null);
  if ((filters.store || null) !== prevFilterStore) {
    setPrevFilterStore(filters.store || null);
    setStore(filters.store ? Number(filters.store) : null);
  }

  const [condition, setCondition] = useState(filters.condition || null);
  const [prevFilterCondition, setPrevFilterCondition] = useState(filters.condition || null);
  if ((filters.condition || null) !== prevFilterCondition) {
    setPrevFilterCondition(filters.condition || null);
    setCondition(filters.condition || null);
  }

  const [minPrice, setMinPrice] = useState(filters.minPrice ?? '');
  const [prevFilterMinPrice, setPrevFilterMinPrice] = useState(filters.minPrice ?? '');
  if ((filters.minPrice ?? '') !== prevFilterMinPrice) {
    setPrevFilterMinPrice(filters.minPrice ?? '');
    setMinPrice(filters.minPrice ?? '');
  }

  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? '');
  const [prevFilterMaxPrice, setPrevFilterMaxPrice] = useState(filters.maxPrice ?? '');
  if ((filters.maxPrice ?? '') !== prevFilterMaxPrice) {
    setPrevFilterMaxPrice(filters.maxPrice ?? '');
    setMaxPrice(filters.maxPrice ?? '');
  }

  const [sort, setSort] = useState(filters.sort || 'latest');
  const [prevFilterSort, setPrevFilterSort] = useState(filters.sort || 'latest');
  if ((filters.sort || 'latest') !== prevFilterSort) {
    setPrevFilterSort(filters.sort || 'latest');
    setSort(filters.sort || 'latest');
  }
  const [priceError, setPriceError] = useState('');

  const relevantStores = campus
    ? stores.filter((s) => s.campus_id === campus.id)
    : stores;

  const currentStoreObj = selectedStore || stores.find((s) => s.id === store);
  const storeOptions =
    currentStoreObj && !relevantStores.some((s) => s.id === currentStoreObj.id)
      ? [currentStoreObj, ...relevantStores]
      : relevantStores;

  const sortedCategories = [...(categories || [])].sort((a, b) => {
    const isALainnya = /^(lainnya|lain-lain|lainnya \/ other)$/i.test(a.name?.trim());
    const isBLainnya = /^(lainnya|lain-lain|lainnya \/ other)$/i.test(b.name?.trim());
    if (isALainnya && !isBLainnya) return 1;
    if (!isALainnya && isBLainnya) return -1;
    return a.id - b.id;
  });

  const conditionsList = [
    { id: 'like_new', label: 'Seperti Baru' },
    { id: 'good', label: 'Baik' },
    { id: 'fair', label: 'Layak Pakai' },
    { id: 'minor_defect', label: 'Ada Minus' },
  ];

  const sortOptions = [
    { id: 'latest', label: 'Paling Baru Dilepas' },
    { id: 'price_asc', label: 'Harga: Termurah' },
    { id: 'price_desc', label: 'Harga: Tertinggi' },
    { id: 'rating_desc', label: 'Rating: Tertinggi' },
  ];

  const applyFilters = (newParams = {}, isPush = true) => {
    const params = new URLSearchParams();

    const appliedMinPrice = filters.minPrice ?? '';
    const appliedMaxPrice = filters.maxPrice ?? '';

    const currentFilters = {
      q: newParams.q !== undefined ? newParams.q : q,
      campus: newParams.campus !== undefined ? newParams.campus?.id : campus?.id,
      category: newParams.category !== undefined ? newParams.category : category,
      store: newParams.store !== undefined ? newParams.store : store,
      condition: newParams.condition !== undefined ? newParams.condition : condition,
      minPrice: newParams.minPrice !== undefined ? newParams.minPrice : appliedMinPrice,
      maxPrice: newParams.maxPrice !== undefined ? newParams.maxPrice : appliedMaxPrice,
      sort: newParams.sort !== undefined ? newParams.sort : sort,
      page: newParams.page !== undefined ? newParams.page : 1,
    };

    if (currentFilters.q && currentFilters.q.trim()) {
      params.set('q', currentFilters.q.trim());
    }
    if (currentFilters.campus) {
      params.set('campus', currentFilters.campus);
    }
    if (currentFilters.category) {
      params.set('category', currentFilters.category);
    }
    if (currentFilters.store) {
      params.set('store', currentFilters.store);
    }
    if (currentFilters.condition) {
      params.set('condition', currentFilters.condition);
    }
    if (currentFilters.minPrice !== '' && currentFilters.minPrice !== null && currentFilters.minPrice !== undefined) {
      params.set('minPrice', currentFilters.minPrice);
    }
    if (currentFilters.maxPrice !== '' && currentFilters.maxPrice !== null && currentFilters.maxPrice !== undefined) {
      params.set('maxPrice', currentFilters.maxPrice);
    }
    if (currentFilters.sort && currentFilters.sort !== 'latest') {
      params.set('sort', currentFilters.sort);
    }
    if (currentFilters.page && currentFilters.page > 1) {
      params.set('page', currentFilters.page);
    }

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    if (isPush) {
      router.push(targetUrl);
    } else {
      router.replace(targetUrl);
    }
    setMobileFilterOpen(false);
  };

  useEffect(() => {
    if (q.trim() === (filters.q || '').trim()) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (q.trim()) {
        params.set('q', q.trim());
      } else {
        params.delete('q');
      }
      params.set('page', '1');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);

    return () => clearTimeout(timer);
  }, [q, filters.q, pathname, router]);

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && ['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleMinPriceChange = (e) => {
    setMinPrice(sanitizePriceInput(e.target.value));
    if (priceError) setPriceError('');
  };

  const handleMaxPriceChange = (e) => {
    setMaxPrice(sanitizePriceInput(e.target.value));
    if (priceError) setPriceError('');
  };

  const handleApplyPriceFilter = () => {
    const err = validatePriceRange(minPrice, maxPrice);
    if (err) {
      setPriceError(err);
      return;
    }
    setPriceError('');
    const nextMin = minPrice !== '' ? String(Number(minPrice)) : '';
    const nextMax = maxPrice !== '' ? String(Number(maxPrice)) : '';
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    applyFilters({ minPrice: nextMin, maxPrice: nextMax, page: 1 });
  };

  const handleApplyMobileFilters = () => {
    const err = validatePriceRange(minPrice, maxPrice);
    if (err) {
      setPriceError(err);
      return;
    }
    setPriceError('');
    const nextMin = minPrice !== '' ? String(Number(minPrice)) : '';
    const nextMax = maxPrice !== '' ? String(Number(maxPrice)) : '';
    setMinPrice(nextMin);
    setMaxPrice(nextMax);
    applyFilters({ minPrice: nextMin, maxPrice: nextMax, page: 1 });
  };

  const handleResetFilters = () => {
    setQ('');
    setCampus(null);
    setCategory(null);
    setStore(null);
    setCondition(null);
    setMinPrice('');
    setMaxPrice('');
    setPriceError('');
    setSort('latest');
    router.push(pathname);
    setMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters({ q, page: 1 }, true);
  };

  const activeFiltersCount = [
    q.trim(),
    campus,
    category,
    store,
    condition,
    minPrice !== '' && minPrice !== null && minPrice !== undefined ? String(minPrice) : '',
    maxPrice !== '' && maxPrice !== null && maxPrice !== undefined ? String(maxPrice) : '',
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Judul Katalog */}
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">
          Katalog Barang Kost & Kampus
        </h1>
        <p className="text-xs md:text-sm text-ink-muted mt-1">
          Saring produk berdasarkan perguruan tinggi, kategori, kondisi barang, atau rentang harga.
        </p>
      </div>

      {/* Bar Pencarian, Sort, dan Tombol Filter Mobile */}
      <div className="surface-3d rounded-2xl p-3.5 md:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1" role="search">
          <label htmlFor="catalog-search" className="sr-only">
            Cari nama barang atau nama toko
          </label>
          <Search
            className="w-4 h-4 text-ink-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="catalog-search"
            type="text"
            placeholder="Cari nama barang atau nama toko..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input-3d w-full h-11 pl-10 pr-14 text-base md:text-sm bg-surface-muted/80 text-ink placeholder:text-ink-subtle rounded-full border border-border-subtle/80 focus:bg-surface focus:border-brand-blue outline-none"
          />
          {q && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {q !== (filters.q || '') && (
                <Loader2 className="w-3.5 h-3.5 text-brand-blue animate-spin" aria-hidden="true" />
              )}
              <button
                type="button"
                onClick={() => {
                  setQ('');
                  applyFilters({ q: '', page: 1 }, true);
                }}
                className="text-ink-subtle hover:text-ink p-1.5 rounded-full"
                aria-label="Hapus kata kunci pencarian"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </form>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden btn-3d btn-3d-secondary flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-xs font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-blue" aria-hidden="true" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-blue text-white text-[11px] font-bold tabular-nums flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="relative flex-1 md:flex-none min-w-0">
            <label htmlFor="catalog-sort" className="sr-only">
              Urutkan produk
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                applyFilters({ sort: e.target.value, page: 1 });
              }}
              className="input-3d select-custom-arrow w-full md:w-auto h-11 pl-3.5 pr-9 rounded-xl bg-surface border border-border-subtle text-xs md:text-sm font-medium text-ink cursor-pointer outline-none focus:border-brand-blue"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Konten Utama: Sidebar Filter Desktop + Grid Produk */}
      <div className="flex items-start gap-6">
        <aside
          aria-label="Filter katalog produk"
          className="hidden lg:flex flex-col gap-5 w-64 xl:w-68 shrink-0 surface-3d rounded-2xl p-5 sticky-sidebar-panel"
        >
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2 font-bold text-ink text-sm">
              <SlidersHorizontal className="w-4 h-4 text-brand-blue" aria-hidden="true" />
              <span>Filter Produk</span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-brand-blue font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Filter 1: Kategori */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-secondary">
              Kategori Belanja
            </span>
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  setCategory(null);
                  applyFilters({ category: null, page: 1 });
                }}
                className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg text-left transition-colors ${
                  category === null
                    ? 'bg-brand-blue-soft text-brand-blue font-semibold'
                    : 'text-ink-secondary hover:text-ink hover:bg-canvas'
                }`}
              >
                <span>Semua Kategori</span>
                {category === null && <Check className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />}
              </button>
              {sortedCategories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      applyFilters({ category: cat.id, page: 1 });
                    }}
                    className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-brand-blue-soft text-brand-blue font-semibold'
                        : 'text-ink-secondary hover:text-ink hover:bg-canvas'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 2: Toko */}
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="desktop-store-filter" className="text-xs font-semibold text-ink-secondary flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                <span>Toko Penjual</span>
              </label>
              {store && (
                <button
                  type="button"
                  onClick={() => {
                    setStore(null);
                    applyFilters({ store: null, page: 1 });
                  }}
                  className="text-xs text-brand-blue font-semibold hover:underline"
                >
                  Semua
                </button>
              )}
            </div>
            <select
              id="desktop-store-filter"
              value={store || ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : null;
                setStore(val);
                applyFilters({ store: val, page: 1 });
              }}
              className="input-3d w-full h-10 px-3 rounded-xl bg-surface border border-border-subtle text-xs font-medium text-ink outline-none focus:border-brand-blue"
            >
              <option value="">Semua Toko ({relevantStores.length})</option>
              {storeOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.campus_short_name})
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Kondisi */}
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
            <span className="text-xs font-semibold text-ink-secondary">
              Kondisi Barang
            </span>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setCondition(null);
                  applyFilters({ condition: null, page: 1 });
                }}
                className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg text-left transition-colors ${
                  condition === null
                    ? 'bg-brand-blue-soft text-brand-blue font-semibold'
                    : 'text-ink-secondary hover:text-ink hover:bg-canvas'
                }`}
              >
                <span>Semua Kondisi</span>
                {condition === null && <Check className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />}
              </button>
              {conditionsList.map((cond) => {
                const isSelected = condition === cond.id;
                return (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => {
                      setCondition(cond.id);
                      applyFilters({ condition: cond.id, page: 1 });
                    }}
                    className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-brand-blue-soft text-brand-blue font-semibold'
                        : 'text-ink-secondary hover:text-ink hover:bg-canvas'
                    }`}
                  >
                    <span>{cond.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 4: Rentang Harga */}
          <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
            <span className="text-xs font-semibold text-ink-secondary">
              Rentang Harga (Rp)
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="min-price-desktop" className="sr-only">Harga minimum</label>
              <input
                id="min-price-desktop"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Min"
                value={minPrice}
                onChange={handleMinPriceChange}
                onKeyDown={handlePriceKeyDown}
                className="w-full h-9 px-2.5 rounded-lg bg-canvas border border-border-subtle text-xs tabular-nums text-ink outline-none focus:bg-surface focus:border-brand-blue"
              />
              <span className="text-ink-muted text-xs">-</span>
              <label htmlFor="max-price-desktop" className="sr-only">Harga maksimum</label>
              <input
                id="max-price-desktop"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Maks"
                value={maxPrice}
                onChange={handleMaxPriceChange}
                onKeyDown={handlePriceKeyDown}
                className="w-full h-9 px-2.5 rounded-lg bg-canvas border border-border-subtle text-xs tabular-nums text-ink outline-none focus:bg-surface focus:border-brand-blue"
              />
            </div>
            {priceError && (
              <p role="alert" className="text-xs text-danger-text font-medium">
                {priceError}
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleApplyPriceFilter}
              className="mt-1 w-full"
            >
              Terapkan Harga
            </Button>
          </div>
        </aside>

        {/* Kolom Kanan: Daftar Produk & Pagination */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
            <div className="flex items-center flex-wrap gap-1.5 tabular-nums">
              <span>
                Menampilkan <strong className="font-semibold text-ink">{initialProducts.length}</strong> dari{' '}
                <strong className="font-semibold text-ink">{pagination.total}</strong> produk
              </span>
              {campus && (
                <span>
                  di <span className="font-semibold text-brand-blue">{campus.short_name}</span>
                </span>
              )}
              {currentStoreObj && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-blue-soft text-brand-blue text-xs font-semibold">
                  <Store className="w-3 h-3" aria-hidden="true" />
                  <span>{currentStoreObj.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStore(null);
                      applyFilters({ store: null, page: 1 });
                    }}
                    className="hover:text-danger-text ml-0.5 font-bold p-0.5"
                    aria-label="Hapus filter toko"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-brand-blue font-semibold hover:underline"
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          {/* Toko Terkait Sesuai Pencarian */}
          {matchedStores && matchedStores.length > 0 && (
            <div className="surface-3d rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <Store className="w-4 h-4 text-brand-blue" aria-hidden="true" />
                  <span>Toko Ditemukan ({matchedStores.length})</span>
                </div>
                {q && (
                  <span className="text-xs text-ink-muted">
                    Hasil untuk &ldquo;{q}&rdquo;
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {matchedStores.map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-2xl card-3d flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h2 className="font-semibold text-sm text-ink truncate" title={st.name}>
                          {st.name}
                        </h2>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-blue-soft text-brand-blue shrink-0">
                          {st.campus_short_name}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted line-clamp-1">
                        {st.location || 'Area sekitar kampus'}
                      </p>
                      <p className="text-xs text-ink-secondary mt-1 tabular-nums">
                        <strong className="text-ink font-semibold">{st.products_count}</strong> produk aktif
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                      <Link
                        href={`/stores/${st.id}`}
                        className="btn-3d btn-3d-primary flex-1 text-center py-2 px-2.5 rounded-xl text-xs font-semibold"
                      >
                        Kunjungi Toko
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setStore(st.id);
                          applyFilters({ store: st.id, page: 1 });
                        }}
                        className="btn-3d btn-3d-secondary py-2 px-2.5 rounded-xl text-xs font-semibold"
                      >
                        Lihat Barang
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid Produk */}
          {initialProducts.length === 0 ? (
            <div className="surface-3d rounded-2xl p-10 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl icon-plinth-3d text-brand-blue flex items-center justify-center mb-4">
                <Search className="w-7 h-7" aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold text-ink">
                Produk Tidak Ditemukan
              </h2>
              <p className="text-xs md:text-sm text-ink-muted max-w-sm mt-1 mb-5 leading-relaxed">
                Tidak ada barang preloved yang cocok dengan kriteria filter kampus atau kata kunci pencarianmu.
              </p>
              <Button variant="primary" onClick={handleResetFilters}>
                Bersihkan Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {initialProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={wishlistIds.includes(product.id)}
                  user={user}
                />
              ))}
            </div>
          )}

          {/* Pagination Bernomor (PRD PUB-3, design2.md 6.3) */}
          {pagination.totalPages > 1 && (
            <nav aria-label="Navigasi halaman katalog" className="flex flex-wrap items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => applyFilters({ page: pagination.page - 1 })}
              >
                Sebelumnya
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return (
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const isGap = prev && p - prev > 1;
                    return (
                      <div key={p} className="flex items-center gap-1">
                        {isGap && <span className="text-ink-muted px-1">...</span>}
                        <button
                          type="button"
                          onClick={() => applyFilters({ page: p })}
                          aria-current={pagination.page === p ? 'page' : undefined}
                          className={`min-w-[40px] h-10 px-3 rounded-xl text-xs font-bold tabular-nums ${
                            pagination.page === p
                              ? 'chip-3d-active'
                              : 'chip-3d'
                          }`}
                        >
                          {p}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => applyFilters({ page: pagination.page + 1 })}
              >
                Berikutnya
              </Button>
            </nav>
          )}
        </div>
      </div>

      {/* Modal Filter untuk Mobile */}
      <Modal
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter Produk"
      >
        <div className="flex flex-col gap-5 py-1">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink-secondary">Kategori</span>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`min-h-[40px] px-3 py-2 rounded-lg text-xs text-left border transition-colors ${
                  category === null
                    ? 'border-brand-blue bg-brand-blue-soft text-brand-blue font-semibold'
                    : 'border-border-subtle bg-canvas text-ink-secondary'
                }`}
              >
                Semua Kategori
              </button>
              {sortedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs text-left border transition-colors ${
                    category === c.id
                      ? 'border-brand-blue bg-brand-blue-soft text-brand-blue font-semibold'
                      : 'border-border-subtle bg-canvas text-ink-secondary'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
            <div className="flex items-center justify-between">
              <label htmlFor="mobile-store-filter" className="text-xs font-semibold text-ink-secondary flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                <span>Pilih Toko</span>
              </label>
              {store && (
                <button
                  type="button"
                  onClick={() => setStore(null)}
                  className="text-xs text-brand-blue font-semibold hover:underline"
                >
                  Semua Toko
                </button>
              )}
            </div>
            <select
              id="mobile-store-filter"
              value={store || ''}
              onChange={(e) => setStore(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-11 px-3 rounded-lg bg-canvas border border-border-subtle text-sm font-medium text-ink focus:bg-surface focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-soft transition-colors"
            >
              <option value="">Semua Toko ({relevantStores.length})</option>
              {storeOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.campus_short_name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
            <span className="text-xs font-semibold text-ink-secondary">Kondisi Barang</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCondition(null)}
                className={`min-h-[40px] px-3 py-2 rounded-lg text-xs text-left border transition-colors ${
                  condition === null
                    ? 'border-brand-blue bg-brand-blue-soft text-brand-blue font-semibold'
                    : 'border-border-subtle bg-canvas text-ink-secondary'
                }`}
              >
                Semua Kondisi
              </button>
              {conditionsList.map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => setCondition(cond.id)}
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs text-left border transition-colors ${
                    condition === cond.id
                      ? 'border-brand-blue bg-brand-blue-soft text-brand-blue font-semibold'
                      : 'border-border-subtle bg-canvas text-ink-secondary'
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
            <span className="text-xs font-semibold text-ink-secondary">Rentang Harga (Rp)</span>
            <div className="flex items-center gap-2">
              <label htmlFor="min-price-mobile" className="sr-only">Harga minimum</label>
              <input
                id="min-price-mobile"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Min"
                value={minPrice}
                onChange={handleMinPriceChange}
                onKeyDown={handlePriceKeyDown}
                className="w-full h-11 px-3 rounded-lg bg-canvas border border-border-subtle text-base md:text-sm tabular-nums text-ink focus:bg-surface focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-soft transition-colors"
              />
              <span className="text-ink-muted">-</span>
              <label htmlFor="max-price-mobile" className="sr-only">Harga maksimum</label>
              <input
                id="max-price-mobile"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Maks"
                value={maxPrice}
                onChange={handleMaxPriceChange}
                onKeyDown={handlePriceKeyDown}
                className="w-full h-11 px-3 rounded-lg bg-canvas border border-border-subtle text-base md:text-sm tabular-nums text-ink focus:bg-surface focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-soft transition-colors"
              />
            </div>
            {priceError && (
              <p role="alert" className="text-xs text-danger-text font-medium">
                {priceError}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={handleResetFilters}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApplyMobileFilters}
              className="flex-1"
            >
              Terapkan Filter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
