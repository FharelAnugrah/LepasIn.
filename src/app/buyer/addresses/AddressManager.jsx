'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
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
import { preventEnterSubmitOnInput } from '@/lib/form-utils';

export default function AddressManager({ initialAddresses = [], user }) {
  const router = useRouter();
  const toast = useToast();

  const [addresses, setAddresses] = useState(initialAddresses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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
    if (formLoading) return;
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
        editingAddress ? 'Alamat berhasil diperbarui.' : 'Alamat baru berhasil ditambahkan.'
      );
      setModalOpen(false);
      setFormLoading(false);
      router.refresh();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-brand-blue" aria-hidden="true" />
            <span>Daftar Alamat Kost</span>
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Simpan lokasi kost atau rumah untuk mempercepat checkout pengiriman.
          </p>
        </div>
        <Button variant="primary" onClick={openAddModal} icon={Plus}>
          Tambah Alamat Baru
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="surface-3d rounded-2xl p-10 text-center max-w-md mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl icon-plinth-3d text-brand-blue flex items-center justify-center mx-auto mb-4">
            <Building className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-ink mb-1">Belum Ada Alamat Tersimpan</h2>
          <p className="text-xs md:text-sm text-ink-muted mb-5 leading-relaxed">
            Tambahkan alamat kost atau tempat tinggalmu agar tidak perlu mengetik ulang saat checkout.
          </p>
          <Button variant="primary" onClick={openAddModal} icon={Plus}>
            Tambah Alamat Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors ${
                addr.is_default
                  ? 'card-3d-selected'
                  : 'card-3d'
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-ink">{addr.label}</span>
                    {addr.is_default && (
                      <Badge variant="primary" size="xs">
                        Alamat Utama
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-ink mt-1">
                  <User className="w-3.5 h-3.5 text-brand-blue shrink-0" aria-hidden="true" />
                  <span>{addr.recipient_name}</span>
                  <span className="text-border-subtle" aria-hidden="true">|</span>
                  <Phone className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
                  <span className="text-ink-secondary tabular-nums">{addr.phone}</span>
                </div>

                <p className="text-xs text-ink-secondary leading-relaxed mt-1">
                  {addr.address_line}, {addr.city} {addr.postal_code || ''}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-subtle gap-2">
                <div>
                  {!addr.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs font-semibold text-brand-blue hover:underline py-1"
                    >
                      Jadikan Utama
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => openEditModal(addr)}
                    aria-label={`Ubah alamat ${addr.label}`}
                    title="Ubah Alamat"
                  >
                    <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setAddressToDelete(addr);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-danger-text hover:bg-danger-bg"
                    aria-label={`Hapus alamat ${addr.label}`}
                    title="Hapus Alamat"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Hapus</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !formLoading && setModalOpen(false)}
        title={editingAddress ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Kost / Rumah'}
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={handleSaveAddress}
          onKeyDown={preventEnterSubmitOnInput}
          className="flex flex-col gap-4"
        >
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

          <label className="flex items-center gap-2.5 mt-1 min-h-[40px]">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded accent-brand-blue border-border-subtle"
            />
            <span className="text-xs font-semibold text-ink">
              Jadikan sebagai alamat pengiriman utama
            </span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-4 border-t border-border-subtle mt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={formLoading}
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={formLoading} className="w-full sm:w-auto">
              {editingAddress ? 'Simpan Perubahan' : 'Tambahkan Alamat'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAddress}
        title="Hapus Alamat Ini?"
        message={`Alamat "${addressToDelete?.label}" akan dihapus dari daftar tersimpan.`}
        confirmText="Ya, Hapus Alamat"
        cancelText="Batal"
        confirmVariant="danger"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
