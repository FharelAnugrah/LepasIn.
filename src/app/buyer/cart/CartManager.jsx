'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Store,
  GraduationCap,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { ConditionBadge, formatRupiah } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function CartManager({ initialItems }) {
  const router = useRouter();
  const toast = useToast();

  const [items, setItems] = useState(initialItems);
  const [loadingItemId, setLoadingItemId] = useState(null);

  // Kelompokkan item per toko
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

  // Hitung total harga dan jumlah
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    if (newQty < 1) return;
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

      setItems((prev) =>
        prev.map((it) => (it.id === cartItemId ? { ...it, quantity: newQty } : it))
      );
      setLoadingItemId(null);
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

      if (!res.ok) {
        toast.error('Gagal menghapus item dari keranjang');
        setLoadingItemId(null);
        return;
      }

      setItems((prev) => prev.filter((it) => it.id !== cartItemId));
      toast.success(`"${productName}" dihapus dari keranjang`);
      setLoadingItemId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus item');
      setLoadingItemId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-canvas border border-line rounded-card p-12 text-center max-w-lg mx-auto shadow-card my-8">
        <div className="w-20 h-20 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-ink tracking-tight mb-2">
          Keranjang Belanjamu Kosong
        </h1>
        <p className="text-xs md:text-sm text-ink-soft mb-8 leading-relaxed max-w-sm mx-auto">
          Belum ada barang kost yang kamu masukkan. Jelajahi kasur lipat, kipas, rice cooker, atau buku kuliah sekampus sekarang.
        </p>
        <Link href="/products">
          <Button variant="primary" size="lg" pill iconRight={ArrowRight}>
            Mulai Belanja Sekampus
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Kolom Kiri: Daftar Item per Toko (8 kolom) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Keranjang Belanja
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Pesanan dikelompokkan per toko agar memudahkan COD di kampus atau pengiriman.
          </p>
        </div>

        {storeGroups.map((group) => (
          <div
            key={group.storeId}
            className="bg-canvas border border-line rounded-card shadow-card overflow-hidden"
          >
            {/* Header Toko */}
            <div className="p-4 bg-surface/70 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-sm text-ink">{group.storeName}</span>
                <span className="text-line">·</span>
                <span className="text-xs font-semibold text-pine flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{group.campusShortName} ({group.campusCity})</span>
                </span>
              </div>
            </div>

            {/* List Barang dalam Toko Ini */}
            <div className="divide-y divide-line/60">
              {group.items.map((item) => {
                const isItemLoading = loadingItemId === item.id;
                return (
                  <div key={item.id} className="p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Foto Produk */}
                      <div className="relative w-18 h-18 rounded-2xl bg-surface overflow-hidden border border-line shrink-0">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.product_name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-soft/40">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Detail Nama & Harga Satuan */}
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <Link
                          href={`/products/${item.product_id}`}
                          className="font-bold text-xs md:text-sm text-ink line-clamp-1 hover:text-primary transition-colors"
                        >
                          {item.product_name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <ConditionBadge condition={item.condition} />
                          <span className="text-xs font-semibold text-ink-soft">
                            {formatRupiah(item.price)} / unit
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kontrol Jumlah & Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-line/40">
                      {/* +/- Tombol */}
                      <div className="flex items-center bg-surface rounded-full border border-line p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isItemLoading}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-ink hover:bg-canvas disabled:opacity-30 cursor-pointer"
                          aria-label="Kurangi"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-ink">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock || isItemLoading}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-ink hover:bg-canvas disabled:opacity-30 cursor-pointer"
                          aria-label="Tambah"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal Item */}
                      <div className="text-right min-w-[90px]">
                        <div className="font-extrabold text-sm text-primary">
                          {formatRupiah(item.quantity * item.price)}
                        </div>
                      </div>

                      {/* Hapus Item */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id, item.product_name)}
                        disabled={isItemLoading}
                        className="text-ink-soft hover:text-danger p-1 rounded-lg transition-colors cursor-pointer"
                        title="Hapus item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Kolom Kanan: Ringkasan Total & Tombol Checkout (4 kolom) */}
      <div className="lg:col-span-4 bg-canvas border border-line rounded-card p-6 shadow-card sticky top-20 flex flex-col gap-5">
        <h2 className="text-base font-bold text-ink border-b border-line pb-3">
          Ringkasan Belanja
        </h2>

        <div className="flex flex-col gap-2.5 text-xs md:text-sm">
          <div className="flex items-center justify-between text-ink-soft">
            <span>Total Item</span>
            <span className="font-bold text-ink">{totalItems} barang</span>
          </div>
          <div className="flex items-center justify-between text-ink-soft">
            <span>Jumlah Toko</span>
            <span className="font-bold text-ink">{storeGroups.length} toko</span>
          </div>
          <div className="flex items-center justify-between text-base font-extrabold text-ink pt-3 border-t border-line">
            <span>Total Tagihan</span>
            <span className="text-primary text-xl font-black">
              {formatRupiah(totalPrice)}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-primary-50 text-primary text-xs leading-relaxed flex items-center gap-2 font-medium">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>Bebas pilih COD di kampus atau pengiriman ke kost saat checkout.</span>
        </div>

        <Link href="/buyer/checkout" className="w-full">
          <Button variant="primary" size="lg" pill className="w-full">
            <span>Lanjut ke Pembayaran</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
