'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, ShieldCheck } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionText?: string;
  secondaryActionHref?: string;
  extraActions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  actionText,
  actionLabel,
  actionHref,
  secondaryActionText,
  secondaryActionHref,
  extraActions,
}) => {
  const buttonText = actionText || actionLabel;
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <ShieldCheck size={12} />
            <span>Admin Mode</span>
          </span>
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <span>Live Site</span>
          <ExternalLink size={13} />
        </Link>

        {extraActions}

        {secondaryActionText && secondaryActionHref && (
          <Link
            href={secondaryActionHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 rounded-xl shadow-2xs transition-colors"
          >
            <span>{secondaryActionText}</span>
          </Link>
        )}

        {buttonText && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus size={15} />
            <span>{buttonText}</span>
          </Link>
        )}
      </div>
    </div>
  );
};
