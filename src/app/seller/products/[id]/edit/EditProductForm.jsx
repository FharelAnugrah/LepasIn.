'use client';

import ProductForm from '../../ProductForm';

export default function EditProductForm({ product, images = [], categories = [] }) {
  return (
    <ProductForm
      mode="edit"
      product={product}
      initialImages={images}
      categories={categories}
    />
  );
}
