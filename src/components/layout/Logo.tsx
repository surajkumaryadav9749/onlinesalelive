import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface LogoProps {
  /** Optional custom class name for the wrapper */
  className?: string;
  /** Size variant for the logo mark: 'sm' (32px), 'md' (40-44px), 'lg' (56px) */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the brand name typography ('OnlineSaleLive') alongside the logo mark */
  withText?: boolean;
  /** Color theme for text and logo container: 'light' (for light/white backgrounds) or 'dark' (for dark backgrounds) */
  theme?: 'light' | 'dark';
  /** Optional subtitle text (e.g. 'Smart Deals & Best Prices', 'Admin CMS') */
  subtitle?: string;
  /** Destination link (defaults to '/'). Pass empty string or null to render without Link */
  href?: string | null;
  /** Whether the image should load with high priority (useful for above-the-fold navbar) */
  priority?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  withText = true,
  theme = 'light',
  subtitle,
  href = '/',
  priority = false,
}) => {
  // Sizing tokens for the logo image and container
  const sizeMap = {
    sm: {
      box: 'w-8 h-8 rounded-lg',
      imgSize: 32,
      text: 'text-lg',
      inBadge: 'text-[9px] px-1 py-0.2',
    },
    md: {
      box: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl',
      imgSize: 44,
      text: 'text-xl',
      inBadge: 'text-[10px] px-1.5 py-0.5',
    },
    lg: {
      box: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl',
      imgSize: 64,
      text: 'text-2xl sm:text-3xl',
      inBadge: 'text-xs px-2 py-0.5',
    },
  };

  const currentSize = sizeMap[size];
  const isDark = theme === 'dark';

  // Logo mark container styling
  // On dark background, wrap in a crisp white rounded tile with shadow for contrast.
  // On light background, seamless blend.
  const containerClasses = isDark
    ? `${currentSize.box} bg-white p-1 flex items-center justify-center shrink-0 shadow-md shadow-black/20 group-hover:scale-105 transition-transform`
    : `${currentSize.box} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`;

  const logoMark = (
    <div className={containerClasses}>
      <Image
        src="/images/onlinesalelive-logo.png"
        alt="OnlineSaleLive"
        width={currentSize.imgSize}
        height={currentSize.imgSize}
        priority={priority}
        className="w-full h-full object-contain rounded-lg"
      />
    </div>
  );

  const brandText = withText ? (
    <div className="flex flex-col">
      <div className="flex items-center">
        <span
          className={`${currentSize.text} font-black tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          OnlineSale<span className={isDark ? 'text-orange-500' : 'text-orange-600'}>Live</span>
        </span>
        <span
          className={`ml-1 font-bold uppercase tracking-wider rounded ${
            currentSize.inBadge
          } ${
            isDark
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          IN
        </span>
      </div>
      {subtitle ? (
        <span
          className={`text-[10px] font-medium tracking-wider ${
            isDark ? 'text-orange-400' : 'text-slate-500 -mt-1 hidden sm:block'
          }`}
        >
          {subtitle}
        </span>
      ) : null}
    </div>
  ) : null;

  const content = (
    <div className={`flex items-center gap-2.5 shrink-0 group ${className}`}>
      {logoMark}
      {brandText}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 focus:outline-none" aria-label="OnlineSaleLive">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
