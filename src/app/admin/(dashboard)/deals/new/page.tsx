import React from 'react';
import { DealForm } from '@/components/admin/DealForm';

export const metadata = {
  title: 'Add New Deal | Admin CMS',
};

export default function NewDealPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add New Deal</h1>
        <p className="text-slate-500 text-sm mt-1">
          Promote limited-time discounts, flash offers, and marketplace price cuts.
        </p>
      </div>

      <DealForm />
    </div>
  );
}
