import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import EditUserClient from './EditUserClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Pengguna | Admin LepasIn',
};

export default async function AdminEditUserPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const userId = Number(id);

  if (!userId) {
    notFound();
  }

  const res = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.seller_status, u.campus_id,
            c.id AS campus_id, c.name AS campus_name, c.short_name AS campus_short_name, c.city AS campus_city
     FROM users u
     LEFT JOIN campuses c ON c.id = u.campus_id
     WHERE u.id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    notFound();
  }

  const user = res.rows[0];
  const initialCampus = user.campus_id
    ? {
        id: user.campus_id,
        name: user.campus_name,
        short_name: user.campus_short_name,
        city: user.campus_city,
      }
    : null;

  return <EditUserClient user={user} initialCampus={initialCampus} />;
}
