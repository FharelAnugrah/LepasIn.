'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Store,
  MapPin,
  GraduationCap,
  Package,
  Truck,
  Users,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import { ConditionBadge, formatRupiah } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function CheckoutClient({ items, defaultAddress, user }) {
  const router = useRouter();
  const toast = useToast();

  // Kelompokkan item per toko
  const groupedByStore = items.reduce((acc, item) => {
    const storeId = item.store_id;
    if (!acc[storeId]) {
      acc[storeId] = {
        storeId,
        storeName: item.store_name,
        storeLocation: item.store_location,
        campusShortName: item.campus_short_name,
        campusCity: item.campus_city,
        items: [],
      };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {});

  const storeGroups = Object.values(groupedByStore);

  // Default address string format
  const initialAddressStr = defaultAddress
    ? `${defaultAddress.address_line}, ${defaultAddress.city}${
        defaultAddress.postal_code ? ' ' + defaultAddress.postal_code : ''
      }`
    : '';

  // State form untuk tiap toko
  const [storeForms, setStoreForms] = useState(() => {
    const initial = {};
    storeGroups.forEach((g) => {
      initial[g.storeId] = {
        delivery_method: 'meetup',
        shipping_recipient: defaultAddress?.recipient_name || user?.name || '',
        shipping_phone: defaultAddress?.phone || user?.phone || '',
        shipping_address: initialAddressStr,
        note: '',
      };
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleFieldChange = (storeId, field, value) => {
    setStoreForms((prev) => ({
      ...prev,
      [storeId]: {
        ...prev[storeId],
        [field]: value,
      },
    }));
  };

  // Grand total
  const grandTotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validasi lokal sebelum kirim
    const errors = {};
    const ordersPayload = [];

    for (const group of storeGroups) {
      const form = storeForms[group.storeId];
      if (form.delivery_method === 'delivery') {
        if (!form.shipping_recipient?.trim()) {
          errors[`${group.storeId}_recipient`] = 'Nama penerima wajib diisi';
        }
        if (!form.shipping_phone?.trim()) {
          errors[`${group.storeId}_phone`] = 'Nomor telepon penerima wajib diisi';
        }
        if (!form.shipping_address?.trim()) {
          errors[`${group.storeId}_address`] = 'Alamat pengiriman kost wajib diisi';
        }
      }

      ordersPayload.push({
        store_id: group.storeId,
        delivery_method: form.delivery_method,
        shipping_recipient: form.delivery_method === 'delivery' ? form.shipping_recipient.trim() : null,
        shipping_phone: form.delivery_method === 'delivery' ? form.shipping_phone.trim() : null,
        shipping_address: form.delivery_method === 'delivery' ? form.shipping_address.trim() : null,
        note: form.note?.trim() || null,
        items: group.items.map((it) => ({
          cart_item_id: it.cart_item_id,
          product_id: it.product_id,
          quantity: it.quantity,
        })),
      });
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Mohon lengkapi formulir pengiriman yang bertanda merah');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/buyer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: ordersPayload }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat pesanan');
        setLoading(false);
        return;
      }

      const createdOrders = data.orders || [];
      const codOrder = createdOrders.find((o) => o.delivery_method === 'meetup');

      if (codOrder) {
        toast.success('Pesanan COD berhasil dibuat! Mengalihkan ke ruang chat untuk koordinasi titik temu...');
        router.push(`/chat?order_id=${codOrder.id}`);
      } else {
        toast.success('Pembayaran berhasil! Pesananmu sedang diproses oleh penjual 🎉');
        router.push('/buyer/orders');
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tombol Kembali ke Keranjang */}
      <div>
        <Link
          href="/buyer/cart"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-soft hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Keranjang</span>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-primary" />
          <span>Konfirmasi Pesanan</span>
        </h1>
        <p className="text-xs md:text-sm text-ink-soft">
          Pilih metode pengambilan atau pengiriman barang untuk masing-masing toko sekampus.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Form Pesanan per Toko (8 kolom) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {storeGroups.map((group) => {
            const form = storeForms[group.storeId];
            const storeSubtotal = group.items.reduce(
              (sum, it) => sum + it.quantity * it.price,
              0
            );

            return (
              <div
                key={group.storeId}
                className="bg-canvas border border-line rounded-card p-5 md:p-6 shadow-card flex flex-col gap-5"
              >
                {/* Header Toko */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center font-bold">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-bold text-ink">
                        {group.storeName}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-ink-soft mt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-pine">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{group.campusShortName}</span>
                        </span>
                        {group.storeLocation && (
                          <>
                            <span className="text-line">·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{group.storeLocation}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* List Barang dari Toko Ini */}
                <div className="divide-y divide-line/60">
                  {group.items.map((it) => (
                    <div key={it.cart_item_id} className="py-3 flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-xl bg-surface border border-line/60 overflow-hidden shrink-0">
                        {it.image_url ? (
                          <Image
                            src={it.image_url}
                            alt={it.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-soft">
                            <Package className="w-6 h-6 opacity-40" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs md:text-sm font-bold text-ink truncate">
                          {it.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <ConditionBadge condition={it.condition} />
                          <span className="text-xs text-ink-soft">
                            {formatRupiah(it.price)} x {it.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs md:text-sm font-extrabold text-ink">
                          {formatRupiah(it.price * it.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pemilihan Metode Penyerahan Barang */}
                <div className="pt-3 border-t border-line flex flex-col gap-3">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Pilih Metode Pengambilan / Pengiriman
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opsi 1: COD Meetup */}
                    <div
                      onClick={() => handleFieldChange(group.storeId, 'delivery_method', 'meetup')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1.5 ${
                        form.delivery_method === 'meetup'
                          ? 'border-primary bg-primary-50/50'
                          : 'border-line/70 hover:border-line bg-surface/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm font-bold text-ink flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span>COD Ketemuan di Kampus</span>
                        </span>
                        <span className="text-[10px] font-bold text-pine uppercase bg-pine-50 px-2 py-0.5 rounded-full">
                          Gratis
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-soft leading-relaxed">
                        Atur tempat ketemuan langsung dengan penjual di area kampus atau sekitar kost.
                      </p>
                    </div>

                    {/* Opsi 2: Delivery */}
                    <div
                      onClick={() => handleFieldChange(group.storeId, 'delivery_method', 'delivery')}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col gap-1.5 ${
                        form.delivery_method === 'delivery'
                          ? 'border-primary bg-primary-50/50'
                          : 'border-line/70 hover:border-line bg-surface/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm font-bold text-ink flex items-center gap-2">
                          <Truck className="w-4 h-4 text-primary" />
                          <span>Kirim ke Alamat Kost</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-soft leading-relaxed">
                        Penjual mengirimkan barang langsung ke kamar kost atau rumahmu.
                      </p>
                    </div>
                  </div>

                  {/* Formulir Alamat Kirim jika delivery dipilih */}
                  {form.delivery_method === 'delivery' && (
                    <div className="mt-3 p-4 rounded-xl bg-surface border border-line/70 flex flex-col gap-3 animate-in fade-in duration-150">
                      <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>Detail Alamat Pengiriman</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Nama Penerima"
                          placeholder="Nama lengkap penghuni kost"
                          value={form.shipping_recipient}
                          onChange={(e) =>
                            handleFieldChange(group.storeId, 'shipping_recipient', e.target.value)
                          }
                          error={formErrors[`${group.storeId}_recipient`]}
                          required
                        />
                        <Input
                          label="Nomor WhatsApp / HP"
                          placeholder="08xxxxxxxxxx"
                          value={form.shipping_phone}
                          onChange={(e) =>
                            handleFieldChange(group.storeId, 'shipping_phone', e.target.value)
                          }
                          error={formErrors[`${group.storeId}_phone`]}
                          required
                        />
                      </div>

                      <Textarea
                        label="Alamat Lengkap Kost"
                        placeholder="Contoh: Kost Griya Putri Kamar 12, Jl. Perintis Kemerdekaan KM 10, Tamalanrea, Makassar"
                        rows={2}
                        value={form.shipping_address}
                        onChange={(e) =>
                          handleFieldChange(group.storeId, 'shipping_address', e.target.value)
                        }
                        error={formErrors[`${group.storeId}_address`]}
                        required
                      />
                    </div>
                  )}

                  {/* Input Catatan untuk Penjual */}
                  <div className="mt-2">
                    <Input
                      label="Catatan untuk Penjual (Opsional)"
                      placeholder="Contoh: Tolong bungkus rapat / Ketemuan jam 14:00 di Kantin"
                      value={form.note}
                      onChange={(e) => handleFieldChange(group.storeId, 'note', e.target.value)}
                    />
                  </div>
                </div>

                {/* Subtotal Toko */}
                <div className="flex items-center justify-between pt-3 border-t border-line/60 text-xs text-ink-soft">
                  <span>Subtotal Toko:</span>
                  <span className="font-extrabold text-ink text-sm">
                    {formatRupiah(storeSubtotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Kolom Kanan: Ringkasan & Konfirmasi (4 kolom) */}
        <div className="lg:col-span-4 bg-canvas border border-line rounded-card p-6 shadow-card sticky top-20 flex flex-col gap-5">
          <h2 className="text-base font-bold text-ink border-b border-line pb-3">
            Ringkasan Pesanan
          </h2>

          <div className="flex flex-col gap-2.5 text-xs md:text-sm">
            <div className="flex items-center justify-between text-ink-soft">
              <span>Total Barang</span>
              <span className="font-bold text-ink">{items.length} macam barang</span>
            </div>
            <div className="flex items-center justify-between text-ink-soft">
              <span>Jumlah Toko</span>
              <span className="font-bold text-ink">{storeGroups.length} toko</span>
            </div>
            <div className="flex items-center justify-between text-base font-extrabold text-ink pt-3 border-t border-line">
              <span>Total Tagihan</span>
              <span className="text-primary text-xl font-black">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Banner Informasi Metode Pembayaran */}
          {Object.values(storeForms).every((f) => f.delivery_method === 'delivery') ? (
            <div className="p-3.5 rounded-xl bg-pine-50 text-pine text-xs leading-relaxed flex items-start gap-2.5 font-medium">
              <CreditCard className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Kirim ke alamat kost: Pembayaran dilakukan langsung saat checkout dan pesanan akan langsung diproses oleh penjual.
              </span>
            </div>
          ) : Object.values(storeForms).every((f) => f.delivery_method === 'meetup') ? (
            <div className="p-3.5 rounded-xl bg-primary-50 text-primary text-xs leading-relaxed flex items-start gap-2.5 font-medium">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Metode COD Kampus: Bayar langsung saat ketemuan di kampus. Kamu akan langsung dialihkan ke ruang chat untuk koordinasi.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-primary-50 text-primary text-xs leading-relaxed flex items-start gap-2.5 font-medium">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Terdapat pesanan COD dan Kirim ke Kost. Pesanan kost langsung dibayar saat checkout, dan pesanan COD dibayar saat ketemuan di kampus.
              </span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            pill
            loading={loading}
            className="w-full font-bold"
          >
            {Object.values(storeForms).every((f) => f.delivery_method === 'delivery') ? (
              <span className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4 text-white" />
                <span>Bayar Sekarang ({formatRupiah(grandTotal)})</span>
              </span>
            ) : Object.values(storeForms).every((f) => f.delivery_method === 'meetup') ? (
              <span>Konfirmasi & Buat Pesanan</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4 text-white" />
                <span>Bayar Sekarang & Buat Pesanan</span>
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
