import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import AddressManager from './AddressManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Alamat Tersimpan — LepasIn',
  description: 'Kelola alamat kamar kost dan nomor kontak penerima pengiriman barang preloved.',
};

export default async function BuyerAddressesPage() {
  const buyer = await requireBuyer('/buyer/addresses');

  const addrRes = await query(
    `SELECT id, label, recipient_name, phone, address_line, city, postal_code, is_default, created_at
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [buyer.id]
  );
  const addresses = addrRes.rows;

  const cartRes = await query(
    `SELECT COUNT(ci.id)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1`,
    [buyer.id]
  );
  const cartCount = cartRes.rows[0]?.count || 0;
  const cartTotal = cartRes.rows[0]?.total || 0;

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Navbar user={buyer} cartCount={cartCount} showSearchBar={false} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        <AddressManager initialAddresses={addresses} user={buyer} />
      </main>

      <Footer />
      <BottomNav user={buyer} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
