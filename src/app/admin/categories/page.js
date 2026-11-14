import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import CategoriesManager from './CategoriesManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kategori Produk — Admin LepasIn',
};

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const res = await query(`
    SELECT c.id, c.name, c.created_at, COUNT(p.id)::int AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.id ASC
  `);

  return <CategoriesManager initialCategories={res.rows} />;
}
