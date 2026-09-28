'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Flame,
  BookOpen,
  Award,
  Newspaper,
  GitCompare,
  LogOut,
  ExternalLink,
  Zap,
} from 'lucide-react';

interface AdminSidebarProps {
  adminName?: string;
  adminEmail?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  adminName = 'Admin',
  adminEmail = 'admin@onlinesalelive.in',
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: Layers },
    { name: 'Deals', href: '/admin/deals', icon: Flame },
    { name: 'Guides', href: '/admin/guides', icon: BookOpen },
    { name: 'Reviews', href: '/admin/reviews', icon: Award },
    { name: 'Blog / Articles', href: '/admin/blog', icon: Newspaper },
    { name: 'Comparisons', href: '/admin/comparisons', icon: GitCompare },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/30">
            <Zap size={20} className="fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-white tracking-tight leading-tight">
              OnlineSale<span className="text-orange-500">Live</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              Admin CMS
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Actions */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Admin identity */}
        <div className="px-2 py-1.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs font-bold text-slate-200 truncate">{adminName}</div>
          <div className="text-[11px] text-slate-500 truncate">{adminEmail}</div>
        </div>

        {/* Actions */}
        <div className="space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <span>View Public Website</span>
            <ExternalLink size={13} />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
