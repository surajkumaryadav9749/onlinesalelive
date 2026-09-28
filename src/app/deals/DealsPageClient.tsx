'use client';

import React, { useState, useMemo } from 'react';
import { DealCard } from '@/components/deals/DealCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Flame, Clock, Zap, TrendingDown, Tag, Sparkles } from 'lucide-react';
import { Deal } from '@/types';

interface DealsPageClientProps {
  initialDeals: Deal[];
  popularDeals?: Deal[];
  expiringDeals?: Deal[];
}

export function DealsPageClient({ initialDeals, popularDeals = [], expiringDeals = [] }: DealsPageClientProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');

  const dealTypes = [
    { id: 'all', label: 'All Deals', icon: Flame },
    { id: "Today's Deal", label: "Today's Deals", icon: Clock },
    { id: 'Flash Deal', label: 'Flash Deals', icon: Zap },
    { id: 'Major Discount', label: 'Major Discounts', icon: Tag },
    { id: 'Price Drop', label: 'Price Drops', icon: TrendingDown },
    { id: 'Featured Deal', label: 'Featured Deals', icon: Sparkles },
  ];

  const marketplaces = ['all', 'Amazon', 'Flipkart', 'Myntra', 'AJIO', 'Meesho'];

  const filteredDeals = useMemo(() => {
    return initialDeals.filter((d) => {
      const matchesType =
        selectedType === 'all' || d.dealType.toLowerCase() === selectedType.toLowerCase();
      const matchesMarketplace =
        selectedMarketplace === 'all' ||
        d.marketplace.toLowerCase() === selectedMarketplace.toLowerCase();
      return matchesType && matchesMarketplace;
    });
  }, [selectedType, selectedMarketplace, initialDeals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <Breadcrumbs items={[{ label: 'Deals' }]} />

      {/* Hero Banner */}
      <div className="bg-linear-to-r from-orange-600 via-red-600 to-amber-600 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Flame size={14} />
            <span>Active Offers Aggregator</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            All Deals & Special Offers
          </h1>
          <p className="text-orange-100 text-sm sm:text-base leading-relaxed">
            Discover lightning offers, price drops, and clearance sales across Amazon, Flipkart, Myntra, AJIO and Meesho.
          </p>
        </div>
      </div>

      {/* Expiring Soon Section */}
      {expiringDeals.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-amber-950">
                Expiring Soon (Within 72 Hours)
              </h2>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Ending Shortly
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiringDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Deals Spotlight */}
      {popularDeals.length > 0 && (
        <section className="bg-orange-50/60 border border-orange-200 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Popular Shopper Deals
              </h2>
            </div>
            <span className="text-xs font-semibold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full">
              High Activity
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularDeals.slice(0, 4).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {/* Deal Type Filter Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
          {dealTypes.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-orange-400' : 'text-slate-400'} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.id === 'all'
                    ? initialDeals.length
                    : initialDeals.filter((d) => d.dealType === tab.id).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Marketplace Sub-Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-medium shrink-0">Filter by Store:</span>
          {marketplaces.map((m) => {
            const isSelected = selectedMarketplace === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMarketplace(m)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {m === 'all' ? 'All Stores' : m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {filteredDeals.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <p className="text-base text-slate-600 font-semibold">No deals found under this category right now.</p>
          <p className="text-xs text-slate-400 mt-1">Check back shortly as new limited-time deals are added daily.</p>
        </div>
      )}
    </div>
  );
}
