import { revalidatePath } from 'next/cache';

/**
 * Revalidate public catalog pages when products, categories, or deals change in Admin CMS.
 */
export function revalidateCatalog(specificSlug?: string, specificCategory?: string) {
  try {
    revalidatePath('/', 'page');
    revalidatePath('/categories', 'page');
    revalidatePath('/products', 'page');
    revalidatePath('/deals', 'page');
    revalidatePath('/todays-deals', 'page');
    revalidatePath('/discounts', 'page');
    revalidatePath('/products-under-500', 'page');
    revalidatePath('/products-under-1000', 'page');
    revalidatePath('/products-under-2000', 'page');
    revalidatePath('/products-under-5000', 'page');
    revalidatePath('/sale', 'page');
    revalidatePath('/sitemap.xml', 'page');

    if (specificSlug) {
      revalidatePath(`/product/${specificSlug}`, 'page');
    }
    if (specificCategory) {
      revalidatePath(`/category/${specificCategory}`, 'page');
    }
  } catch (err) {
    console.warn('[Revalidation] Error revalidating catalog paths:', err);
  }
}

/**
 * Revalidate public content pages when guides, reviews, comparisons, or articles change.
 */
export function revalidateContent(type: 'guide' | 'review' | 'comparison' | 'article', slug?: string) {
  try {
    revalidatePath('/', 'page');
    if (type === 'guide') {
      revalidatePath('/guides', 'page');
      if (slug) revalidatePath(`/guides/${slug}`, 'page');
    } else if (type === 'review') {
      revalidatePath('/reviews', 'page');
      if (slug) revalidatePath(`/reviews/${slug}`, 'page');
    } else if (type === 'comparison') {
      revalidatePath('/compare', 'page');
      if (slug) revalidatePath(`/compare/${slug}`, 'page');
    } else if (type === 'article') {
      revalidatePath('/blog', 'page');
      if (slug) revalidatePath(`/blog/${slug}`, 'page');
    }
    revalidatePath('/sitemap.xml', 'page');
  } catch (err) {
    console.warn('[Revalidation] Error revalidating content paths:', err);
  }
}
