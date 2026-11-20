'use client';

import ProductForm from '../ProductForm';

export default function NewProductForm({ categories = [] }) {
  return <ProductForm mode="create" categories={categories} />;
}
