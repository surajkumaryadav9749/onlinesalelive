import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 'sm',
}) => {
  const starSize = size === 'sm' ? 14 : 16;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.4 && rating % 1 <= 0.8;

  return (
    <div className="flex items-center gap-1.5" aria-label={`Rated ${rating} out of 5 stars`}>
      <div className="flex items-center text-amber-500">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                size={starSize}
                className="fill-amber-400 text-amber-400"
              />
            );
          }
          if (i === fullStars && hasHalfStar) {
            return (
              <StarHalf
                key={i}
                size={starSize}
                className="fill-amber-400 text-amber-400"
              />
            );
          }
          return (
            <Star
              key={i}
              size={starSize}
              className="text-slate-300 stroke-1"
            />
          );
        })}
      </div>
      <span className={`font-semibold text-slate-800 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className={`text-slate-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
};
