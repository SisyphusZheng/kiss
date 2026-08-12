/**
 * sanitize.ts - Dependency-free allow-list HTML sanitizer (ADR-0126).
 *
 * `trustedHtml` is a trust boundary, not a sanitizer; this module is the
 * safe-by-default alternative for rendering untrusted HTML fragments
 * (markdown output, CMS content, third-party HTML).
 *
 * Safety model: the output stream only ever contains (a) tags from the
 * allow-list with attributes from the per-tag allow-list, and (b) text with
 * `&`, `<`, `>` escaped. Because no untrusted byte reaches the output
 * unescaped, the browser's re-parse of the result cannot construct markup
 * the sanitizer did not emit — even for inputs that tokenize differently in
 * a browser than they do here. Two allow-listed shapes are hardened beyond
 * the raw lists: URL-valued attributes (`href`/`src`/`cite`) pass the
 * ADR-0126 scheme policy (which conceptually decodes `&colon;` so a
 * colon-free string cannot smuggle an executable scheme), and a surviving
 * `target="_blank"` always carries a `rel` merged to include
 * `noopener noreferrer` (`opener` is dropped).
 *
 * Runs without a DOM: usable in SSR (Deno/Node) and browsers alike.
 *
 * @module ./sanitize.ts
 */

/** Per-tag attribute allow-list; '*' applies to every tag. */
export interface SanitizeOptions {
  /** Tags allowed to survive. Unknown tags are stripped (text kept unless discard). */
  allowedTags?: readonly string[];
  /** Attribute allow-list keyed by tag name; '*' applies to all tags. */
  allowedAttributes?: Record<string, readonly string[]>;
  /** URL schemes allowed on href/src/cite. */
  allowedSchemes?: readonly string[];
  /** 'keepText' (default) strips unknown tags but keeps their text; 'discard' drops both. */
  disallowedTagsMode?: 'keepText' | 'discard';
}

const DEFAULT_ALLOWED_TAGS = [
  'p',
  'div',
  'span',
  'a',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'em',
  'strong',
  'b',
  'i',
  'code',
  'pre',
  'blockquote',
  'br',
  'hr',
  'img',
  'figure',
  'figcaption',
  'small',
  'sub',
  'sup',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'caption',
  'dl',
  'dt',
  'dd',
  'mark',
  'ins',
  'del',
  'time',
  'abbr',
  'q',
  'cite',
] as const;

const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, readonly string[]> = {
  '*': ['class', 'id', 'title', 'lang'],
  a: ['href', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
  td: ['colspan', 'rowspan', 'headers'],
  th: ['colspan', 'rowspan', 'headers', 'scope'],
  ol: ['start'],
  time: ['datetime'],
  q: ['cite'],
};

/** Tags removed with their entire content (never kept as text). */
const DANGEROUS_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'optgroup',
  'datalist',
  'link',
  'meta',
  'base',
  'noscript',
  'svg',
  'math',
  'template',
  'slot',
  'frame',
  'frameset',
  'applet',
  'audio',
  'video',
  'canvas',
  'source',
  'track',
  'picture',
  'dialog',
  'details',
  'summary',
  'label',
  'fieldset',
]);

/** Raw-text elements: their content is consumed to the matching close tag. */
const RAW_TEXT_TAGS = new Set(['script', 'style', 'textarea', 'title']);

/** Elements that never have a close tag. */
const VOID_TAGS = new Set(['br', 'hr', 'img']);

const DEFAULT_SCHEMES = ['http', 'https', 'mailto', 'tel', 'sms'] as const;

const DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|gif|webp)(?:;base64)?,/i;

/** A well-formed character reference (semicolon required — legacy
 *  semicolon-less forms are not consumed in attribute values and are kept
 *  literal here too, matching browser rendering). */
const ENTITY_RE = /^&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][0-9a-zA-Z]*);/;

/** Escape text output. Well-formed entity references are kept verbatim:
 *  they decode to text content (never markup), so they round-trip exactly
 *  as the browser would render them. Everything else is escaped. */
function escapeText(text: string): string {
  return text.replace(/[&<>]/g, (ch, offset, str) => {
    if (ch === '&' && ENTITY_RE.test(str.slice(offset))) return '&';
    return ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&amp;';
  });
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"]/g, (ch, offset, str) => {
    if (ch === '&' && ENTITY_RE.test(str.slice(offset))) return '&';
    return ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&quot;' : '&amp;';
  });
}

/** Decode numeric character references exactly as browsers do in attribute
 *  values (semicolon required there — legacy semicolon-less forms are NOT
 *  consumed in attribute context, so leaving them alone is consistent). */
function decodeNumericEntities(value: string): string {
  return value.replace(
    /&#(?:x([0-9a-fA-F]+)|([0-9]+));/g,
    (_match, hex: string | undefined, dec: string | undefined) => {
      const code = hex ? Number.parseInt(hex, 16) : Number.parseInt(dec ?? '', 10);
      if (
        Number.isNaN(code) || code === 0 || code > 0x10FFFF ||
        (code >= 0xD800 && code <= 0xDFFF)
      ) {
        return '\uFFFD';
      }
      return String.fromCodePoint(code);
    },
  );
}

/**
 * URL scheme policy (ADR-0126): reject anything that could become an
 * executable scheme after browser-side parsing.
 *
 * - Numeric entities are decoded first (they can forge scheme characters).
 * - Any entity reference (named or raw `&`) before the first `:` means the
 *   scheme could be forged by characters we do not decode — reject.
 * - Otherwise the prefix before the first `:` must be exactly an allowed
 *   scheme; control characters in the prefix are rejected (the WHATWG URL
 *   parser strips tabs/newlines before resolving — we stay conservative).
 */
export function isSafeUrl(
  value: string,
  allowedSchemes: ReadonlySet<string>,
  allowDataImages = false,
): boolean {
  // Named entity for the colon (case-insensitive): browsers decode &colon;
  // in attribute values before URL resolution, so a colon-free string can
  // still become `javascript:...`. Conceptually decode it — the prefix guard
  // below then rejects any remaining entity forge attempts.
  const decoded = decodeNumericEntities(value).replace(/&colon;/gi, ':');
  const colon = decoded.indexOf(':');
  if (colon === -1) return true;
  const prefix = decoded.slice(0, colon);
  if (prefix.includes('&')) return false;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*$/.test(prefix)) return false;
  if (allowedSchemes.has(prefix)) return true;
  return allowDataImages && DATA_IMAGE_RE.test(decoded);
}

interface ParsedTag {
  name: string;
  attrs: Map<string, string>;
  selfClosing: boolean;
  /** Index just past the tag's closing `>`. */
  end: number;
}

/** Parse one start tag at `p` (input[p] === '<'). Returns null when the
 *  token is not a tag (input[p] is literal text). */
function parseStartTag(input: string, p: number): ParsedTag | null {
  if (p + 1 >= input.length || !/[a-zA-Z]/.test(input[p + 1])) return null;
  const nameMatch = /^[a-zA-Z][^\t\n\f />]*/.exec(input.slice(p + 1));
  if (!nameMatch) return null;
  const name = nameMatch[0].toLowerCase();
  const attrs = new Map<string, string>();
  let i = p + 1 + nameMatch[0].length;
  let selfClosing = false;
  const n = input.length;

  while (i < n) {
    while (i < n && /[\t\n\f ]/.test(input[i])) i++;
    if (i >= n) return { name, attrs, selfClosing, end: n };
    const ch = input[i];
    if (ch === '>') {
      return { name, attrs, selfClosing, end: i + 1 };
    }
    if (ch === '/') {
      if (input[i + 1] === '>') {
        selfClosing = true;
        return { name, attrs, selfClosing, end: i + 2 };
      }
      i++;
      continue;
    }
    const attrMatch = /^[^\t\n\f />=]+/.exec(input.slice(i));
    if (!attrMatch) {
      i++;
      continue;
    }
    const attrName = attrMatch[0];
    i += attrMatch[0].length;
    while (i < n && /[\t\n\f ]/.test(input[i])) i++;
    if (input[i] === '=') {
      i++;
      while (i < n && /[\t\n\f ]/.test(input[i])) i++;
      let value = '';
      const quote = input[i];
      if (quote === '"' || quote === "'") {
        i++;
        const close = input.indexOf(quote, i);
        value = close === -1 ? input.slice(i) : input.slice(i, close);
        i = close === -1 ? n : close + 1;
      } else {
        const unquoted = /^[^\t\n\f >]+/.exec(input.slice(i));
        if (unquoted) {
          value = unquoted[0];
          i += unquoted[0].length;
        }
      }
      // Attribute names are ASCII case-insensitive and browsers keep the
      // first occurrence of a name regardless of case, so keys are stored
      // lowercased with first-wins semantics (matches emission below and
      // keeps `target` detection in sanitizeHtml case-insensitive too).
      const key = attrName.toLowerCase();
      if (!attrs.has(key)) attrs.set(key, value);
    } else if (attrName !== '/') {
      const key = attrName.toLowerCase();
      if (!attrs.has(key)) attrs.set(key, '');
    }
  }
  return { name, attrs, selfClosing, end: n };
}

/** Skip a close tag `</name...>` at `p`. Returns index past `>` or -1. */
function findCloseTag(input: string, p: number, tagName: string): number {
  const needle = `</${tagName}`;
  let from = p;
  while (true) {
    const hit = input.toLowerCase().indexOf(needle, from);
    if (hit === -1) return -1;
    const after = hit + needle.length;
    if (after >= input.length || /[\t\n\f />]/.test(input[after])) {
      const gt = input.indexOf('>', after);
      return gt === -1 ? -1 : gt + 1;
    }
    from = hit + 1;
  }
}

/**
 * Sanitize untrusted HTML against the allow-list (ADR-0126).
 *
 * See `SanitizeOptions` for policy knobs. The defaults match common safe
 * content: prose, lists, tables, images (http/https/data:image), links
 * (http/https/mailto/tel/sms) with forced `rel="noopener noreferrer"` on
 * `_blank` targets.
 */
export function sanitizeHtml(input: string, options: SanitizeOptions = {}): string {
  const allowedTags = new Set(options.allowedTags ?? DEFAULT_ALLOWED_TAGS);
  const discard = options.disallowedTagsMode === 'discard';
  const allowedSchemes = new Set(options.allowedSchemes ?? DEFAULT_SCHEMES);
  const attrPolicy: Record<string, ReadonlySet<string>> = {};
  for (const [tag, names] of Object.entries(DEFAULT_ALLOWED_ATTRIBUTES)) {
    attrPolicy[tag] = new Set(names);
  }
  const userAttrs = options.allowedAttributes ?? {};
  for (const [tag, names] of Object.entries(userAttrs)) {
    attrPolicy[tag] = new Set(names);
  }
  const globalAttrs = attrPolicy['*'] ?? new Set(DEFAULT_ALLOWED_ATTRIBUTES['*']);

  const n = input.length;
  let out = '';
  let i = 0;

  while (i < n) {
    const lt = input.indexOf('<', i);
    if (lt === -1) {
      out += escapeText(input.slice(i));
      break;
    }
    out += escapeText(input.slice(i, lt));

    const rest = input.slice(lt);
    if (rest.startsWith('<!--')) {
      const end = input.indexOf('-->', lt + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (rest.startsWith('<![CDATA[')) {
      const end = input.indexOf(']]>', lt + 9);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (rest.startsWith('<!') || rest.startsWith('<?')) {
      const end = input.indexOf('>', lt + 2);
      i = end === -1 ? n : end + 1;
      continue;
    }
    if (input[lt + 1] === '/') {
      const closeMatch = /^<\/[a-zA-Z][^\t\n\f />]*/.exec(rest);
      if (closeMatch) {
        const tagName = closeMatch[0].slice(2).toLowerCase();
        const gt = input.indexOf('>', lt);
        i = gt === -1 ? n : gt + 1;
        if (allowedTags.has(tagName) && !VOID_TAGS.has(tagName)) {
          out += `</${tagName}>`;
        }
        continue;
      }
      i = lt + 1;
      continue;
    }

    const tag = parseStartTag(input, lt);
    if (!tag) {
      // `<` followed by something that cannot start a tag name — literal text.
      out += '&lt;';
      i = lt + 1;
      continue;
    }

    if (DANGEROUS_TAGS.has(tag.name)) {
      if (RAW_TEXT_TAGS.has(tag.name) || !tag.selfClosing) {
        const close = findCloseTag(input, lt + tag.name.length + 1, tag.name);
        i = close === -1 ? n : close;
      } else {
        i = tag.end;
      }
      continue;
    }

    if (!allowedTags.has(tag.name)) {
      // Unknown tag: strip it. Keep its text unless discard mode.
      if (discard) {
        const close = findCloseTag(input, lt + tag.name.length + 1, tag.name);
        if (close !== -1 && !tag.selfClosing) {
          i = close;
          continue;
        }
      }
      i = tag.end;
      continue;
    }

    // Allowed tag: emit with allow-listed attributes.
    let attrsOut = '';
    const blankTarget = tag.name === 'a' && tag.attrs.get('target') === '_blank';
    let forcedRel: string | null = null;
    for (const [attrName, rawValue] of tag.attrs) {
      const lower = attrName.toLowerCase();
      const perTag = attrPolicy[tag.name];
      const allowed = perTag?.has(lower) || globalAttrs.has(lower);
      if (!allowed) continue;
      if (lower === 'href' || lower === 'src' || lower === 'cite') {
        // data: URIs stay allowed only where browsers render them as images —
        // an <a href="data:..."> would otherwise be clickable content.
        if (!isSafeUrl(rawValue, allowedSchemes, tag.name === 'img' && lower === 'src')) continue;
      }
      if (lower === 'target' && rawValue !== '_blank') continue;
      // rel is allow-listed, so `rel="opener"` would survive verbatim and
      // defeat the forced noopener below; on _blank merge instead.
      if (lower === 'rel' && blankTarget) {
        const tokens = rawValue.split(/\s+/).filter(Boolean).filter((t) => t !== 'opener');
        forcedRel = [...new Set([...tokens, 'noopener', 'noreferrer'])].join(' ');
        continue;
      }
      attrsOut += ` ${lower}="${escapeAttr(rawValue)}"`;
    }
    if (blankTarget) {
      attrsOut += ` rel="${forcedRel ?? 'noopener noreferrer'}"`;
    }
    out += `<${tag.name}${attrsOut}>`;
    i = tag.end;
  }

  return out;
}
