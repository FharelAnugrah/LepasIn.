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
  Handshake,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import { ConditionBadge, formatRupiah } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

function CheckoutItemImage({ src, alt }) {
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
        sizes="56px"
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-ink-muted">
      <Package className="w-6 h-6" aria-hidden="true" />
    </div>
  );
}

function formatAddressString(addr) {
  if (!addr) return '';
  return `${addr.address_line}, ${addr.city}${addr.postal_code ? ` ${addr.postal_code}` : ''}`;
}

export default function CheckoutClient({
  items,
  defaultAddress,
  savedAddresses = [],
  user,
}) {
  const router = useRouter();
  const toast = useToast();

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

  const initialAddressStr = formatAddressString(defaultAddress);

  const [storeForms, setStoreForms] = useState(() => {
    const initial = {};
    storeGroups.forEach((g) => {
      initial[g.storeId] = {
        delivery_method: 'meetup',
        selected_address_id: defaultAddress?.id || '',
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

  const handleSavedAddressPick = (storeId, addrId) => {
    if (!addrId) {
      setStoreForms((prev) => ({
        ...prev,
        [storeId]: {
          ...prev[storeId],
          selected_address_id: '',
          shipping_recipient: user?.name || '',
          shipping_phone: user?.phone || '',
          shipping_address: '',
        },
      }));
      return;
    }

    const picked = savedAddresses.find((a) => String(a.id) === String(addrId));
    if (picked) {
      setStoreForms((prev) => ({
        ...prev,
        [storeId]: {
          ...prev[storeId],
          selected_address_id: String(picked.id),
          shipping_recipient: picked.recipient_name,
          shipping_phone: picked.phone,
          shipping_address: formatAddressString(picked),
        },
      }));
    }
  };

  const grandTotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target?.tagName === 'INPUT' && e.target.type !== 'radio') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setFormErrors({});

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
        toast.success('Pesanan COD berhasil dibuat. Mengalihkan ke ruang koordinasi...');
        router.push(`/chat?order_id=${codOrder.id}`);
      } else {
        toast.success('Pesanan berhasil dibuat dan sedang diproses penjual.');
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
      <div>
        <Link
          href="/buyer/cart"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-secondary hover:text-brand-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Keranjang</span>
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-brand-blue" aria-hidden="true" />
          <span>Checkout dan Konfirmasi Pesanan</span>
        </h1>
        <p className="text-sm text-ink-muted">
          Pilih metode COD di kampus atau pengiriman ke alamat kost untuk setiap toko.
        </p>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {storeGroups.map((group) => {
            const form = storeForms[group.storeId];
            const storeSubtotal = group.items.reduce(
              (sum, it) => sum + it.quantity * it.price,
              0
            );

            return (
              <section
                key={group.storeId}
                className="surface-3d rounded-2xl p-5 md:p-6 flex flex-col gap-5"
              >
                {/* Header Toko */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-blue-soft text-brand-blue flex items-center justify-center">
                      <Store className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base font-bold text-ink">
                        {group.storeName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted mt-0.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-blue">
                          <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{group.campusShortName}</span>
                        </span>
                        {group.storeLocation && (
                          <>
                            <span className="text-border-subtle" aria-hidden="true">|</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{group.storeLocation}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* List Barang */}
                <div className="divide-y divide-border-subtle">
                  {group.items.map((it) => (
                    <div key={it.cart_item_id} className="py-3 flex items-center gap-3 sm:gap-4">
                      <div className="relative w-14 h-14 rounded-lg bg-surface-muted border border-border-subtle overflow-hidden shrink-0">
                        <CheckoutItemImage src={it.image_url} alt={it.name} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs md:text-sm font-semibold text-ink truncate">
                          {it.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <ConditionBadge condition={it.condition} />
                          <span className="text-xs text-ink-muted tabular-nums">
                            {formatRupiah(it.price)} x {it.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs md:text-sm font-bold tabular-nums text-ink">
                          {formatRupiah(it.price * it.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Checkout Method Selector (design2.md 5.5: Handshake vs Truck, accessible radio cards) */}
                <fieldset className="pt-4 border-t border-border-subtle flex flex-col gap-3">
                  <legend className="text-xs font-bold text-ink-secondary uppercase tracking-wider mb-1">
                    Metode Penyerahan Barang
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <label
                      className={`p-4 rounded-2xl transition-all flex flex-col gap-1.5 ${
                        form.delivery_method === 'meetup'
                          ? 'card-3d-selected -translate-y-0.5'
                          : 'card-3d'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`delivery_method_${group.storeId}`}
                        value="meetup"
                        checked={form.delivery_method === 'meetup'}
                        onChange={() => handleFieldChange(group.storeId, 'delivery_method', 'meetup')}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs md:text-sm font-bold text-ink inline-flex items-center gap-2">
                          <Handshake className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
                          <span>COD / Ketemuan di Kampus</span>
                        </span>
                        <span className="text-[11px] font-semibold text-success-text bg-success-bg px-2 py-0.5 rounded-md">
                          Bebas Ongkir
                        </span>
                      </div>
                      <p className="text-xs text-ink-secondary leading-relaxed">
                        Ketemuan langsung di titik aman sekitar kampus, bayar di tempat setelah cek barang.
                      </p>
                    </label>

                    <label
                      className={`p-4 rounded-2xl transition-all flex flex-col gap-1.5 ${
                        form.delivery_method === 'delivery'
                          ? 'card-3d-selected -translate-y-0.5'
                          : 'card-3d'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`delivery_method_${group.storeId}`}
                        value="delivery"
                        checked={form.delivery_method === 'delivery'}
                        onChange={() => handleFieldChange(group.storeId, 'delivery_method', 'delivery')}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs md:text-sm font-bold text-ink inline-flex items-center gap-2">
                          <Truck className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
                          <span>Dikirim ke Alamat</span>
                        </span>
                      </div>
                      <p className="text-xs text-ink-secondary leading-relaxed">
                        Gunakan alamat kost tersimpan atau masukkan alamat pengiriman baru.
                      </p>
                    </label>
                  </div>

                  {form.delivery_method === 'delivery' && (
                    <div className="mt-2 p-4 rounded-xl bg-canvas border border-border-subtle flex flex-col gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                          <span>Alamat Pengiriman Kost</span>
                        </h3>
                        <Link
                          href="/buyer/addresses"
                          className="text-xs font-semibold text-brand-blue hover:underline"
                        >
                          Kelola Alamat
                        </Link>
                      </div>

                      {savedAddresses.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor={`saved-addr-${group.storeId}`}
                            className="text-xs font-semibold text-ink-secondary"
                          >
                            Pilih dari Alamat Tersimpan
                          </label>
                          <select
                            id={`saved-addr-${group.storeId}`}
                            value={form.selected_address_id}
                            onChange={(e) => handleSavedAddressPick(group.storeId, e.target.value)}
                            className="w-full h-11 px-3 rounded-lg bg-surface border border-border-subtle text-sm text-ink outline-none focus:border-brand-blue"
                          >
                            {savedAddresses.map((addr) => (
                              <option key={addr.id} value={addr.id}>
                                {addr.label} - {addr.recipient_name} ({addr.city})
                              </option>
                            ))}
                            <option value="">Isi alamat baru secara manual</option>
                          </select>
                        </div>
                      )}

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
                        placeholder="Contoh: Kost Griya Putri Kamar 12, Jl. Perintis Kemerdekaan KM 10, Tamalanrea"
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

                  <div className="mt-1">
                    <Input
                      label="Catatan untuk Penjual (Opsional)"
                      placeholder="Contoh: Ketemuan jam 14.00 di Pintu 1 / Tolong bungkus rapi"
                      value={form.note}
                      onChange={(e) => handleFieldChange(group.storeId, 'note', e.target.value)}
                    />
                  </div>
                </fieldset>

                <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-ink-muted">
                  <span>Subtotal Toko</span>
                  <span className="font-bold tabular-nums text-ink text-sm">
                    {formatRupiah(storeSubtotal)}
                  </span>
                </div>
              </section>
            );
          })}
        </div>

        <aside className="lg:col-span-4 surface-3d rounded-2xl p-6 flex flex-col gap-5 sticky-sidebar-panel">
          <h2 className="text-base font-bold text-ink border-b border-border-subtle pb-3">
            Ringkasan Pesanan
          </h2>

          <div className="flex flex-col gap-2.5 text-sm">
            <div className="flex items-center justify-between text-ink-secondary">
              <span>Total Barang</span>
              <span className="font-semibold text-ink tabular-nums">{items.length} jenis</span>
            </div>
            <div className="flex items-center justify-between text-ink-secondary">
              <span>Jumlah Toko</span>
              <span className="font-semibold text-ink tabular-nums">{storeGroups.length} toko</span>
            </div>
            <div className="flex items-center justify-between text-base font-bold text-ink pt-3 border-t border-border-subtle">
              <span>Total Tagihan</span>
              <span className="text-brand-blue text-xl font-bold tabular-nums tracking-tight">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {Object.values(storeForms).every((f) => f.delivery_method === 'delivery') ? (
            <div className="p-3.5 rounded-lg bg-info-bg border border-brand-blue-border text-navy-900 text-xs leading-relaxed flex items-start gap-2 font-medium">
              <CreditCard className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Kirim ke alamat: pesanan langsung masuk tahap diproses penjual setelah checkout.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-info-bg border border-brand-blue-border text-navy-900 text-xs leading-relaxed flex items-start gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Metode COD Kampus: bayar langsung di tempat setelah cek kondisi barang bersama penjual.
              </span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full rounded-xl"
          >
            {Object.values(storeForms).every((f) => f.delivery_method === 'delivery')
              ? `Bayar Sekarang (${formatRupiah(grandTotal)})`
              : 'Konfirmasi dan Buat Pesanan'}
          </Button>
        </aside>
      </form>
    </div>
  );
}
