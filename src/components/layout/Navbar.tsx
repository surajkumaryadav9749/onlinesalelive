'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import {
  Search,
  Menu,
  X,
  Flame,
  Tag,
  Zap,
  Percent,
  Layers,
  BookOpen,
  Award,
  Newspaper,
  GitCompare,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Deals', href: '/deals', icon: Flame, badge: 'Hot' },
    { name: 'Sale', href: '/sale', icon: Tag },
    { name: 'Discounts', href: '/discounts', icon: Percent },
    { name: "Today's Deals", href: '/todays-deals', icon: Zap, badge: 'Live' },
    { name: 'Categories', href: '/categories', icon: Layers },
    { name: 'Compare', href: '/compare', icon: GitCompare },
    { name: 'Guides', href: '/guides', icon: BookOpen },
    { name: 'Reviews', href: '/reviews', icon: Award },
    { name: 'Blog', href: '/blog', icon: Newspaper },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 text-center font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden sm:inline">
            🇮🇳 India&apos;s Smart Shopping & Deal Discovery Engine
          </span>
          <span className="mx-auto sm:mx-0 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Verified live discounts from Amazon, Flipkart, Myntra, AJIO & Meesho
          </span>
          <div className="hidden md:flex items-center gap-3 text-slate-300">
            <Link href="/products-under-500" className="hover:text-white transition-colors">Under ₹500</Link>
            <span>•</span>
            <Link href="/products-under-1000" className="hover:text-white transition-colors">Under ₹1000</Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <Logo size="md" subtitle="Smart Deals & Best Prices" priority />

          {/* Prominent Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search deals, smartphones, shoes, earbuds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-2 text-sm bg-slate-100/90 border border-slate-200 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all shadow-inner"
              />
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Quick Price Shortcuts (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="text-slate-400">Budget:</span>
            <Link
              href="/products-under-500"
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 transition-colors"
            >
              &lt; ₹500
            </Link>
            <Link
              href="/products-under-1000"
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 transition-colors"
            >
              &lt; ₹1000
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search deals, smartphones, shoes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 text-sm bg-slate-100 border border-slate-200 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              Search
            </button>
          </form>
        </div>

        {/* Secondary Navigation Row (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 py-2 border-t border-slate-100 text-xs sm:text-sm font-medium overflow-x-auto no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors shrink-0 group"
              >
                <Icon size={15} className="text-slate-400 group-hover:text-orange-500" />
                <span>{link.name}</span>
                {link.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                      link.badge === 'Live'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-2 pb-6 shadow-xl">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Link
              href="/products-under-500"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 px-3 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg border border-orange-200"
            >
              Products Under ₹500
            </Link>
            <Link
              href="/products-under-1000"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 px-3 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200"
            >
              Products Under ₹1000
            </Link>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-800 hover:bg-slate-100 font-medium text-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-orange-600" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
