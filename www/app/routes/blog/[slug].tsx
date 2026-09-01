/** Dynamic blog route; all request data is projected into a compiled page. */
import { definePage } from '@openelement/app';
import { trustedHtml } from '@openelement/element';
import { getPostBySlug, posts } from '@openelement/generated/blog-data';
import { prepareArticle } from '@openelement/site-ui/article-body.ts';
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { localizePath } from '@openelement/site-ui/link.ts';
import PageBlogPost from '../../components/page-blog-post.tsx';

export function getStaticPaths(): Array<Record<string, string>> {
  return posts.map((post) => ({ slug: post.slug }));
}

export default definePage(PageBlogPost, {
  props({ locale, params }) {
    const resolved = contentLocale(locale ?? 'en');
    const slug = params.slug ?? '';
    const blogHref = localizePath('/blog', resolved);
    const post = getPostBySlug(slug);
    const shared = {
      slug,
      blogHref,
      notFoundMessage: resolved === 'en' ? 'Post not found' : '未找到文章',
      backLabel: resolved === 'en' ? 'Back to Blog' : '返回博客',
      breadcrumbLabel: resolved === 'en' ? 'Blog' : '博客',
      nextDispatchLabel: resolved === 'en' ? 'Next dispatch' : '下一篇',
    };

    if (!post) {
      return {
        ...shared,
        notFoundClass: 'not-found',
        articleClass: 'is-hidden',
        crumbCurrent: '',
        postTitle: '',
        lede: '',
        date: '',
        tags: [],
        railItems: [],
        navigation: {},
        articleHtml: trustedHtml(''),
        nextDispatchHref: blogHref,
        nextDispatchText: resolved === 'en' ? 'Back to all dispatches →' : '返回全部文章 →',
      };
    }

    const tags = post.frontmatter.tags ?? [];
    const article = prepareArticle(post.html);
    const visiblePosts = posts
      .filter((candidate) => candidate.frontmatter.type !== 'adr')
      .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
    const index = visiblePosts.findIndex((candidate) => candidate.slug === post.slug);
    const previous = index >= 0 ? visiblePosts[index + 1] : undefined;
    const next = index > 0 ? visiblePosts[index - 1] : undefined;

    return {
      ...shared,
      notFoundClass: 'not-found is-hidden',
      articleClass: '',
      crumbCurrent: tags[0] ?? (resolved === 'en' ? 'Dispatch' : '随笔'),
      postTitle: post.frontmatter.title,
      lede: post.frontmatter.excerpt ?? '',
      date: post.frontmatter.date,
      tags: tags.map((tag) => ({ key: tag, label: tag })),
      railItems: article.outline.map((item) => ({
        id: item.id,
        href: `#${item.id}`,
        label: item.label,
        depth: String(item.level ?? 2),
      })),
      navigation: {
        previous: previous
          ? { href: `${blogHref}/${previous.slug}`, label: previous.frontmatter.title }
          : undefined,
        next: next
          ? { href: `${blogHref}/${next.slug}`, label: next.frontmatter.title }
          : undefined,
      },
      articleHtml: trustedHtml(article.html),
      nextDispatchHref: next ? `${blogHref}/${next.slug}` : blogHref,
      nextDispatchText: next
        ? `${next.frontmatter.title} →`
        : resolved === 'en'
        ? 'Back to all dispatches →'
        : '返回全部文章 →',
    };
  },
});
