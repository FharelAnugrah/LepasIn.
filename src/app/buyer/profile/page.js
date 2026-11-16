import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Profil Saya — LepasIn',
};

export default async function BuyerProfilePage() {
  const buyer = await requireBuyer('/buyer/profile');

  let initialCampus = null;
  if (buyer.campus_id) {
    const campusRes = await query(
      `SELECT id, name, short_name, city, province FROM campuses WHERE id = $1`,
      [buyer.campus_id]
    );
    initialCampus = campusRes.rows[0] || null;
  }

  const cartRes = await query(
    `SELECT COALESCE(SUM(ci.quantity), 0)::int AS count, COALESCE(SUM(ci.quantity * p.price), 0)::int AS total
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        <ProfileForm user={buyer} initialCampus={initialCampus} />
      </main>

      <Footer />
      <BottomNav user={buyer} cartCount={cartCount} cartTotal={cartTotal} />
    </div>
  );
}
