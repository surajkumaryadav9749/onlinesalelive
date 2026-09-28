import React from 'react';
import { MarketplaceName } from '@/types';

interface MarketplaceBadgeProps {
  name: MarketplaceName | string;
  size?: 'sm' | 'md';
}

export const MarketplaceBadge: React.FC<MarketplaceBadgeProps> = ({ name, size = 'sm' }) => {
  const getBadgeStyle = (marketplace: string) => {
    switch (marketplace.toLowerCase()) {
      case 'amazon':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'flipkart':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'myntra':
        return 'bg-pink-50 text-pink-900 border-pink-300';
      case 'ajio':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'meesho':
        return 'bg-purple-50 text-purple-900 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${getBadgeStyle(
        name
      )} ${sizeClasses}`}
    >
      {name}
    </span>
  );
};
