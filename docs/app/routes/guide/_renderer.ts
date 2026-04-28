/**
 * _renderer.ts — Layout renderer for the guide section.
 *
 * KISS Architecture: Renderers wrap page SSR output, like Next.js layout.tsx.
 * This renderer adds a sidebar + main layout for all guide pages.
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
    // The guide section already uses <kiss-layout> for the full page layout,
    // so this renderer is minimal — it demonstrates the API.
    // In a real app, you might add breadcrumbs, section headers, etc.
    return html;
  },
};

export default renderer;
