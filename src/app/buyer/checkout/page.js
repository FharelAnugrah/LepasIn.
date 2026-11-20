import { redirect } from 'next/navigation';
import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Checkout dan Konfirmasi Pesanan | LepasIn',
};

export default async function BuyerCheckoutPage() {
  const buyer = await requireBuyer('/buyer/checkout');

  const cartRes = await query(
    `SELECT ci.id AS cart_item_id, ci.quantity, ci.product_id,
            p.name, p.price, p.stock, p.condition,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url,
            s.id AS store_id, s.name AS store_name, s.location AS store_location,
            cp.short_name AS campus_short_name, cp.city AS campus_city
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN stores s ON s.id = p.store_id
     JOIN campuses cp ON cp.id = s.campus_id
     WHERE ci.user_id = $1
     ORDER BY s.id, ci.created_at ASC`,
    [buyer.id]
  );

  const cartItems = cartRes.rows;

  if (cartItems.length === 0) {
    redirect('/buyer/cart');
  }

  const addressRes = await query(
    `SELECT id, label, recipient_name, phone, address_line, city, postal_code, is_default
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [buyer.id]
  );
  const savedAddresses = addressRes.rows;
  const defaultAddress = savedAddresses.find((a) => a.is_default) || savedAddresses[0] || null;

  const cartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const cartTotal = cartItems.reduce((acc, it) => acc + it.quantity * it.price, 0);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Navbar user={buyer} cartCount={cartCount} showSearchBar={false} />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 outline-none"
      >
        <CheckoutClient
          items={cartItems}
          defaultAddress={defaultAddress}
          savedAddresses={savedAddresses}
          user={buyer}
        />
      </main>

      <Footer />
      <BottomNav user={buyer} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
