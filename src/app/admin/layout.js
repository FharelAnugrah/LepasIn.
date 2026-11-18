import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import AdminSidebar from './AdminSidebar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard Admin — LepasIn',
  description: 'Panel moderasi dan manajemen nasional LepasIn.',
};

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();

  let pendingCount = 0;
  try {
    const res = await query(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'seller' AND seller_status = 'pending'`
    );
    pendingCount = res.rows[0]?.count || 0;
  } catch (err) {
    console.error('Error fetching pending count for admin layout:', err);
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row">
      <AdminSidebar user={admin} pendingCount={pendingCount} />
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main className="p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
