'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  GraduationCap,
  ChevronDown,
  Filter,
  Check,
} from 'lucide-react';
import CampusSelector from '@/components/ui/CampusSelector';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import Modal from '@/components/ui/Modal';
import { formatRupiah } from '@/components/ui/Badge';

export default function ProductCatalog({
  initialProducts,
  pagination,
  filters,
  categories,
  campuses,
  user,
  wishlistIds = [],
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Local state for filters
  const [q, setQ] = useState(filters.q || '');
  const [campus, setCampus] = useState(
    campuses.find((c) => c.id === Number(filters.campus)) || null
  );
  const [category, setCategory] = useState(filters.category ? Number(filters.category) : null);
  const [condition, setCondition] = useState(filters.condition || null);
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');
  const [sort, setSort] = useState(filters.sort || 'latest');

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

  // Fungsi navigasi memperbarui URL params
  const applyFilters = (newParams = {}) => {
    const params = new URLSearchParams();

    const currentFilters = {
      q: newParams.q !== undefined ? newParams.q : q,
      campus: newParams.campus !== undefined ? newParams.campus?.id : campus?.id,
      category: newParams.category !== undefined ? newParams.category : category,
      condition: newParams.condition !== undefined ? newParams.condition : condition,
      minPrice: newParams.minPrice !== undefined ? newParams.minPrice : minPrice,
      maxPrice: newParams.maxPrice !== undefined ? newParams.maxPrice : maxPrice,
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
    if (currentFilters.condition) {
      params.set('condition', currentFilters.condition);
    }
    if (currentFilters.minPrice) {
      params.set('minPrice', currentFilters.minPrice);
    }
    if (currentFilters.maxPrice) {
      params.set('maxPrice', currentFilters.maxPrice);
    }
    if (currentFilters.sort && currentFilters.sort !== 'latest') {
      params.set('sort', currentFilters.sort);
    }
    if (currentFilters.page && currentFilters.page > 1) {
      params.set('page', currentFilters.page);
    }

    router.push(`${pathname}?${params.toString()}`);
    setMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    setQ('');
    setCampus(null);
    setCategory(null);
    setCondition(null);
    setMinPrice('');
    setMaxPrice('');
    setSort('latest');
    router.push(pathname);
    setMobileFilterOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters({ q, page: 1 });
  };

  const activeFiltersCount = [
    q,
    campus,
    category,
    condition,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Bar Atas: Pencarian, Selektor Sort, dan Tombol Filter Mobile */}
      <div className="bg-canvas border border-line rounded-card p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Form Pencarian */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari kasur, laptop, buku kuliah..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full h-11 pl-10 pr-10 text-xs md:text-sm bg-surface rounded-full border border-line/80 focus:bg-canvas focus:border-primary focus:ring-4 focus:ring-primary-50 outline-none transition"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                applyFilters({ q: '', page: 1 });
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          {/* Tombol Buka Filter di Mobile */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-4 rounded-full border border-line bg-surface text-ink text-xs font-bold hover:bg-surface-alt transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Pemilih Urutan (Sorting) */}
          <div className="relative flex-1 md:flex-none">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                applyFilters({ sort: e.target.value, page: 1 });
              }}
              className="w-full md:w-auto h-11 pl-4 pr-9 rounded-full bg-surface border border-line/80 text-xs md:text-sm font-semibold text-ink appearance-none cursor-pointer outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 transition"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-ink-soft absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Konten Utama: Sidebar Filter Desktop + Grid Produk */}
      <div className="flex items-start gap-6">
        {/* Sidebar Filter Desktop (Lebar 270px) */}
        <aside className="hidden lg:flex flex-col gap-6 w-68 shrink-0 bg-canvas border border-line rounded-card p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2 font-bold text-ink text-sm">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Filter Produk</span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Filter 1: Kampus Se-Indonesia */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-pine" />
              <span>Kampus Indonesia</span>
            </label>
            <CampusSelector
              value={campus}
              onChange={(c) => {
                setCampus(c);
                applyFilters({ campus: c, page: 1 });
              }}
              campuses={campuses}
              allowAll={true}
              allLabel="Seluruh Kampus Indonesia"
              className="w-full"
            />
          </div>

          {/* Filter 2: Kategori */}
          <div className="flex flex-col gap-2 border-t border-line/60 pt-4">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Kategori Belanja
            </label>
            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  setCategory(null);
                  applyFilters({ category: null, page: 1 });
                }}
                className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg text-left transition ${
                  category === null
                    ? 'bg-primary-50 text-primary font-bold'
                    : 'text-ink-soft hover:text-ink hover:bg-surface'
                }`}
              >
                <span>Semua Kategori</span>
                {category === null && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      applyFilters({ category: cat.id, page: 1 });
                    }}
                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg text-left transition ${
                      isSelected
                        ? 'bg-primary-50 text-primary font-bold'
                        : 'text-ink-soft hover:text-ink hover:bg-surface'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 3: Kondisi Barang */}
          <div className="flex flex-col gap-2 border-t border-line/60 pt-4">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Kondisi Barang
            </label>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setCondition(null);
                  applyFilters({ condition: null, page: 1 });
                }}
                className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg text-left transition ${
                  condition === null
                    ? 'bg-primary-50 text-primary font-bold'
                    : 'text-ink-soft hover:text-ink hover:bg-surface'
                }`}
              >
                <span>Semua Kondisi</span>
                {condition === null && <Check className="w-3.5 h-3.5 text-primary" />}
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
                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg text-left transition ${
                      isSelected
                        ? 'bg-primary-50 text-primary font-bold'
                        : 'text-ink-soft hover:text-ink hover:bg-surface'
                    }`}
                  >
                    <span>{cond.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 4: Rentang Harga */}
          <div className="flex flex-col gap-2 border-t border-line/60 pt-4">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Rentang Harga (Rp)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface border border-line text-xs outline-none focus:border-primary"
              />
              <span className="text-ink-soft text-xs">-</span>
              <input
                type="number"
                placeholder="Maks"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface border border-line text-xs outline-none focus:border-primary"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              pill
              onClick={() => applyFilters({ minPrice, maxPrice, page: 1 })}
              className="mt-1 w-full"
            >
              Terapkan Harga
            </Button>
          </div>
        </aside>

        {/* Kolom Kanan: Daftar Produk & Pagination */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Header Jumlah Hasil & Filter Aktif Ringkas */}
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <div>
              Menampilkan{' '}
              <span className="font-bold text-ink">
                {initialProducts.length}
              </span>{' '}
              dari <span className="font-bold text-ink">{pagination.total}</span> produk
              {campus && (
                <span>
                  {' '}
                  di <span className="font-bold text-pine">{campus.short_name}</span>
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-primary font-bold hover:underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          {/* Grid Produk */}
          {initialProducts.length === 0 ? (
            <div className="bg-canvas border border-line rounded-card p-12 text-center flex flex-col items-center justify-center shadow-card">
              <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center mb-4">
                <Search className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h2 className="text-base font-bold text-ink">
                Produk Tidak Ditemukan
              </h2>
              <p className="text-xs md:text-sm text-ink-soft max-w-sm mt-1 mb-5 leading-relaxed">
                Tidak ada barang preloved yang cocok dengan kriteria filter kampus atau pencarianmu.
              </p>
              <Button variant="primary" pill onClick={handleResetFilters}>
                Bersihkan Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4.5">
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="secondary"
                size="sm"
                pill
                disabled={pagination.page <= 1}
                onClick={() => applyFilters({ page: pagination.page - 1 })}
              >
                Sebelumnya
              </Button>

              <div className="flex items-center gap-1.5">
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
                        {isGap && <span className="text-ink-soft px-1">...</span>}
                        <button
                          type="button"
                          onClick={() => applyFilters({ page: p })}
                          className={`w-9 h-9 rounded-full text-xs font-bold transition cursor-pointer ${
                            pagination.page === p
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface text-ink hover:bg-surface-alt'
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
                pill
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => applyFilters({ page: pagination.page + 1 })}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Filter untuk Mobile (Bottom Sheet) */}
      <Modal
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter & Urutkan Produk"
      >
        <div className="flex flex-col gap-5 py-2">
          {/* Kampus */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-ink">Kampus di Seluruh Indonesia</label>
            <CampusSelector
              value={campus}
              onChange={setCampus}
              campuses={campuses}
              allowAll={true}
              allLabel="Seluruh Kampus Indonesia"
              className="w-full"
            />
          </div>

          {/* Kategori */}
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <label className="text-xs font-bold text-ink">Kategori</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`p-2 rounded-xl text-xs text-left border ${
                  category === null
                    ? 'border-primary bg-primary-50 text-primary font-bold'
                    : 'border-line text-ink'
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`p-2 rounded-xl text-xs text-left border ${
                    category === c.id
                      ? 'border-primary bg-primary-50 text-primary font-bold'
                      : 'border-line text-ink'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Kondisi */}
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <label className="text-xs font-bold text-ink">Kondisi Barang</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setCondition(null)}
                className={`p-2 rounded-xl text-xs text-left border ${
                  condition === null
                    ? 'border-primary bg-primary-50 text-primary font-bold'
                    : 'border-line text-ink'
                }`}
              >
                Semua Kondisi
              </button>
              {conditionsList.map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => setCondition(cond.id)}
                  className={`p-2 rounded-xl text-xs text-left border ${
                    condition === cond.id
                      ? 'border-primary bg-primary-50 text-primary font-bold'
                      : 'border-line text-ink'
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>

          {/* Harga */}
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <label className="text-xs font-bold text-ink">Rentang Harga (Rp)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-line text-xs outline-none"
              />
              <span className="text-ink-soft">-</span>
              <input
                type="number"
                placeholder="Maks"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface border border-line text-xs outline-none"
              />
            </div>
          </div>

          {/* Tombol Aksi Modal Mobile */}
          <div className="flex items-center gap-3 pt-3 border-t border-line">
            <Button
              variant="secondary"
              pill
              onClick={handleResetFilters}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              pill
              onClick={() => applyFilters()}
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
