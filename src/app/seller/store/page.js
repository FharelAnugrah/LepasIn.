import { requireApprovedSeller } from '@/lib/auth';
import { query } from '@/lib/db';
import StoreSettingsClient from './StoreSettingsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pengaturan Toko — Penjual LepasIn',
};

export default async function SellerStorePage() {
  const seller = await requireApprovedSeller();

  const storeRes = await query(
    `SELECT s.id, s.name, s.description, s.location, s.campus_id,
            cp.name AS campus_name, cp.short_name AS campus_short_name, cp.city AS campus_city
     FROM stores s
     LEFT JOIN campuses cp ON cp.id = s.campus_id
     WHERE s.user_id = $1`,
    [seller.id]
  );
  const store = storeRes.rows[0];

  const campusesRes = await query(`SELECT id, name, short_name, city, province FROM campuses ORDER BY name ASC`);

  const initialCampus = store?.campus_id
    ? {
        id: store.campus_id,
        name: store.campus_name,
        short_name: store.campus_short_name,
        city: store.campus_city,
      }
    : null;

  return (
    <StoreSettingsClient
      store={store || { name: '', location: '', description: '', campus_id: null }}
      initialCampus={initialCampus}
      campuses={campusesRes.rows}
    />
  );
}
