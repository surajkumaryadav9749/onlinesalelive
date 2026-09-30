'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { Zap, Mail, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter / Deal Alerts Box */}
        <div className="bg-linear-to-r from-slate-900 to-slate-850 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-14">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-orange-400 font-semibold text-xs tracking-wider uppercase mb-1">
                <Zap size={16} />
                <span>Instant Deal Alerts</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Never Miss a Flash Deal or Price Drop
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Get hand-picked, verified deals across Amazon, Flipkart, Myntra & AJIO straight to your inbox. No spam. No account required.
              </p>
            </div>

            <div className="w-full lg:w-auto">
              {subscribed ? (
                <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 px-5 py-3 rounded-xl text-sm font-medium">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span>You&apos;re subscribed! We&apos;ll alert you on top price drops.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto"
                >
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full sm:w-80 pl-10 pr-4 py-2.5 text-sm bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-orange-600/20"
                  >
                    Subscribe Free
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Column Sitemap */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 space-y-4">
            <Logo size="md" theme="dark" />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              OnlineSaleLive (onlinesalelive.in) is India&apos;s dedicated shopping deals and product-discovery engine. We research prices, aggregate seasonal sales, and compare offers across leading Indian marketplaces to help you save real money.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Independent editorial recommendations.</span>
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Categories
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/category/electronics" className="hover:text-white transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/category/mobiles" className="hover:text-white transition-colors">
                  Mobiles
                </Link>
              </li>
              <li>
                <Link href="/category/laptops" className="hover:text-white transition-colors">
                  Laptops
                </Link>
              </li>
              <li>
                <Link href="/category/fashion" className="hover:text-white transition-colors">
                  Fashion & Apparel
                </Link>
              </li>
              <li>
                <Link href="/category/shoes" className="hover:text-white transition-colors">
                  Footwear & Shoes
                </Link>
              </li>
              <li>
                <Link href="/category/watches" className="hover:text-white transition-colors">
                  Watches & Smartwatches
                </Link>
              </li>
              <li>
                <Link href="/category/home" className="hover:text-white transition-colors">
                  Home & Kitchen
                </Link>
              </li>
            </ul>
          </div>

          {/* Deal Discoveries & Price Brackets */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Deals & Budgets
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/todays-deals" className="hover:text-white transition-colors">
                  Today&apos;s Deals
                </Link>
              </li>
              <li>
                <Link href="/discounts" className="hover:text-white transition-colors">
                  50%+ Major Discounts
                </Link>
              </li>
              <li>
                <Link href="/sale" className="hover:text-white transition-colors">
                  Mega Festive Sale
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-white transition-colors">
                  Product Comparison
                </Link>
              </li>
              <li>
                <Link href="/products-under-500" className="hover:text-white transition-colors">
                  Products Under ₹500
                </Link>
              </li>
              <li>
                <Link href="/products-under-1000" className="hover:text-white transition-colors">
                  Products Under ₹1000
                </Link>
              </li>
              <li>
                <Link href="/products-under-2000" className="hover:text-white transition-colors">
                  Products Under ₹2000
                </Link>
              </li>
              <li>
                <Link href="/products-under-5000" className="hover:text-white transition-colors">
                  Products Under ₹5000
                </Link>
              </li>
            </ul>
          </div>

          {/* Guides & Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Guides & Company
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/guides" className="hover:text-white transition-colors">
                  Buying Guides
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-white transition-colors">
                  Product Reviews
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Shopping Hacks Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/affiliate-disclosure" className="hover:text-white transition-colors font-medium text-orange-400">
                  Affiliate Disclosure
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Affiliate Disclosure Notice (FTC & Indian Consumer Protection compliant) */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 leading-relaxed space-y-2">
          <p>
            <strong className="text-slate-400">Affiliate Disclosure:</strong> OnlineSaleLive (onlinesalelive.in) is a participant in affiliate marketing programs designed to provide a means for websites to earn referral fees by linking to retail partners including Amazon India, Flipkart, Myntra, AJIO, Meesho, and others. If you click on a deal or product link and make a purchase, we may earn an affiliate commission at absolutely no extra cost to you. Product prices, availability, and discount coupons are subject to marketplace fluctuations and may vary from the time of publication.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-3 text-slate-500">
            <p>© {new Date().getFullYear()} OnlineSaleLive. All rights reserved.</p>
            <div className="flex items-center gap-1">
              <span>Engineered with</span>
              <Heart size={13} className="text-red-500 fill-red-500 inline" />
              <span>for smart Indian shoppers.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
