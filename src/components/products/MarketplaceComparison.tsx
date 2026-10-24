import React from 'react';
import { MarketplaceOffer, MarketplaceName } from '@/types';
import { ExternalLink, CheckCircle2, AlertCircle, ShoppingBag, Tag } from 'lucide-react';
import { calculateDiscount } from '@/lib/deal-utils';

interface MarketplaceComparisonProps {
  marketplaces: MarketplaceOffer[];
  productName: string;
  productSlug?: string;
}

const priorityMap: Record<MarketplaceName, number> = {
  Amazon: 1,
  Flipkart: 2,
  Myntra: 3,
  AJIO: 4,
  Meesho: 5,
};

const getButtonClasses = (name: MarketplaceName, isLowest: boolean) => {
  switch (name) {
    case 'Amazon':
      return 'bg-[#FF9900] hover:bg-[#E88B00] active:bg-[#D47E00] text-slate-950 font-extrabold shadow-sm hover:shadow shadow-amber-500/20';
    case 'Flipkart':
      return 'bg-[#2874F0] hover:bg-[#1E62D0] active:bg-[#1853B4] text-white font-bold shadow-sm hover:shadow shadow-blue-500/20';
    case 'Myntra':
      return 'bg-[#FF3F6C] hover:bg-[#E82B57] active:bg-[#D31F48] text-white font-bold shadow-sm hover:shadow shadow-pink-500/20';
    case 'AJIO':
      return 'bg-[#2C4152] hover:bg-[#1D2A38] active:bg-[#131D27] text-white font-bold shadow-sm hover:shadow shadow-slate-500/20';
    case 'Meesho':
      return 'bg-[#9C1D60] hover:bg-[#861852] active:bg-[#721345] text-white font-bold shadow-sm hover:shadow shadow-purple-500/20';
    default:
      return isLowest
        ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold shadow-sm hover:shadow shadow-emerald-600/20'
        : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold shadow-sm hover:shadow shadow-orange-600/20';
  }
};

export const MarketplaceComparison: React.FC<MarketplaceComparisonProps> = ({
  marketplaces,
  productSlug,
}) => {
  // 1. Only display valid active marketplace offers with a valid numeric price > 0
  const validOffers = (marketplaces || []).filter((m) => {
    if (!m) return false;
    if (m.isActive === false) return false;
    if (typeof m.price !== 'number' || m.price <= 0) return false;
    return true;
  });

  // 2. Sort by defined marketplace priority order: Amazon, Flipkart, Myntra, AJIO, Meesho
  const sortedOffers = [...validOffers].sort((a, b) => {
    const prioA = priorityMap[a.name] ?? 99;
    const prioB = priorityMap[b.name] ?? 99;
    return prioA - prioB;
  });

  // 3. Calculate lowest price among all available in-stock offers (only when > 1 marketplace exists)
  const inStockPrices = sortedOffers
    .filter((o) => o.inStock && typeof o.price === 'number' && o.price > 0)
    .map((o) => o.price as number);

  const lowestPrice = inStockPrices.length > 1 ? Math.min(...inStockPrices) : null;

  // Fallback for empty marketplace cases (Preserves UI without breaking the page)
  if (sortedOffers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 text-center text-slate-500 shadow-2xs space-y-2">
        <div className="flex items-center justify-center gap-2 text-slate-700 font-bold text-sm">
          <ShoppingBag size={18} className="text-slate-400" />
          <span>Marketplace Price Comparison</span>
        </div>
        <p className="text-xs text-slate-500">
          Marketplace pricing is currently unavailable. Real-time store availability is syncing.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-orange-50/40 via-amber-50/20 to-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <ShoppingBag size={18} className="text-orange-600 shrink-0" />
            <span>Marketplace Price Comparison</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare verified prices across major Indian marketplaces before you buy.
          </p>
        </div>
        <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto shrink-0">
          Verified Stores
        </span>
      </div>

      {/* Marketplace Rows */}
      <div className="divide-y divide-slate-100">
        {sortedOffers.map((offer) => {
          const isLowest = lowestPrice !== null && offer.price === lowestPrice && offer.inStock;
          const hasDestination = Boolean(
            (productSlug && (offer.url !== '#' || offer.affiliateUrl)) ||
              (offer.affiliateUrl && offer.affiliateUrl !== '#') ||
              (offer.url && offer.url !== '#')
          );

          // Route through /go tracking redirect if productSlug available, otherwise direct validated destination
          const targetUrl = productSlug
            ? `/go/${offer.name.toLowerCase()}/${productSlug}`
            : offer.isAffiliate && offer.affiliateUrl && offer.affiliateUrl !== '#'
            ? offer.affiliateUrl
            : offer.url;

          const discount =
            offer.price !== null && offer.originalPrice && offer.originalPrice > offer.price
              ? calculateDiscount(offer.price, offer.originalPrice)
              : 0;

          const buttonClasses = getButtonClasses(offer.name, isLowest);

          return (
            <div
              key={offer.name}
              className={`p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 transition-colors ${
                isLowest ? 'bg-emerald-50/30' : 'hover:bg-slate-50/40'
              }`}
            >
              {/* Left / Top: Marketplace Identity & Status Indicators */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {offer.name}
                  </span>

                  {/* Lowest Price badge (calculated dynamically when > 1 marketplace exists) */}
                  {isLowest && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                      Lowest Price
                    </span>
                  )}

                  {/* Stock status indicator */}
                  {offer.inStock ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      <AlertCircle size={12} className="text-rose-600 shrink-0" />
                      Unavailable
                    </span>
                  )}

                  {/* Discount percentage */}
                  {discount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                      {discount}% OFF
                    </span>
                  )}

                  {/* Subtle affiliate indicator */}
                  {offer.isAffiliate && (
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Affiliate
                    </span>
                  )}
                </div>

                {/* Deals / Coupons / Notes if available */}
                {(offer.dealBadge || offer.couponCode || offer.couponText) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                    {offer.dealBadge && !isLowest && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {offer.dealBadge}
                      </span>
                    )}
                    {offer.couponCode && (
                      <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-mono text-[11px]">
                        <Tag size={10} />
                        Code: {offer.couponCode}
                      </span>
                    )}
                    {offer.couponText && !offer.couponCode && (
                      <span className="text-[11px] text-purple-700">
                        {offer.couponText}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right / Bottom: Pricing & Buy Button Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3.5 sm:gap-4 shrink-0 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-0">
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline sm:flex-col sm:items-end gap-1.5 sm:gap-0">
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      ₹{offer.price!.toLocaleString('en-IN')}
                    </span>
                    {offer.originalPrice && offer.originalPrice > offer.price! && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{offer.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {offer.inStock && hasDestination ? (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className={`inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all transform hover:-translate-y-0.5 shrink-0 whitespace-nowrap ${buttonClasses}`}
                    >
                      <span>Buy on {offer.name}</span>
                      <ExternalLink size={14} className="shrink-0" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shrink-0 whitespace-nowrap"
                    >
                      Unavailable
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="p-3 bg-slate-50/70 text-[11px] text-slate-500 text-center border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>Prices and stock availability are subject to change by retail merchants. Applicable coupons and terms are verified at checkout.</span>
        <span className="text-slate-300 hidden sm:inline">•</span>
        <a href="/affiliate-disclosure" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
          Affiliate Disclosure
        </a>
      </div>
    </div>
  );
};
