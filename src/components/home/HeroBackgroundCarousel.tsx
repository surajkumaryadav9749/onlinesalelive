'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroBanner } from '@/types';

interface HeroBackgroundCarouselProps {
  banners: HeroBanner[];
}

export const HeroBackgroundCarousel: React.FC<HeroBackgroundCarouselProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out any banners whose images failed to load
  const validBanners = (banners || []).filter(
    (b) => b && b.imageUrl && !imageErrors[b._id || b.id || b.imageUrl]
  );

  const bannerCount = validBanners.length;

  const nextSlide = useCallback(() => {
    if (bannerCount <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % bannerCount);
  }, [bannerCount]);

  const prevSlide = useCallback(() => {
    if (bannerCount <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + bannerCount) % bannerCount);
  }, [bannerCount]);

  const goToSlide = (idx: number) => {
    if (idx >= 0 && idx < bannerCount) {
      setCurrentIndex(idx);
    }
  };

  // Auto-advance every 4.5 seconds when not paused and more than 1 banner
  useEffect(() => {
    if (bannerCount <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [bannerCount, isPaused, nextSlide]);

  // Pause on desktop hover over the hero section
  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => setIsPaused(false);

    parent.addEventListener('mouseenter', handleMouseEnter);
    parent.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      parent.removeEventListener('mouseenter', handleMouseEnter);
      parent.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;

    if (deltaX > 45) {
      // Swiped right -> previous slide
      prevSlide();
    } else if (deltaX < -45) {
      // Swiped left -> next slide
      nextSlide();
    }
    setTouchStartX(null);
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Zero-banner fallback: clean fallback container
  if (bannerCount === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-linear-to-r from-orange-500/10 via-amber-500/10 to-red-500/10 border-b border-slate-200">
        <div className="text-center p-6 space-y-2">
          <p className="text-sm sm:text-base font-bold text-slate-800">
            India&apos;s Smart Shopping & Live Deals Engine
          </p>
          <p className="text-xs text-slate-500">
            Compare verified discounts across Amazon, Flipkart, Myntra, AJIO & Meesho
          </p>
        </div>
      </div>
    );
  }

  const activeBanner = validBanners[currentIndex] || validBanners[0];
  const hasLink = Boolean(activeBanner?.linkUrl && activeBanner.linkUrl.trim() !== '');

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-slate-900"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional hero banner carousel"
    >
      {/* Background Banner Slides */}
      {validBanners.map((banner, index) => {
        const isActive = index === currentIndex;
        const bannerKey = banner._id || banner.id || `banner-${index}`;
        const activeImageUrl = banner.mobileImageUrl || banner.imageUrl;

        return (
          <div
            key={bannerKey}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center overflow-hidden ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
            aria-hidden={!isActive}
          >
            {/* Subtle ambient blur background fill to eliminate stark dark letterboxing */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-110 pointer-events-none transition-all duration-700"
              style={{
                backgroundImage: `url(${activeImageUrl})`,
              }}
              aria-hidden="true"
            />

            {/* Responsive Banner Picture: switches natively between mobile & desktop image */}
            <picture className="relative w-full h-full flex items-center justify-center z-10">
              {banner.mobileImageUrl && (
                <source
                  media="(max-width: 767px)"
                  srcSet={banner.mobileImageUrl}
                />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.imageUrl}
                alt={banner.title || 'OnlineSaleLive Featured Offer'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="hero-banner-image select-none transition-all duration-300 w-full h-full"
                onError={() => handleImageError(bannerKey)}
              />
            </picture>
          </div>
        );
      })}

      {/* Optional Clickable Destination Link Layer: Click anywhere on the active banner to visit deal */}
      {hasLink && (
        <Link
          href={activeBanner.linkUrl!}
          className="absolute inset-0 z-20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          aria-label={`View offer: ${activeBanner.title}`}
        />
      )}

      {/* Slide Indicators: Subtle dots when multiple banners exist */}
      {bannerCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 backdrop-blur-xs">
          {validBanners.map((b, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={b._id || b.id || `dot-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                className={`transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'w-6 h-1.5 rounded-full bg-orange-500 shadow-xs'
                    : 'w-1.5 h-1.5 rounded-full bg-white/70 hover:bg-white'
                }`}
                aria-label={`Go to banner ${idx + 1} of ${bannerCount}: ${b.title}`}
                aria-current={isSelected ? 'true' : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
