/**
 * _renderer.ts — Layout renderer for the guide section.
 *
 * KISS Architecture: Renderers wrap page SSR output, like Next.js layout.tsx.
 * This renderer is a pass-through — the sidebar navigation in <kiss-layout>
 * already provides section context, so no additional wrapping is needed.
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
  wrap(html, _ctx) {
    // Pass-through: <kiss-layout> sidebar already provides navigation context.
    // No breadcrumb or section wrapper needed — it would render outside
    // the <kiss-layout> component and appear above the sticky header.
    return html;
  },
};

export default renderer;
