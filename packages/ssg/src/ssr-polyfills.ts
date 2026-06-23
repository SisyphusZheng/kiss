/**
 * SSR Polyfills for browser-only APIs.
 *
 * Polyfill 分层策略（ADR-0044）:
 * - Entry code body (this module): CSSStyleSheet — needs `import { StyleSheet } from @openelement/core`
 * - Output banner (build-ssg.ts): HTMLElement + customElements — no import, runs before module evaluation
 *
 * ADR-0044: SSR polyfill strategy — browser globals in Deno SSR runtime.
 */

/**
 * Generates the entry-code polyfill (CSSStyleSheet only).
 *
 * HTMLElement and customElements are in output.banner (build-ssg.ts)
 * because they must execute BEFORE any ESM import is evaluated.
 * CSSStyleSheet lives here because it needs `import { StyleSheet }`.
 */
export function generateSsrPolyfillBanner(): string {
  return `\
import { StyleSheet } from '@openelement/core';
if (typeof globalThis.CSSStyleSheet === 'undefined') {
  globalThis.CSSStyleSheet = class {
    replaceSync(_css) {}
    get cssRules() { return []; }
  };
}
`;
}
