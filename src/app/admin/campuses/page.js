import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import CampusesManager from './CampusesManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Daftar Perguruan Tinggi | Admin LepasIn',
};

export default async function AdminCampusesPage() {
  await requireAdmin();

  const res = await query(`
    SELECT cp.id, cp.name, cp.short_name, cp.city, cp.province,
           COUNT(DISTINCT u.id)::int AS user_count,
           COUNT(DISTINCT s.id)::int AS store_count
    FROM campuses cp
    LEFT JOIN users u ON u.campus_id = cp.id
    LEFT JOIN stores s ON s.campus_id = cp.id
    GROUP BY cp.id
    ORDER BY cp.name ASC
  `);

  return <CampusesManager initialCampuses={res.rows} />;
}
