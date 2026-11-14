'use client';

import { useState, useEffect, useRef } from 'react';
import { GraduationCap, ChevronDown, Search, X, Check } from 'lucide-react';

export default function CampusSelector({
  value = null, // campus id or object
  onChange,
  allowAll = true,
  allLabel = 'Semua Kampus',
  campuses: initialCampuses = null,
  className = '',
  placeholder = 'Pilih Kampus',
  label = null,
  error = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fetchedCampuses, setFetchedCampuses] = useState([]);
  const [loading, setLoading] = useState(!initialCampuses);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const campuses = initialCampuses || fetchedCampuses;

  // Fetch daftar kampus jika tidak di-pass via props
  useEffect(() => {
    if (initialCampuses) {
      return;
    }

    let isMounted = true;
    async function loadCampuses() {
      try {
        const res = await fetch('/api/campuses');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setFetchedCampuses(data.campuses || data);
          }
        }
      } catch (err) {
        console.error('Gagal memuat daftar kampus:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCampuses();

    return () => {
      isMounted = false;
    };
  }, [initialCampuses]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-fokus input pencarian saat dibuka
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Cari kampus aktif berdasarkan ID atau object
  const selectedCampus = campuses.find((c) => {
    if (typeof value === 'object' && value !== null) {
      return c.id === value.id;
    }
    return c.id === Number(value);
  });

  const filteredCampuses = campuses.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.short_name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.province && c.province.toLowerCase().includes(q))
    );
  });

  const handleSelect = (campus) => {
    if (onChange) {
      onChange(campus);
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs md:text-sm font-semibold text-ink mb-1.5">
          {label}
        </label>
      )}

      {/* Tombol Pemilih Kampus (Pill Berwarna Lembut) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 h-10 md:h-11 px-3.5 md:px-4 rounded-full border transition-all duration-150 cursor-pointer select-none text-left w-full md:w-auto ${
          selectedCampus
            ? 'bg-primary-50 border-primary/20 text-primary hover:bg-primary-50/80 font-semibold'
            : 'bg-surface border-line/80 text-ink hover:bg-surface-alt font-medium'
        } ${error ? 'border-danger ring-2 ring-danger-50' : ''}`}
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          <GraduationCap className="w-4 h-4 shrink-0 text-primary" />
          <span className="text-xs md:text-sm truncate">
            {selectedCampus
              ? `${selectedCampus.short_name} (${selectedCampus.city})`
              : allowAll
              ? allLabel
              : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-ink-soft transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}

      {/* Dropdown Menu / Panel Pencarian Kampus */}
      {isOpen && (
        <div className="fixed inset-x-4 top-20 md:absolute md:top-full md:left-0 md:inset-x-auto mt-2 w-auto md:w-80 max-h-[80vh] md:max-h-96 bg-canvas border border-line rounded-card shadow-float z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Panel & Search Bar */}
          <div className="p-3 border-b border-line bg-surface/50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-ink-soft pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari kampus atau kota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-8 text-xs md:text-sm bg-canvas border border-line rounded-full outline-none focus:border-primary focus:ring-2 focus:ring-primary-50 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 text-ink-soft hover:text-ink p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Daftar Kampus */}
          <div className="overflow-y-auto flex-1 divide-y divide-line/40 max-h-72">
            {allowAll && !search && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`w-full text-left px-4 py-2.5 text-xs md:text-sm flex items-center justify-between hover:bg-surface-alt transition-colors ${
                  !selectedCampus ? 'bg-primary-50/60 font-semibold text-primary' : 'text-ink'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>{allLabel}</span>
                </div>
                {!selectedCampus && <Check className="w-4 h-4 text-primary" />}
              </button>
            )}

            {loading ? (
              <div className="p-4 text-center text-xs text-ink-soft">
                Memuat daftar kampus...
              </div>
            ) : filteredCampuses.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-soft">
                Kampus tidak ditemukan. Coba ketik singkatan seperti UNHAS, UI, atau ITB.
              </div>
            ) : (
              filteredCampuses.map((campus) => {
                const isSelected = selectedCampus?.id === campus.id;
                return (
                  <button
                    key={campus.id}
                    type="button"
                    onClick={() => handleSelect(campus)}
                    className={`w-full text-left px-4 py-2.5 text-xs md:text-sm flex items-center justify-between hover:bg-surface-alt transition-colors ${
                      isSelected
                        ? 'bg-primary-50/60 font-semibold text-primary'
                        : 'text-ink'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{campus.short_name}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface border border-line text-ink-soft">
                          {campus.city}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-soft line-clamp-1">
                        {campus.name}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
