/**
 * KISS runtime shim — built-in, auto-injected by kiss() plugin.
 *
 * Re-exports only browser/SSR-safe APIs from @kissjs/core.
 * Prevents pulling in build-time code (node:fs, Vite plugins, etc.)
 * that would break the client/SSR bundle.
 *
 * Users should still write: import { LitElement, html, css } from '@kissjs/core'
 * The kiss() plugin resolves this import to this shim automatically.
 */

export { css, html, LitElement, nothing, svg } from 'lit';
export { unsafeHTML } from 'lit/directives/unsafe-html.js';
export { styleMap } from 'lit/directives/style-map.js';
export { createRef, ref } from 'lit/directives/ref.js';
export { classMap } from 'lit/directives/class-map.js';
export { ifDefined } from 'lit/directives/if-defined.js';
export { Hono } from 'hono';

// SSR runtime — wrapInDocument has no Node.js deps, safe to re-export
export { wrapInDocument } from './ssr-handler.js';
