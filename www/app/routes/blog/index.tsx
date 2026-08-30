/**
 * Blog Index Page - v4 dispatch journal: serif masthead, featured band,
 * and outlined-number article rows.
 *
 * The route owns content/locale projection; the compiled page component owns
 * only the markup and declared properties (ADR-0143/ADR-0148).
 */
import { definePage } from '@openelement/app';
import { posts } from '@openelement/generated/blog-data';
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { localizePath } from '@openelement/site-ui/link.ts';
import BlogIndexPage from '../../components/page-blog-index.tsx';

export const meta = { section: 'History', label: 'Blog', order: 10 };

interface BlogIndexRow {
  slug: string;
  href: string;
  index: string;
  title: string;
  excerpt: string;
  date: string;
}

// Keep the dispatch index and blog-post prev/next ordering aligned: ADR posts
// are decision records, not public dispatches, and the newest date leads.
const visiblePosts = posts
  .filter((post) => post.frontmatter.type !== 'adr')
  .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));

function postTags(post: typeof posts[number]): string[] {
  return post.frontmatter.tags ?? [];
}

function padIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

export default definePage(BlogIndexPage, {
  props({ locale }) {
    const resolved = contentLocale(locale ?? 'en');
    const featured = visiblePosts[0];
    const rows: BlogIndexRow[] = visiblePosts.slice(1, 5).map((post, index) => ({
      slug: post.slug,
      href: localizePath(`/blog/${post.slug}`, resolved),
      index: padIndex(index),
      title: post.frontmatter.title,
      excerpt: post.frontmatter.excerpt ?? '',
      date: post.frontmatter.date,
    }));

    return {
      featuredHref: featured ? localizePath(`/blog/${featured.slug}`, resolved) : '',
      featuredKicker: featured
        ? `Featured — ${featured.frontmatter.date}${
          postTags(featured)[0] ? ` · ${postTags(featured)[0]}` : ''
        }`
        : '',
      featuredTitle: featured?.frontmatter.title ?? '',
      featuredExcerpt: featured?.frontmatter.excerpt ?? '',
      rows,
    };
  },
});
