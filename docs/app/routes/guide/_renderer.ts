/**
 * _renderer.ts — Layout renderer for the guide section.
 *
 * KISS Architecture: Renderers wrap page SSR output, like Next.js layout.tsx.
 * This renderer wraps guide pages with a consistent section header.
 *
 * Convention:
 *   - _renderer.ts default-exports a KissRenderer object
 *   - The `.wrap(html, ctx)` method receives the page's SSR HTML
 *   - Return the wrapped HTML (can be async)
 *   - ctx.req.path gives the current URL path for active nav highlighting
 *
 * @see {@link ../packages/kiss-core/src/types.ts} for KissRenderer interface
 */

import type { KissRenderer } from '@kissjs/core';

const renderer: KissRenderer = {
  wrap(html, ctx) {
    // Extract section name from path: /guide/getting-started → Getting Started
    const segments = ctx.req.path.split('/').filter(Boolean);
    const section = segments.length >= 2 ? segments[1] : '';
    const title = section
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    // Wrap with a section header + the page content.
    // Pages still use <kiss-layout> for the full chrome (sidebar + nav).
    // This renderer adds the per-section breadcrumb context.
    return `<div class="guide-section" data-section="${section}">
  <nav class="guide-breadcrumb" aria-label="Breadcrumb">
    <a href="/guide">Guide</a> ${title ? `/ ${title}` : ''}
  </nav>
  ${html}
</div>`;
  },
};

export default renderer;
