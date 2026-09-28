/**
 * Utilities for discount calculations and dynamic deal lifecycle/expiry states.
 */

export type DynamicDealStatus = 'active' | 'upcoming' | 'expired' | 'inactive';

/**
 * Mathematically calculate discount percentage using stored prices as the single source of truth.
 * Ensures originalPrice > currentPrice > 0, rounds to integer, prevents division by zero or negative values.
 */
export function calculateDiscount(currentPrice: number, originalPrice: number): number {
  if (
    typeof currentPrice !== 'number' ||
    typeof originalPrice !== 'number' ||
    isNaN(currentPrice) ||
    isNaN(originalPrice) ||
    originalPrice <= 0 ||
    currentPrice <= 0 ||
    originalPrice <= currentPrice
  ) {
    return 0;
  }

  const percent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  return Math.min(Math.max(percent, 0), 99);
}

/**
 * Determine deal status dynamically based on active flag and temporal dates.
 */
export function getDealStatus(deal: {
  isActive?: boolean;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  status?: string;
}): DynamicDealStatus {
  if (deal.isActive === false) {
    return 'inactive';
  }

  const now = new Date();

  if (deal.startDate) {
    const start = new Date(deal.startDate);
    if (!isNaN(start.getTime()) && now < start) {
      return 'upcoming';
    }
  }

  if (deal.endDate) {
    const end = new Date(deal.endDate);
    if (!isNaN(end.getTime()) && now > end) {
      return 'expired';
    }
  }

  return 'active';
}

/**
 * Helper to check if a deal should be visible on public deals/sale pages.
 */
export function isDealCurrentlyActive(deal: {
  isActive?: boolean;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  status?: string;
}): boolean {
  return getDealStatus(deal) === 'active';
}
