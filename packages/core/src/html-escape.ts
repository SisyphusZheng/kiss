/**
 * @openelement/core - Safe/Unsafe HTML Contract
 *
 * Branded types for HTML escaping semantics:
 * - SafeHtml:  A string that has been HTML-escaped (safe for text content)
 * - UnsafeHtml: A string that is intentionally raw HTML (do not double-escape)
 *
 * @module @openelement/core/html-escape
 */

// ─── L1: Safe/Unsafe HTML Contract ──────────────────────────────

import { createLogger, warnOnce } from './logger.js';

const log = createLogger('core');

import type { SafeHtml, UnsafeHtml } from '@openelement/protocol/html';
export type { SafeHtml, UnsafeHtml };

/**
 * Escape a string for safe HTML text content insertion.
 * Uses single-pass replacement for performance (P-01 fix).
 * Branded types are compile-time only - removed dead runtime branches (M-01 fix).
 */
const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] || ch);
}

/** Escape an HTML attribute value */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape a string for use as an attribute value (double-quoted) */
export function escapeAttrValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return escapeAttr(String(value));
}

/**
 * Wrap rendered HTML in a full HTML document.
 * Adds DOCTYPE, head (title, meta, preload), and body.
 * Supports CSP nonce and dev scripts (e.g. Vite client, route module registration).
 */
export function wrapInDocument(
  html: string,
  options: {
    title?: string;
    lang?: string;
    /** Client-side module script injected after rendered HTML. */
    clientScript?: string;
    meta?: {
      description?: string;
      tags?: Array<Record<string, string | number | boolean>>;
    };
    /** Raw HTML script tags to inject after rendered HTML (e.g. Vite client, route module registration). */
    devScripts?: string;
    headExtras?: string;
    /** Raw route-local head fragments from explicit dangerous page metadata. */
    dangerouslyHeadFragments?: string[];
    /** Trust script tags that were produced by structured framework injection APIs. */
    allowHeadExtrasScripts?: boolean;
    /** CSP nonce, if provided, added to all generated <script> tags. */
    cspNonce?: string;
  } = {},
): string {
  const {
    title = 'openElement',
    lang = 'en',
    clientScript = '',
    meta,
    devScripts = '',
    headExtras = '',
    dangerouslyHeadFragments = [],
    allowHeadExtrasScripts = false,
    cspNonce,
  } = options;
  // v0.14.5: CSP nonce format validation per CSP spec (base64 value)
  const NONCE_RE = /^[A-Za-z0-9+/=_-]+$/;
  const validNonce = cspNonce && NONCE_RE.test(cspNonce) ? cspNonce : undefined;
  if (cspNonce && !validNonce) {
    log.warn(`Invalid CSP nonce format: "${cspNonce}". Nonce should be a base64-encoded value.`);
  }
  // v0.14.8: C-02 fix - Runtime enforcement for headExtras.
  // If headExtras contains <script> tags and allowHeadExtrasScripts is false,
  // strip them to prevent XSS. Developer should use inject.scripts for safe injection.
  let safeHeadExtras = headExtras;
  if (!allowHeadExtrasScripts && headExtras) {
    // Strip <script> tags and their content
    safeHeadExtras = headExtras.replace(/<script[\s>][\s\S]*?<\/script\s*>/gi, '');
    if (safeHeadExtras !== headExtras) {
      warnOnce(
        'headExtrasScripts',
        log,
        'headExtras contained <script> tags which were stripped for security. ' +
          'Use inject.scripts for safe script injection, or set allowHeadExtrasScripts: true.',
      );
    }
    // Strip on* event handler attributes (strong XSS indicator)
    if (/\s+on\w+\s*=/i.test(safeHeadExtras)) {
      safeHeadExtras = safeHeadExtras.replace(
        /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
        '',
      );
      log.warn(
        'headExtras contained on* event handler attributes which were stripped for security.',
      );
    }
  }

  // v0.14.3: Basic HTML tag balance validation for headExtras.
  // Checks that opening and closing tag counts match for major HTML elements.
  // This catches obviously malformed HTML (e.g., unclosed <!-- comments).
  if (headExtras) {
    // Check for unclosed HTML comments: <!-- without matching -->
    const commentOpens = (headExtras.match(/<!--/g) || []).length;
    const commentCloses = (headExtras.match(/-->/g) || []).length;
    if (commentOpens !== commentCloses) {
      log.warn(
        'headExtras has unbalanced HTML comments (<!-- vs -->). ' +
          'This may cause HTML parsing issues.',
      );
    }
  }
  const metaTags: string[] = [];
  if (meta?.description) {
    const safeDesc = meta.description
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    metaTags.push(`  <meta name="description" content="${safeDesc}">`);
  }
  if (Array.isArray(meta?.tags)) {
    for (const tag of meta.tags) {
      const attrs = Object.entries(tag)
        .map(([key, value]) => `${escapeAttr(key)}="${escapeAttrValue(value)}"`)
        .join(' ');
      if (attrs) metaTags.push(`  <meta ${attrs}>`);
    }
  }
  const metaBlock = metaTags.length > 0 ? '\n' + metaTags.join('\n') + '\n' : '';
  const dangerousHeadBlock = dangerouslyHeadFragments.length > 0
    ? '\n  ' + dangerouslyHeadFragments.join('\n  ')
    : '';

  const safeTitle = escapeHtml(title);
  const safeLang = escapeAttr(lang);

  return `<!DOCTYPE html>
<html lang="${safeLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>${metaBlock}
  ${safeHeadExtras}${dangerousHeadBlock}
</head>
<body>
  ${html}
  ${clientScript}${devScripts}
</body>
</html>`;
}

// ─── Error page rendering ────────────────────────────────────────

import type { RouteEntry } from '@openelement/protocol/framework';

/**
 * Render an error page to HTML string.
 * In dev mode, shows detailed error information for debugging.
 * In production, shows a generic safe error page.
 */
export function renderSsrError(
  error: Error,
  statusOrRoute: number | RouteEntry,
  isDev: boolean = false,
): string {
  const status = typeof statusOrRoute === 'number' ? statusOrRoute : 500;
  const title = isDev ? 'SSR Render Error' : `Error ${status}`;
  const message = escapeHtml(error.message);
  const stack = isDev && error.stack ? escapeHtml(error.stack) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${
    isDev
      ? '<style>body{font-family:system-ui;max-width:800px;margin:2rem auto;padding:0 1rem}pre{background:#f5f5f5;padding:1rem;overflow:auto;border-radius:4px}</style>'
      : ''
  }
</head>
<body>
  <h1>${title}</h1>
  <p>${isDev ? `<strong>${message}</strong>` : message}</p>
  ${stack ? `<pre>${stack}</pre>` : ''}
</body>
</html>`;
}
