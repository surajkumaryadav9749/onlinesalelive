import React from 'react';
import { DealType } from '@/types';
import { Flame, Zap, TrendingDown, Tag, Sparkles, Clock } from 'lucide-react';

interface DealBadgeProps {
  type: DealType | string;
  size?: 'sm' | 'md';
}

export const DealBadge: React.FC<DealBadgeProps> = ({ type, size = 'sm' }) => {
  const getBadgeConfig = (dealType: string) => {
    switch (dealType) {
      case "Today's Deal":
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: Clock,
        };
      case 'Flash Deal':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: Zap,
        };
      case 'Price Drop':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: TrendingDown,
        };
      case 'Major Discount':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: Flame,
        };
      case 'Featured Deal':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: Sparkles,
        };
      case 'Sale':
      default:
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          icon: Tag,
        };
    }
  };

  const config = getBadgeConfig(type);
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border shadow-2xs ${config.bg} ${sizeClasses}`}
    >
      <Icon size={iconSize} />
      <span>{type}</span>
    </span>
  );
};
