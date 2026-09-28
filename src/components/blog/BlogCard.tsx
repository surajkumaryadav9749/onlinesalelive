'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/types';
import { Clock, ArrowRight } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const [imgSrc, setImgSrc] = useState(post.image);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
        <Image
          src={imgSrc}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            setImgSrc(
              `https://placehold.co/600x400/e2e8f0/0f172a?text=${encodeURIComponent(
                post.title.slice(0, 15)
              )}`
            );
          }}
        />
        <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
          {post.category}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.readTime}
            </span>
            <span>•</span>
            <span>{post.date}</span>
          </div>

          <Link href={`/blog/${post.slug}`} className="block group-hover:text-blue-600">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
              {post.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
            {post.excerpt}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">By {post.author}</span>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700"
          >
            <span>Read Article</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
