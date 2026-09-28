import React from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = 'No products found matching your criteria.',
}) => {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 my-6">
        <p className="text-base text-slate-600 font-medium">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-1">Try clearing some filters or searching with different terms.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
