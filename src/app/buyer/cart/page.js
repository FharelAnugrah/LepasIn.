import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import CartManager from './CartManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Keranjang Belanja — LepasIn',
};

export default async function BuyerCartPage() {
  const buyer = await requireBuyer('/buyer/cart');

  const res = await query(
    `SELECT ci.id, ci.quantity,
            p.id AS product_id, p.name AS product_name, p.price, p.stock, p.condition,
            s.id AS store_id, s.name AS store_name, s.location AS store_location,
            cp.id AS campus_id, cp.short_name AS campus_short_name, cp.city AS campus_city,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     JOIN stores s ON s.id = p.store_id
     JOIN campuses cp ON cp.id = s.campus_id
     WHERE ci.user_id = $1
     ORDER BY s.id, ci.created_at DESC`,
    [buyer.id]
  );

  const items = res.rows;
  const cartCount = items.reduce((sum, it) => sum + it.quantity, 0);
  const cartTotal = items.reduce((sum, it) => sum + it.quantity * it.price, 0);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Navbar user={buyer} cartCount={cartCount} showSearchBar={false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        <CartManager initialItems={items} />
      </main>

      <Footer />
      <BottomNav user={buyer} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
