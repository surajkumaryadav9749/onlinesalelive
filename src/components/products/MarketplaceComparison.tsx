import React from 'react';
import { MarketplaceOffer } from '@/types';
import { ExternalLink, CheckCircle, AlertCircle, ShoppingBag, Tag } from 'lucide-react';
import { calculateDiscount } from '@/lib/deal-utils';

interface MarketplaceComparisonProps {
  marketplaces: MarketplaceOffer[];
  productName: string;
  productSlug?: string;
}

export const MarketplaceComparison: React.FC<MarketplaceComparisonProps> = ({
  marketplaces,
  productName,
  productSlug,
}) => {
  // Only display active marketplace offers
  const activeOffers = (marketplaces || []).filter((m) => m.isActive !== false);

  // Sort marketplaces by price ascending (null prices at end)
  const sorted = [...activeOffers].sort((a, b) => {
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  const lowestPrice = sorted.find((m) => m.price !== null && m.inStock)?.price;

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 shadow-2xs">
        <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">No active store offers currently available</p>
        <p className="text-xs text-slate-400 mt-1">Check back soon as prices and retail stock are updated regularly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <ShoppingBag size={18} className="text-orange-600" />
            <span>Marketplace Price Comparison</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare verified prices {productName ? `for ${productName} ` : ''}across major Indian marketplaces before you buy
          </p>
        </div>
        <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
          Verified Stores
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {sorted.map((offer) => {
          const isLowest = offer.price !== null && offer.price === lowestPrice && offer.inStock;
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

          return (
            <div
              key={offer.name}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isLowest ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'
              }`}
            >
              {/* Store Identity */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-sm text-slate-800 shrink-0">
                  {offer.name.slice(0, 2)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{offer.name}</span>
                    {isLowest && (
                      <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Lowest Price
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {discount}% OFF
                      </span>
                    )}
                    {offer.isAffiliate && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        Affiliate
                      </span>
                    )}
                    {offer.dealBadge && !isLowest && (
                      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {offer.dealBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                    {offer.inStock ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle size={12} />
                        In Stock
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400">
                        <AlertCircle size={12} />
                        Currently Not Available
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
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                <div className="text-right">
                  {offer.price !== null ? (
                    <div>
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        ₹{offer.price.toLocaleString('en-IN')}
                      </span>
                      {offer.originalPrice && offer.originalPrice > offer.price && (
                        <span className="text-xs text-slate-400 line-through block">
                          ₹{offer.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-slate-400">—</span>
                  )}
                </div>

                <div>
                  {offer.inStock && offer.price !== null && hasDestination ? (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isLowest
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      <span>Buy on {offer.name}</span>
                      <ExternalLink size={13} />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    >
                      Not Available
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 text-[11px] text-slate-500 text-center border-t border-slate-100">
        Prices and stock availability are subject to change by retail merchants. Applicable coupons and terms are verified at checkout.
      </div>
    </div>
  );
};
