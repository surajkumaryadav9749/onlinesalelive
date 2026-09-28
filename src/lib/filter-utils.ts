import { Product, FilterOptions, SortOption } from '@/types';

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
      (p) => p.categorySlug.toLowerCase() === filters.category?.toLowerCase()
    );
  }

  // Price range
  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= (filters.minPrice ?? 0));
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= (filters.maxPrice ?? Infinity));
  }

  // Minimum discount
  if (filters.minDiscount !== undefined && filters.minDiscount > 0) {
    result = result.filter((p) => p.discountPercent >= (filters.minDiscount ?? 0));
  }

  // Rating
  if (filters.rating !== undefined && filters.rating > 0) {
    result = result.filter((p) => p.rating >= (filters.rating ?? 0));
  }

  // Deal Type
  if (filters.dealType && filters.dealType !== 'all') {
    result = result.filter(
      (p) => p.dealType.toLowerCase() === filters.dealType?.toLowerCase()
    );
  }

  // Marketplace
  if (filters.marketplace && filters.marketplace !== 'all') {
    result = result.filter((p) =>
      p.marketplaces.some(
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
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
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
