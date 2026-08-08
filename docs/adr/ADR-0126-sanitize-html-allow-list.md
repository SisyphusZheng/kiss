# ADR-0126: Built-in Allow-List HTML Sanitizer (`sanitizeHtml`)

- Status: ACCEPTED (implemented on the v0.42.0-alpha.15 train, #894)
- Date: 2026-08-08
- Builds on: #894, #903 (shared dangerous-key predicate precedent)

## Context

`trustRenderHtml` is a trust-boundary marker, not a sanitizer
(`packages/element/src/internal/core/security.ts:55-63`): it brands
caller-supplied HTML and warns that the caller must sanitize upstream.
Every consumer must integrate their own sanitizer; the common cases
(rendering user-generated markdown, CMS content, third-party fragments)
have no ergonomic safe-by-default API, and forgetting sanitization is a
real XSS gap.

#894 proposes a built-in `sanitizeHtml(html, options?)` allow-list
sanitizer alongside `trustRenderHtml`, keeping the latter as the explicit
opt-out for callers who sanitized upstream.

## Constraints found during the decision

The alpha.15 plan suggested `sanitize-html` as the dependency precedent
(already a packed adapter-vite dependency), but a hard gate closes that
route:

- `tools/check-deno-api-free.ts:20`: only `npm:@preact/signals-core` is
  permitted in `packages/element/src`; every other `npm:` and any `node:`
  specifier fails `deno task deno-api:check`. The gate covers the whole
  `packages/element/src` tree, so a `@openelement/element/sanitize`
  subpath could not import sanitize-html either. DOMPurify is DOM-based
  (needs jsdom outside the browser) and likewise barred.
- Cross-runtime requirement: the sanitizer must run in SSR (Deno/Node,
  no DOM) and in browsers — a no-DOM tokenizer is the only portable shape.

## Decision

1. **New dependency-free `sanitizeHtml` in element**, exported from a
   dedicated `@openelement/element/sanitize` subpath entry (mirrors the
   `build-utils` subpath precedent; main entry and bundle stay untouched).
2. **Allow-list policy** (defaults):
   - Allowed tags: `p, div, span, a, ul, ol, li, h1-h6, em, strong, b, i,
     code, pre, blockquote, br, hr, img, figure, figcaption, small, sub,
     sup, table, thead, tbody, tfoot, tr, td, th, caption, dl, dt, dd,
     mark, ins, del, time, abbr, q, cite`.
   - Allowed attributes per tag: `class, id, title, lang` globally; `a`:
     `href` (scheme-validated), `target` (only `_blank`, forces
     `rel="noopener noreferrer"`), `rel`, `title`; `img`: `src`
     (scheme-validated), `alt, title, width, height, loading, decoding`;
     `td/th`: `colspan, rowspan, headers`; `ol`: `start`; `time`:
     `datetime`; `abbr/q`: `title`/`cite` (scheme-validated). No `on*`
     attribute can survive — the attribute map is exhaustive.
   - Dangerous tags (`script, style, iframe, object, embed, form, input,
     button, textarea, select, option, optgroup, link, meta, base,
     noscript, svg, math, template, slot, frame, frameset, applet,
     audio, video, canvas, source, track, picture, dialog`) are removed
     **with their content**.
   - Unknown tags: tag stripped, text content kept (matches
     sanitize-html/DOMPurify defaults); `options.disallowedTagsMode:
     'discard'` also drops the content.
3. **URL scheme policy** (`href/src/cite`): numeric-entity-decode the
   value first; a value containing any entity reference (named or raw
   `&`) before the first `:` is rejected (a named entity could forge a
   scheme after browser-side decoding); otherwise the prefix before the
   first `:` must be a scheme in `{http, https, mailto, tel, sms}` or
   `data:image/(png|jpe?g|gif|webp)` — everything else (javascript:,
   vbscript:, data:text/html, control-char smuggling, protocol-relative
   with entity tricks) is dropped. The prefix regex also rejects
   control characters, matching the WHATWG URL parser's tolerance
   strictly on the conservative side.
4. **Safety by construction**: output is produced only from allow-listed
   tags (balanced or void) and text with `&`, `<`, `>` escaped; the
   tokenizer mirrors WHATWG tokenization rules for the boundary cases
   that matter (`<` inside a tag name re-tokenizes; comments/CDATA/
   doctype are dropped; raw-text elements consume to their close tag).
   Because no untrusted byte can reach the output unescaped, browser
   re-parse of the result cannot construct markup the sanitizer did not
   emit.
5. `trustRenderHtml` and the security guide stay: "use `sanitizeHtml` by
   default; `trustRenderHtml` only when you sanitized upstream."

## Consequences

- New public subpath `@openelement/element/sanitize` (package surface
  snapshot must be updated; `export-files:check` regenerates).
- Test battery: DOMPurify/OWASP-style mutation-XSS payloads
  (numeric/named entity scheme smuggling, raw-text tricks, mathml/svg
  vectors, breakout payloads) + idempotence property
  (`sanitizeHtml(sanitizeHtml(x)) === sanitizeHtml(x)`).
- Known conservative false positives (documented): URLs with entity
  references before their first colon, and relative URLs containing a
  colon in the path — both are dropped. Rare enough to accept for the
  security win.

## Evidence

- Trust boundary today: `security.ts:55-63`
- Gate barring npm deps in element: `tools/check-deno-api-free.ts:20`
- Subpath precedent: `packages/element/deno.json` exports map
  (`./build-utils`); adapter-vite sanitize-html usage stays untouched
  (`adapter-vite/src/head-injection.ts`)
