import { notFound } from 'next/navigation';
import { requireApprovedSeller } from '@/lib/auth';
import { query } from '@/lib/db';
import EditProductForm from './EditProductForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Edit Barang | Penjual LepasIn',
};

export default async function EditProductPage({ params }) {
  const seller = await requireApprovedSeller('/seller/products');
  const { id } = await params;
  const productId = Number(id);

  if (!productId) {
    notFound();
  }

  const storeRes = await query('SELECT id FROM stores WHERE user_id = $1', [seller.id]);
  const store = storeRes.rows[0];
  if (!store) {
    notFound();
  }

  const prodRes = await query(
    `SELECT p.id, p.name, p.description, p.price, p.original_price, p.stock, p.condition, p.category_id
     FROM products p
     WHERE p.id = $1 AND p.store_id = $2`,
    [productId, store.id]
  );

  if (prodRes.rows.length === 0) {
    notFound();
  }

  const product = prodRes.rows[0];

  const imagesRes = await query(
    `SELECT id, url, position FROM product_images WHERE product_id = $1 ORDER BY position ASC`,
    [productId]
  );
  const images = imagesRes.rows;

  const catRes = await query(`
    SELECT id, name FROM categories
    ORDER BY
      CASE
        WHEN LOWER(name) = 'lainnya' OR LOWER(name) = 'lain-lain' THEN 1
        ELSE 0
      END ASC,
      id ASC
  `);
  const categories = catRes.rows;

  return (
    <div className="flex flex-col gap-6">
      <EditProductForm product={product} images={images} categories={categories} />
    </div>
  );
}
