/** Deterministic CSS projection shared by compiled light-root SSR and CSR. */

function replaceShadowSelectorTokens(css: string): string {
  let output = '';
  let quote: '"' | "'" | undefined;
  let comment = false;

  for (let index = 0; index < css.length;) {
    const char = css[index];
    const next = css[index + 1];

    if (comment) {
      output += char;
      index++;
      if (char === '*' && next === '/') {
        output += next;
        index++;
        comment = false;
      }
      continue;
    }

    if (quote) {
      output += char;
      index++;
      if (char === '\\' && index < css.length) {
        output += css[index];
        index++;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      output += '/*';
      index += 2;
      comment = true;
      continue;
    }
    if (char === '"' || char === "'") {
      output += char;
      index++;
      quote = char;
      continue;
    }
    if (css.startsWith(':host(', index)) {
      output += ':scope:is(';
      index += ':host('.length;
      continue;
    }
    if (css.startsWith(':host', index)) {
      const boundary = css[index + ':host'.length];
      if (boundary === undefined || !/[\w-]/.test(boundary)) {
        output += ':scope';
        index += ':host'.length;
        continue;
      }
    }
    if (css.startsWith('::slotted(', index)) {
      output += 'slot > :is(';
      index += '::slotted('.length;
      continue;
    }

    output += char;
    index++;
  }

  return output;
}

/**
 * Scope one component stylesheet to a compiled light-root host.
 *
 * A light root has no native shadow style boundary: raw selectors would leak
 * into the document and shadow-only `:host`/`::slotted` selectors would never
 * match. CSS `@scope` supplies that native boundary. Strings and comments are
 * deliberately preserved byte-for-byte.
 */
export function scopeCompiledLightCss(tag: string, css: string): string {
  if (css.length === 0) return '';
  return `@scope (${tag}) {\n${replaceShadowSelectorTokens(css)}\n}`;
}
