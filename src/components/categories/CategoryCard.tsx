import React from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import {
  Tv,
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Sparkles,
  Home,
  Watch,
  Headphones,
  ArrowRight,
} from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

const iconMap: Record<string, React.ElementType> = {
  Tv,
  Smartphone,
  Laptop,
  Shirt,
  Footprints,
  Sparkles,
  Home,
  Watch,
  Headphones,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const IconComponent = iconMap[category.icon] || Tv;

  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-orange-300 transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors duration-200 shadow-xs">
          <IconComponent size={24} />
        </div>
        <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full group-hover:bg-orange-100 group-hover:text-orange-700 transition-colors">
          {category.itemCount}+ Deals
        </span>
      </div>

      <div className="mt-4">
        <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors text-base">
          {category.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
          {category.description}
        </p>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-orange-600">
        <span>Browse deals</span>
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
};
