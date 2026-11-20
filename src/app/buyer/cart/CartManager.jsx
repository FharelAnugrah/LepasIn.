'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Store,
  GraduationCap,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Package,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { ConditionBadge, formatRupiah } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

function CartItemImage({ src, alt }) {
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
      <Package className="w-6 h-6" aria-hidden="true" />
    </div>
  );
}

export default function CartManager({ initialItems }) {
  const router = useRouter();
  const toast = useToast();

  const [items, setItems] = useState(initialItems);
  const [loadingItemId, setLoadingItemId] = useState(null);

  const groupedByStore = items.reduce((acc, item) => {
    const storeId = item.store_id;
    if (!acc[storeId]) {
      acc[storeId] = {
        storeId,
        storeName: item.store_name,
        campusShortName: item.campus_short_name,
        campusCity: item.campus_city,
        items: [],
      };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {});

  const storeGroups = Object.values(groupedByStore);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleUpdateQuantity = async (cartItemId, newQty, productName = '') => {
    if (newQty < 1) {
      return handleRemoveItem(cartItemId, productName);
    }
    setLoadingItemId(cartItemId);

    try {
      const res = await fetch(`/api/buyer/cart/${cartItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal mengubah jumlah');
        setLoadingItemId(null);
        return;
      }

      if (data.deleted) {
        setItems((prev) => prev.filter((it) => it.id !== cartItemId));
        toast.success(productName ? `"${productName}" dihapus dari keranjang` : 'Item dihapus dari keranjang');
      } else {
        setItems((prev) =>
          prev.map((it) => (it.id === cartItemId ? { ...it, quantity: newQty } : it))
        );
      }
      setLoadingItemId(null);

      if (typeof window !== 'undefined' && data) {
        window.dispatchEvent(
          new CustomEvent('cart-updated', {
            detail: {
              cartCount: data.cartCount,
              cartTotal: data.cartTotal,
            },
          })
        );
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan koneksi');
      setLoadingItemId(null);
    }
  };

  const handleRemoveItem = async (cartItemId, productName) => {
    setLoadingItemId(cartItemId);
    try {
      const res = await fetch(`/api/buyer/cart/${cartItemId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus item dari keranjang');
        setLoadingItemId(null);
        return;
      }

      setItems((prev) => prev.filter((it) => it.id !== cartItemId));
      toast.success(`"${productName}" dihapus dari keranjang`);
      setLoadingItemId(null);

      if (typeof window !== 'undefined' && data) {
        window.dispatchEvent(
          new CustomEvent('cart-updated', {
            detail: {
              cartCount: data.cartCount,
              cartTotal: data.cartTotal,
            },
          })
        );
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus item');
      setLoadingItemId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="surface-3d rounded-3xl p-10 text-center max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl icon-plinth-3d text-brand-blue flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight mb-2">
          Keranjang Belanjamu Kosong
        </h1>
        <p className="text-sm text-ink-muted mb-6 leading-relaxed max-w-sm mx-auto">
          Belum ada barang kost yang ditambahkan. Jelajahi produk preloved dari sesama Mahasiswa sekampus.
        </p>
        <Button href="/products" variant="primary" size="lg" className="rounded-xl">
          Mulai Belanja Sekampus
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Keranjang Belanja
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Barang dikelompokkan per toko agar mudah memilih COD kampus atau pengiriman ke kost.
          </p>
        </div>

        {storeGroups.map((group) => (
          <section
            key={group.storeId}
            className="surface-3d rounded-2xl overflow-hidden"
          >
            {/* Header Toko (design2.md 5.5) */}
            <div className="px-4 py-3.5 bg-canvas border-b border-border-subtle flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Store className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
                <span className="font-bold text-sm text-ink">{group.storeName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-blue-soft text-brand-blue">
                  <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{group.campusShortName}</span>
                </span>
              </div>
              <span className="text-xs text-ink-muted">{group.campusCity}</span>
            </div>

            <div className="divide-y divide-border-subtle">
              {group.items.map((item) => {
                const isItemLoading = loadingItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="relative w-18 h-18 rounded-xl bg-surface-muted overflow-hidden border border-border-subtle shrink-0">
                        <CartItemImage src={item.image_url} alt={item.product_name} />
                      </div>

                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product_id}`}
                          className="font-semibold text-sm text-ink line-clamp-1 hover:text-brand-blue transition-colors"
                        >
                          {item.product_name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <ConditionBadge condition={item.condition} />
                          <span className="text-xs font-medium text-ink-muted tabular-nums">
                            {formatRupiah(item.price)} / unit
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                      <div className="inline-flex items-center bg-canvas rounded-lg border border-border-subtle p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.product_name)}
                          disabled={isItemLoading}
                          className="w-10 h-10 md:w-8 md:h-8 rounded-md flex items-center justify-center text-ink hover:bg-surface disabled:opacity-30 transition-colors"
                          aria-label={`Kurangi jumlah ${item.product_name}`}
                        >
                          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-9 text-center font-bold tabular-nums text-xs md:text-sm text-ink">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.product_name)}
                          disabled={item.quantity >= item.stock || isItemLoading}
                          className="w-10 h-10 md:w-8 md:h-8 rounded-md flex items-center justify-center text-ink hover:bg-surface disabled:opacity-30 transition-colors"
                          aria-label={`Tambah jumlah ${item.product_name}`}
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <div className="font-bold tabular-nums text-sm text-brand-blue">
                          {formatRupiah(item.quantity * item.price)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id, item.product_name)}
                        disabled={isItemLoading}
                        className="text-ink-muted hover:text-danger-text w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-danger-bg transition-colors shrink-0"
                        title="Hapus item"
                        aria-label={`Hapus ${item.product_name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Ringkasan Belanja 3D */}
      <aside className="lg:col-span-4 surface-3d rounded-2xl p-6 flex flex-col gap-5 sticky-sidebar-panel">
        <h2 className="text-base font-bold text-ink border-b border-border-subtle pb-3">
          Ringkasan Belanja
        </h2>

        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex items-center justify-between text-ink-secondary">
            <span>Total Item</span>
            <span className="font-semibold text-ink tabular-nums">{totalItems} barang</span>
          </div>
          <div className="flex items-center justify-between text-ink-secondary">
            <span>Jumlah Toko</span>
            <span className="font-semibold text-ink tabular-nums">{storeGroups.length} toko</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold text-ink pt-3 border-t border-border-subtle">
            <span>Total Tagihan</span>
            <span className="text-brand-blue text-xl font-bold tabular-nums tracking-tight">
              {formatRupiah(totalPrice)}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-info-bg border border-brand-blue-border text-navy-900 text-xs leading-relaxed flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
          <span>Pilih COD di kampus atau pengiriman ke kost pada langkah checkout.</span>
        </div>

        <Button href="/buyer/checkout" variant="primary" size="lg" className="w-full rounded-xl">
          Lanjut ke Checkout
        </Button>
      </aside>
    </div>
  );
}
