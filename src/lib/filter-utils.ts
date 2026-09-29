import { Product, FilterOptions, SortOption } from '@/types';

export interface DiscountOption {
  value: number; // 10, 20, 30, 40, 50, 60, 70, 80, 90
  label: string; // '10% OFF', '20% OFF', ..., '90%+ OFF'
  min: number;
  max?: number;
}

export const PRODUCT_DISCOUNT_OPTIONS: DiscountOption[] = [
  { value: 10, label: '10% OFF', min: 10, max: 20 },
  { value: 20, label: '20% OFF', min: 20, max: 30 },
  { value: 30, label: '30% OFF', min: 30, max: 40 },
  { value: 40, label: '40% OFF', min: 40, max: 50 },
  { value: 50, label: '50% OFF', min: 50, max: 60 },
  { value: 60, label: '60% OFF', min: 60, max: 70 },
  { value: 70, label: '70% OFF', min: 70, max: 80 },
  { value: 80, label: '80% OFF', min: 80, max: 90 },
  { value: 90, label: '90%+ OFF', min: 90 },
];

/**
 * Check if a discount percentage falls into the specified non-overlapping range.
 * 10% OFF: 10 <= discount < 20
 * 20% OFF: 20 <= discount < 30
 * ...
 * 80% OFF: 80 <= discount < 90
 * 90%+ OFF: discount >= 90
 *
 * Edge cases: 0, negative, null, undefined, NaN always return false.
 */
export function matchesDiscountRange(discountPercent: number | undefined | null, rangeValue: number): boolean {
  if (discountPercent === undefined || discountPercent === null || typeof discountPercent !== 'number' || isNaN(discountPercent)) {
    return false;
  }
  if (discountPercent <= 0 || discountPercent > 100) {
    return false;
  }
  if (rangeValue >= 90) {
    return discountPercent >= 90;
  }
  return discountPercent >= rangeValue && discountPercent < rangeValue + 10;
}

// ================= Client-Safe Filter & Sort Engine =================
export function filterAndSortProducts(
  items: Product[],
  filters: FilterOptions,
  sortBy: SortOption = 'popular'
): Product[] {
  let result = [...items];

  // Category filter
  if (filters.category && filters.category !== 'all') {
    result = result.filter(
      (p) => (p.categorySlug || p.category || '').toLowerCase() === filters.category?.toLowerCase()
    );
  }

  // Price range
  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= (filters.minPrice ?? 0));
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((p) =>
      filters.maxPriceExclusive
        ? p.price < (filters.maxPrice ?? Infinity)
        : p.price <= (filters.maxPrice ?? Infinity)
    );
  }

  // Product Discount Range (10% OFF, 20% OFF, ... 90%+ OFF)
  if (filters.discountRange !== undefined) {
    result = result.filter((p) => matchesDiscountRange(p.discountPercent, filters.discountRange!));
  } else if (filters.discountMin !== undefined || filters.discountMax !== undefined) {
    const min = filters.discountMin ?? 0;
    const max = filters.discountMax ?? Infinity;
    result = result.filter((p) => {
      const dp = p.discountPercent ?? 0;
      if (dp <= 0 || dp > 100) return false;
      return dp >= min && dp < max;
    });
  } else if (filters.minDiscount !== undefined && filters.minDiscount > 0) {
    result = result.filter((p) => {
      const dp = p.discountPercent ?? 0;
      return dp > 0 && dp <= 100 && dp >= (filters.minDiscount ?? 0);
    });
  }

  // Rating
  if (filters.rating !== undefined && filters.rating > 0) {
    result = result.filter((p) => (p.rating ?? 0) >= (filters.rating ?? 0));
  }

  // Deal Type
  if (filters.dealType && filters.dealType !== 'all') {
    result = result.filter(
      (p) => (p.dealType || '').toLowerCase() === filters.dealType?.toLowerCase()
    );
  }

  // Marketplace
  if (filters.marketplace && filters.marketplace !== 'all') {
    result = result.filter((p) =>
      (p.marketplaces || []).some(
        (m) =>
          m.name.toLowerCase() === filters.marketplace?.toLowerCase() &&
          m.price !== null &&
          m.inStock
      )
    );
  }

  // Search query
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const q = filters.searchQuery.toLowerCase();
    result = result.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
    );
  }

  // Sorting
  switch (sortBy) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'discount-desc':
      result.sort((a, b) => b.discountPercent - a.discountPercent);
      break;
    case 'rating-desc':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
      result.reverse();
      break;
    case 'oldest':
      // Chronological order (original ascending order)
      break;
    case 'popular':
    default:
      // Keep original priority
      break;
  }

  return result;
}
