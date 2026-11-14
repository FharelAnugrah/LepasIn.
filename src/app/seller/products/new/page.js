import { requireApprovedSeller } from '@/lib/auth';
import { query } from '@/lib/db';
import NewProductForm from './NewProductForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tambah Barang Baru — Penjual LepasIn',
};

export default async function NewProductPage() {
  await requireApprovedSeller('/seller/products/new');

  const catRes = await query('SELECT id, name FROM categories ORDER BY name ASC');
  const categories = catRes.rows;

  return (
    <div className="flex flex-col gap-6">
      <NewProductForm categories={categories} />
    </div>
  );
}
