'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, GraduationCap, ChevronDown, Search, X, Check } from 'lucide-react';

export default function CampusSelector({
  value = null,
  onChange,
  allowAll = true,
  allLabel = 'Semua Kampus',
  campuses: initialCampuses = null,
  className = '',
  placeholder = 'Pilih Kampus',
  label = null,
  error = null,
  fullWidth = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fetchedCampuses, setFetchedCampuses] = useState([]);
  const [loading, setLoading] = useState(!initialCampuses);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  const campuses = initialCampuses || fetchedCampuses;

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedCampus =
    campuses.find((c) => {
      if (typeof value === 'object' && value !== null) {
        return c.id === value.id;
      }
      return c.id === Number(value);
    }) ||
    (typeof value === 'object' && value !== null && value.id && value.short_name
      ? value
      : null);

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
    triggerRef.current?.focus();
  };

  return (
    <div className={`relative min-w-0 ${className}`} ref={containerRef}>
      {label && (
        <span className="block text-sm font-medium text-ink-secondary mb-1.5">
          {label}
        </span>
      )}

      {/* Campus Selector Pill 3D */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`btn-3d inline-flex items-center justify-between gap-2 min-h-[44px] md:min-h-[38px] px-3.5 py-1.5 rounded-full select-none text-left ${
          fullWidth ? 'w-full' : 'w-full md:w-auto'
        } max-w-full min-w-0 ${
          selectedCampus
            ? 'nav-pill-3d-active font-semibold hover:-translate-y-0.5 active:translate-y-0.5'
            : 'chip-3d font-medium'
        } ${error ? 'border-danger-text ring-2 ring-danger-bg' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <MapPin className="w-4 h-4 shrink-0 text-brand-blue" aria-hidden="true" />
          <span className="text-xs md:text-sm truncate">
            {selectedCampus
              ? `${selectedCampus.short_name} ${selectedCampus.city}`
              : allowAll
              ? allLabel
              : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-ink-muted transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {error && (
        <p role="alert" className="text-xs text-danger-text font-medium mt-1">
          {error}
        </p>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-ink/40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="listbox"
            aria-label="Pilih kampus di Indonesia"
            className="fixed inset-x-3 sm:inset-x-4 top-16 sm:top-20 md:absolute md:top-full md:left-0 md:inset-x-auto md:mt-2 w-auto md:w-80 max-h-[min(72dvh,24rem)] dropdown-3d rounded-2xl z-[60] flex flex-col overflow-hidden"
          >
            <div className="p-3 border-b border-border-subtle bg-canvas">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-ink-subtle pointer-events-none" aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari nama, singkatan, atau kota..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="w-full h-10 md:h-9 pl-9 pr-8 text-base md:text-sm bg-surface-muted text-ink placeholder:text-ink-subtle border border-border-subtle rounded-full outline-none focus:bg-surface focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-soft transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Bersihkan pencarian kampus"
                    className="absolute right-2.5 text-ink-subtle hover:text-ink p-1"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-border-subtle/60 max-h-72">
              {allowAll && (!search.trim() || allLabel.toLowerCase().includes(search.trim().toLowerCase())) && (
                <button
                  type="button"
                  role="option"
                  aria-selected={!selectedCampus}
                  onClick={() => handleSelect(null)}
                  className={`w-full text-left px-4 py-3 text-xs md:text-sm flex items-center justify-between hover:bg-canvas transition-colors ${
                    !selectedCampus ? 'bg-brand-blue-soft font-semibold text-brand-blue' : 'text-ink'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-brand-blue" aria-hidden="true" />
                    <span>{allLabel}</span>
                  </div>
                  {!selectedCampus && <Check className="w-4 h-4 text-brand-blue" aria-hidden="true" />}
                </button>
              )}

              {loading ? (
                <div className="p-4 text-center text-xs text-ink-muted">
                  Memuat daftar kampus...
                </div>
              ) : filteredCampuses.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink-muted">
                  Kampus tidak ditemukan. Coba ketik singkatan seperti UNHAS, UI, atau ITB.
                </div>
              ) : (
                filteredCampuses.map((campus) => {
                  const isSelected = selectedCampus?.id === campus.id;
                  return (
                    <button
                      key={campus.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(campus)}
                      className={`w-full text-left px-4 py-2.5 text-xs md:text-sm flex items-center justify-between hover:bg-canvas transition-colors ${
                        isSelected
                          ? 'bg-brand-blue-soft font-semibold text-brand-blue'
                          : 'text-ink'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">{campus.short_name}</span>
                          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-canvas border border-border-subtle text-ink-secondary">
                            {campus.city}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-muted line-clamp-1 mt-0.5">
                          {campus.name}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-blue shrink-0 ml-2" aria-hidden="true" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
