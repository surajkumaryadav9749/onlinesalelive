import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/data-service';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { BlogCard } from '@/components/blog/BlogCard';
import { Clock, Calendar, User, ArrowLeft, ArrowRight, Tag } from 'lucide-react';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

import {
  createBlogPostMetadata,
  generateArticleSchema,
  buildCanonicalUrl,
  serializeJsonLd,
} from '@/lib/seo';

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | OnlineSaleLive',
      robots: { index: false, follow: false },
    };
  }

  return createBlogPostMetadata(post);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = await getAllBlogPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    url: buildCanonicalUrl(`/blog/${post.slug}`),
    image: post.image,
    authorName: post.author,
  });

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]}
      />

      {/* Article Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          <Tag size={12} />
          <span>{post.category}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          {post.excerpt}
        </p>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-4 pt-3 pb-4 border-y border-slate-200 text-xs sm:text-sm text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <User size={16} className="text-orange-600" />
            <span>{post.author}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar size={16} className="text-slate-400" />
            <span>{post.date}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-slate-400" />
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="relative w-full h-64 sm:h-96 rounded-3xl overflow-hidden bg-slate-100 shadow-md">
        <Image
          src={post.image}
          alt={post.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="object-cover"
        />
      </div>

      {/* Article Body */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-2xs space-y-6 text-slate-800 text-base sm:text-lg leading-relaxed font-normal">
        {post.content
          .split('\n\n')
          .filter((chunk) => chunk.trim() !== '')
          .map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (trimmed.startsWith('### ')) {
              return (
                <h3
                  key={index}
                  className="text-xl sm:text-2xl font-bold text-slate-900 pt-4 pb-1 border-b border-slate-100"
                >
                  {trimmed.replace('### ', '')}
                </h3>
              );
            }
            if (trimmed.startsWith('- ')) {
              const items = trimmed.split('\n').filter((l) => l.startsWith('- '));
              return (
                <ul key={index} className="space-y-2 list-disc list-inside text-slate-700 my-4 pl-2">
                  {items.map((item, idx) => (
                    <li key={idx} className="text-sm sm:text-base leading-relaxed">
                      {item.replace('- ', '')}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={index} className="text-slate-700 text-sm sm:text-base leading-relaxed">
                {trimmed}
              </p>
            );
          })}
      </div>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="pt-8 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              More Shopping Guides & Articles
            </h2>
            <Link
              href="/blog"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>View All Articles</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((relPost) => (
              <BlogCard key={relPost.id} post={relPost} />
            ))}
          </div>
        </section>
      )}

      {/* Back to Blog Button */}
      <div className="pt-4 flex justify-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to All Articles</span>
        </Link>
      </div>
    </article>
  );
}
