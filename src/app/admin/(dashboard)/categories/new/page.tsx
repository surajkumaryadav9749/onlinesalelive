import React from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Create New Category"
        subtitle="Add a new shopping category to the taxonomy"
      />
      <CategoryForm />
    </div>
  );
}
