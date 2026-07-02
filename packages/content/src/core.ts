export type { FileSystemAdapter } from './fs-adapter.ts';
export { nodeFsAdapter } from './fs-adapter.ts';

export type { BlogPost, BlogPostFrontmatter, OpenElementBlogOptions } from './blog/types.ts';
export { parseMarkdownFile, slugFromFilename } from './blog/markdown.ts';
export { generateBlogRoutes, scanPosts } from './blog/routes.ts';
export { loadBlogData } from './blog/blog-data.ts';
export { compileMdx } from './mdx/compile.ts';
export type { MdxCompileOptions, MdxModule } from './mdx/types.ts';

export { extractMeta, scanNavData } from './nav/scanner.ts';
export type { NavData } from './nav/scanner.ts';
export { writeNavModule, writeSearchIndex } from './nav/writer.ts';

export type {
  HeaderNavLink,
  NavItem,
  NavOptions,
  NavSection,
  OpenElementContentOptions,
  RouteMeta,
  SitemapOptions,
  SitemapUrl,
} from './types.ts';

export {
  generateSitemap,
  renderRobotsTxt,
  renderSitemapXml,
  scanHtmlFiles,
} from './sitemap/generator.ts';
