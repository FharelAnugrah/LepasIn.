'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Building,
  Phone,
  User,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function AddressManager({ initialAddresses = [], user }) {
  const router = useRouter();
  const toast = useToast();

  const [addresses, setAddresses] = useState(initialAddresses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Form states
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Confirm delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openAddModal = () => {
    setEditingAddress(null);
    setLabel('Kost');
    setRecipientName(user?.name || '');
    setPhone(user?.phone || '');
    setAddressLine('');
    setCity('');
    setPostalCode('');
    setIsDefault(addresses.length === 0);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setRecipientName(addr.recipient_name);
    setPhone(addr.phone);
    setAddressLine(addr.address_line);
    setCity(addr.city);
    setPostalCode(addr.postal_code || '');
    setIsDefault(addr.is_default);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);

    const payload = {
      label: label.trim(),
      recipient_name: recipientName.trim(),
      phone: phone.trim(),
      address_line: addressLine.trim(),
      city: city.trim(),
      postal_code: postalCode.trim() || null,
      is_default: isDefault,
    };

    try {
      const url = editingAddress
        ? `/api/buyer/addresses/${editingAddress.id}`
        : '/api/buyer/addresses';
      const method = editingAddress ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) setFormErrors(data.details);
        toast.error(data.error || 'Gagal menyimpan alamat');
        setFormLoading(false);
        return;
      }

      toast.success(
        editingAddress ? 'Alamat berhasil diperbarui!' : 'Alamat baru berhasil ditambahkan! 🎉'
      );
      setModalOpen(false);
      setFormLoading(false);
      router.refresh();
      // Reload list
      const updatedRes = await fetch('/api/buyer/addresses');
      const updatedData = await updatedRes.json();
      if (updatedData.addresses) setAddresses(updatedData.addresses);
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan jaringan');
      setFormLoading(false);
    }
  };

  const handleSetDefault = async (addrId) => {
    try {
      const res = await fetch(`/api/buyer/addresses/${addrId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });

      if (!res.ok) {
        toast.error('Gagal mengatur alamat utama');
        return;
      }

      toast.success('Alamat utama berhasil diubah');
      router.refresh();
      const updatedRes = await fetch('/api/buyer/addresses');
      const updatedData = await updatedRes.json();
      if (updatedData.addresses) setAddresses(updatedData.addresses);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/buyer/addresses/${addressToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        toast.error('Gagal menghapus alamat');
        setDeleteLoading(false);
        return;
      }

      toast.success('Alamat berhasil dihapus');
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
      setDeleteLoading(false);
      router.refresh();
      const updatedRes = await fetch('/api/buyer/addresses');
      const updatedData = await updatedRes.json();
      if (updatedData.addresses) setAddresses(updatedData.addresses);
    } catch (err) {
      console.error(err);
      toast.error('Terjadi gangguan koneksi');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tombol Balik ke Profil */}
      <div>
        <Link
          href="/buyer/profile"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-ink-soft hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Profil</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <MapPin className="w-7 h-7 text-primary" />
              <span>Daftar Alamat Pengiriman</span>
            </h1>
            <p className="text-xs md:text-sm text-ink-soft mt-1">
              Simpan lokasi kost atau rumah untuk memudahkan saat checkout kirim langsung ke kamarmu.
            </p>
          </div>
          <Button variant="primary" pill onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span>Tambah Alamat Baru</span>
          </Button>
        </div>
      </div>

      {/* List Alamat */}
      {addresses.length === 0 ? (
        <div className="bg-canvas border border-line rounded-card p-12 text-center shadow-card max-w-md mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-ink mb-1">Belum Ada Alamat Tersimpan</h2>
          <p className="text-xs text-ink-soft mb-6 leading-relaxed">
            Tambahkan alamat kost atau tempat tinggalmu agar saat checkout tidak perlu mengetik ulang.
          </p>
          <Button variant="primary" pill onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span>Tambah Alamat Sekarang</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-canvas border rounded-card p-5 shadow-card flex flex-col justify-between gap-4 transition-all ${
                addr.is_default
                  ? 'border-primary ring-2 ring-primary/20 bg-primary-50/10'
                  : 'border-line hover:border-line-hover'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">{addr.label}</span>
                    {addr.is_default && (
                      <Badge variant="pine" size="xs">
                        Alamat Utama
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-ink mt-1">
                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{addr.recipient_name}</span>
                  <span className="text-line">·</span>
                  <Phone className="w-3.5 h-3.5 text-ink-soft shrink-0" />
                  <span className="text-ink-soft">{addr.phone}</span>
                </div>

                <p className="text-xs text-ink-soft leading-relaxed mt-1">
                  {addr.address_line}, {addr.city} {addr.postal_code || ''}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line/60 gap-2">
                <div>
                  {!addr.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Jadikan Utama
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    pill
                    onClick={() => openEditModal(addr)}
                    className="p-2 text-ink hover:bg-surface-alt"
                    title="Ubah Alamat"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    pill
                    onClick={() => {
                      setAddressToDelete(addr);
                      setDeleteDialogOpen(true);
                    }}
                    className="p-2 text-danger hover:bg-danger-50"
                    title="Hapus Alamat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah / Edit Alamat */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !formLoading && setModalOpen(false)}
        title={editingAddress ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Kost / Rumah'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveAddress} className="flex flex-col gap-4">
          <Input
            label="Label Alamat (mis. Kost Tamalanrea, Rumah Makassar)"
            placeholder="Contoh: Kost Griya Putri"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            error={formErrors.label?.[0]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nama Penerima"
              placeholder="Nama penghuni kamar kost"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              error={formErrors.recipient_name?.[0]}
              required
            />
            <Input
              label="Nomor WhatsApp / HP"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={formErrors.phone?.[0]}
              required
            />
          </div>

          <Textarea
            label="Alamat Lengkap"
            placeholder="Jalan, nomor kost, blok, nomor kamar, patokan sekitar..."
            rows={3}
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            error={formErrors.address_line?.[0]}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Kota / Kabupaten"
              placeholder="Contoh: Makassar"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={formErrors.city?.[0]}
              required
            />
            <Input
              label="Kode Pos (Opsional)"
              placeholder="90245"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              error={formErrors.postal_code?.[0]}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-primary border-line focus:ring-primary"
            />
            <span className="text-xs font-semibold text-ink">
              Jadikan sebagai alamat pengiriman utama
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line mt-2">
            <Button
              type="button"
              variant="secondary"
              pill
              disabled={formLoading}
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" pill loading={formLoading}>
              <span>{editingAddress ? 'Simpan Perubahan' : 'Tambahkan Alamat'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAddress}
        title="Hapus Alamat Ini?"
        message={`Alamat "${addressToDelete?.label}" akan dihapus dari daftar tersimpan.`}
        confirmText="Ya, Hapus Alamat"
        cancelText="Batal"
        danger
        loading={deleteLoading}
      />
    </div>
  );
}
