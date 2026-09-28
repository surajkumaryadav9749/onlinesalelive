import React from 'react';
import { ProductForm } from '@/components/admin/ProductForm';

export const metadata = {
  title: 'Add New Product | Admin CMS',
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
        <p className="text-slate-500 text-sm mt-1">
          Create a new catalog item with marketplace comparison options, pricing, and pros/cons.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}
