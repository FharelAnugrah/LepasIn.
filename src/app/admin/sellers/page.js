import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import SellersManager from './SellersManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Verifikasi Penjual | Admin LepasIn',
};

export default async function AdminSellersPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const initialStatus = sp?.status || 'all';

  const res = await query(`
    SELECT u.id, u.name, u.email, u.phone, u.seller_status,
           COALESCE(u.was_approved, false) AS was_approved,
           u.id_card_url,
           u.created_at,
           s.id AS store_id, s.name AS store_name, s.location, s.description,
           c.id AS campus_id, c.name AS campus_name, c.short_name AS campus_short_name, c.city AS campus_city
    FROM users u
    LEFT JOIN stores s ON s.user_id = u.id
    LEFT JOIN campuses c ON c.id = u.campus_id
    WHERE u.role = 'seller'
    ORDER BY
      CASE WHEN u.seller_status = 'pending' THEN 0 ELSE 1 END,
      u.created_at DESC
  `);

  return <SellersManager initialSellers={res.rows} initialStatus={initialStatus} />;
}
