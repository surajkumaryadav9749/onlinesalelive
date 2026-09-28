import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { Deal, IDeal } from '@/models/Deal';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DealForm, DealFormData } from '@/components/admin/DealForm';
import { isValidId } from '@/lib/api-helpers';

interface EditDealProps {
  params: Promise<{ id: string }>;
}

export default async function EditDealPage({ params }: EditDealProps) {
  const { id } = await params;
  await connectToDatabase();

  const query = isValidId(id) ? { _id: id } : { slug: id.toLowerCase() };
  const deal = await Deal.findOne(query).lean<IDeal>();

  if (!deal) {
    notFound();
  }

  const initialData: DealFormData = {
    _id: String(deal._id),
    title: deal.title,
    slug: deal.slug,
    description: deal.description || '',
    image: deal.image || '',
    currentPrice: deal.currentPrice,
    originalPrice: deal.originalPrice,
    discountPercent: deal.discountPercent,
    marketplace: deal.marketplace,
    marketplaceUrl: deal.marketplaceUrl || '#',
    dealType: deal.dealType || "Today's Deal",
    endsIn: deal.endsIn || 'Limited time',
    status: deal.status || 'active',
    isFeatured: Boolean(deal.isFeatured),
    verified: Boolean(deal.verified),
    isActive: deal.isActive !== false,
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Edit Deal: ${deal.title}`}
        subtitle={`ID: ${deal._id} • ${deal.marketplace}`}
      />
      <DealForm initialData={initialData} isEdit={true} />
    </div>
  );
}
