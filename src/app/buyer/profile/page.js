import { requireBuyer } from '@/lib/auth';
import { query } from '@/lib/db';
import BuyerDashboardShell from '@/components/layout/BuyerDashboardShell';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Profil dan Kampus | LepasIn',
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
    <BuyerDashboardShell user={buyer} cartCount={cartCount} cartTotal={cartTotal}>
      <ProfileForm user={buyer} initialCampus={initialCampus} />
    </BuyerDashboardShell>
  );
}
