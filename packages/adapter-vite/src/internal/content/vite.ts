import type { Plugin } from 'vite';
import type { OpenElementBuildContextLike } from '../protocol/framework.ts';
import { type FileSystemAdapter, nodeFsAdapter } from './fs-adapter.ts';
import { createBlogPlugin } from './blog/plugin.ts';
import { createNavPlugin } from './nav/plugin.ts';
import { createSitemapPlugin } from './sitemap/plugin.ts';
import type { OpenElementContentOptions } from './types.ts';

interface OpenContentOptions extends OpenElementContentOptions {
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

  if (options.blog) {
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
