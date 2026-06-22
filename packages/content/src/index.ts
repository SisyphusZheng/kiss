/**
 * @openelement/content - Unified content plugin for openElement
 *
 * Blog + Nav + Sitemap - build-time only, zero runtime.
 * Each module is opt-in: pass options to enable, omit or false to disable.
 *
 * Route components import generated data from @openelement/generated/blog-data.
 * This package writes the generated module and does not resolve it at runtime.
 */

import type { Plugin } from 'vite';
import type { OpenElementContentOptions } from './types.ts';
import type { OpenElementBuildContextLike } from '@openelement/protocol/framework';
import { type FileSystemAdapter, nodeFsAdapter } from './fs-adapter.ts';
import { createBlogPlugin } from './blog/plugin.ts';
import { createNavPlugin } from './nav/plugin.ts';
import { createSitemapPlugin } from './sitemap/plugin.ts';

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
export {
  createRouteManifest,
  writeNavModule,
  writeRouteManifestModule,
  writeSearchIndex,
} from './nav/writer.ts';
export type { DocsRouteManifest, DocsRouteManifestEntry, SearchIndexEntry } from './nav/writer.ts';

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

export interface OpenContentOptions extends OpenElementContentOptions {
  ctx?: OpenElementBuildContextLike;
  fs?: FileSystemAdapter;
}

/**
 * Create the unified openElement content plugin set.
 *
 * Returns one Vite plugin per enabled module (blog, nav, sitemap).
 * Pass a custom `fs` adapter via options to make writes observable in tests.
 */
export function openContent(options: OpenContentOptions = {}): Plugin[] {
  const plugins: Plugin[] = [];
  const fs = options.fs ?? nodeFsAdapter;
  const ctx = options.ctx;

  if (options.blog !== false && options.blog) {
    plugins.push(createBlogPlugin(options.blog, ctx, fs));
  }

  if (options.nav) {
    plugins.push(createNavPlugin(options.nav, ctx, fs));
  }

  if (options.sitemap) {
    plugins.push(createSitemapPlugin(options.sitemap, ctx));
  }

  return plugins;
}

export default openContent;
