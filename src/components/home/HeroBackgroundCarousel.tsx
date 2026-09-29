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

  // Zero-banner fallback: keep original hero design
  if (bannerCount === 0) {
    return null;
  }

  const activeBanner = validBanners[currentIndex] || validBanners[0];
  const hasLink = Boolean(activeBanner?.linkUrl && activeBanner.linkUrl.trim() !== '');

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-auto select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional banners carousel"
    >
      {/* Background Banner Slides */}
      {validBanners.map((banner, index) => {
        const isActive = index === currentIndex;
        const bannerKey = banner._id || banner.id || `banner-${index}`;

        return (
          <div
            key={bannerKey}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none z-0'
            }`}
            aria-hidden={!isActive}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.title || 'OnlineSaleLive Featured Offer'}
              fill
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
              quality={85}
              className="object-cover object-center transform scale-102 transition-transform duration-7000 ease-out"
              onError={() => handleImageError(bannerKey)}
            />
          </div>
        );
      })}

      {/* Subtle Readability Overlay: Preserves banner visuals while guaranteeing text contrast */}
      <div
        className="absolute inset-0 z-1 pointer-events-none bg-linear-to-b from-white/75 via-white/55 to-slate-50/80 backdrop-blur-[0.5px]"
        aria-hidden="true"
      />

      {/* Optional Clickable Destination Link Layer: Below hero buttons (z-10), above background */}
      {hasLink && (
        <Link
          href={activeBanner.linkUrl!}
          className="absolute inset-0 z-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          aria-label={`View deal: ${activeBanner.title}`}
          tabIndex={-1}
        />
      )}

      {/* Slide Indicators: Subtle dots when multiple banners exist */}
      {bannerCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/15 backdrop-blur-xs">
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
                    ? 'w-6 h-1.5 rounded-full bg-orange-600 shadow-xs'
                    : 'w-1.5 h-1.5 rounded-full bg-slate-400/80 hover:bg-slate-600'
                }`}
                aria-label={`Go to banner ${idx + 1} of ${bannerCount}: ${b.title}`}
                aria-current={isSelected ? 'true' : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Subtle Title Badge on desktop */}
      {activeBanner?.title && (
        <div className="absolute bottom-3 right-4 z-20 hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/25 backdrop-blur-xs text-[11px] font-semibold text-slate-700 border border-white/40">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="truncate max-w-[200px]">{activeBanner.title}</span>
        </div>
      )}
    </div>
  );
};
