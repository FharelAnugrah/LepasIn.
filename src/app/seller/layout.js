import { requireApprovedSeller } from '@/lib/auth';
import { query } from '@/lib/db';
import SellerSidebar from './SellerSidebar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard Penjual | LepasIn',
};

export default async function SellerLayout({ children }) {
  const seller = await requireApprovedSeller();

  const storeRes = await query(`SELECT id, name, location FROM stores WHERE user_id = $1`, [
    seller.id,
  ]);
  const store = storeRes.rows[0];

  let newOrdersCount = 0;
  if (store) {
    const ordersRes = await query(
      `SELECT COUNT(*)::int AS count FROM orders WHERE store_id = $1 AND status IN ('pending_payment', 'processing')`,
      [store.id]
    );
    newOrdersCount = ordersRes.rows[0]?.count || 0;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink flex flex-col lg:flex-row">
      <SellerSidebar user={seller} store={store} newOrdersCount={newOrdersCount} />
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
