/**
 * sanitize.test.ts - Allow-list sanitizer test battery (ADR-0126, #894).
 *
 * Covers the classic DOMPurify/OWASP mutation-XSS vectors: entity scheme
 * smuggling, raw-text tricks, foreign-content (svg/math) payloads, breakout
 * attempts, plus the idempotence property
 * (sanitizeHtml(sanitizeHtml(x)) === sanitizeHtml(x)).
 */

import { assertEquals } from '@std/assert';
import { isSafeUrl, sanitizeHtml } from '../src/sanitize.ts';

Deno.test('sanitizeHtml: keeps plain prose', () => {
  assertEquals(sanitizeHtml('hello world'), 'hello world');
});

Deno.test('sanitizeHtml: keeps allowed tags with allowed attributes', () => {
  assertEquals(
    sanitizeHtml('<p class="x">a <strong>b</strong></p>'),
    '<p class="x">a <strong>b</strong></p>',
  );
});

Deno.test('sanitizeHtml: keeps links and images', () => {
  assertEquals(
    sanitizeHtml('<a href="/relative">x</a><img src="https://e.com/i.png" alt="i">'),
    '<a href="/relative">x</a><img src="https://e.com/i.png" alt="i">',
  );
});

Deno.test('sanitizeHtml: removes script tags with their content', () => {
  assertEquals(sanitizeHtml('<script>alert(1)</script>safe'), 'safe');
});

Deno.test('sanitizeHtml: removes script via case and whitespace variants', () => {
  assertEquals(sanitizeHtml('<SCRIPT>alert(1)</SCRIPT>'), '');
  assertEquals(sanitizeHtml('<script  src="x.js">alert(1)</script >'), '');
});

Deno.test('sanitizeHtml: removes raw-text element content up to its close tag', () => {
  assertEquals(sanitizeHtml('<script>var s = "</p>"; alert(1)</script>'), '');
  assertEquals(
    sanitizeHtml('<style>p{background:url(x)}</style><p>ok</p>'),
    '<p>ok</p>',
  );
});

Deno.test('sanitizeHtml: escapes literal script text', () => {
  assertEquals(
    sanitizeHtml('&lt;script&gt;alert(1)&lt;/script&gt;'),
    '&lt;script&gt;alert(1)&lt;/script&gt;',
  );
});

Deno.test('sanitizeHtml: handles the double-less-than mutation vector', () => {
  // `<` is literal text; `alert(1)` is real script-element content and is dropped.
  assertEquals(sanitizeHtml('<<script>alert(1)</script>'), '&lt;');
});

Deno.test('sanitizeHtml: handles bogus tag names containing <', () => {
  // WHATWG: `<scr<script>` tokenizes as one bogus tag — no script forms.
  assertEquals(sanitizeHtml('<scr<script>alert(1)</script>'), 'alert(1)');
});

Deno.test('sanitizeHtml: handles missing close tag (skips to end)', () => {
  assertEquals(sanitizeHtml('<script>alert(1)'), '');
  assertEquals(sanitizeHtml('<iframe src="x">content'), '');
});

Deno.test('sanitizeHtml: strips on* attributes', () => {
  assertEquals(
    sanitizeHtml('<img src="x" onerror="alert(1)">'),
    '<img src="x">',
  );
  assertEquals(sanitizeHtml('<p onclick="alert(1)">x</p>'), '<p>x</p>');
});

Deno.test('sanitizeHtml: strips unknown attributes', () => {
  assertEquals(sanitizeHtml('<p data-x="1" style="color:red">x</p>'), '<p>x</p>');
});

Deno.test('sanitizeHtml: strips dangerous attributes on allowed tags', () => {
  assertEquals(
    sanitizeHtml('<a href="https://ok" name="f">x</a>'),
    '<a href="https://ok">x</a>',
  );
});

Deno.test('sanitizeHtml: rejects plain javascript:', () => {
  assertEquals(sanitizeHtml('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
  assertEquals(sanitizeHtml('<img src="javascript:alert(1)">'), '<img>');
});

Deno.test('sanitizeHtml: rejects numeric-entity forged schemes', () => {
  assertEquals(sanitizeHtml('<a href="java&#x73;cript:alert(1)">x</a>'), '<a>x</a>');
  assertEquals(sanitizeHtml('<a href="&#106;avascript:alert(1)">x</a>'), '<a>x</a>');
  assertEquals(sanitizeHtml('<a href="jav&#x09;ascript:alert(1)">x</a>'), '<a>x</a>');
});

Deno.test('sanitizeHtml: rejects named-entity forged schemes', () => {
  assertEquals(sanitizeHtml('<a href="java&colon;script:alert(1)">x</a>'), '<a>x</a>');
  assertEquals(sanitizeHtml('<a href="java&NewLine;script:alert(1)">x</a>'), '<a>x</a>');
});

Deno.test('sanitizeHtml: rejects sole-&colon; scheme forging (colon-free input)', () => {
  const hrefPayloads = [
    'javascript&colon;alert(document.domain)',
    'data&colon;text/html;base64,PGI+',
    'vbscript&colon;msgbox(1)',
    'java&colon;script&colon;alert(1)',
    'java&COLON;script:alert(1)',
  ];
  for (const value of hrefPayloads) {
    assertEquals(sanitizeHtml(`<a href="${value}">x</a>`), '<a>x</a>', value);
  }
  assertEquals(
    sanitizeHtml('<img src="java&colon;script:alert(1)">'),
    '<img>',
  );
  assertEquals(
    sanitizeHtml('<q cite="java&colon;script:alert(1)">q</q>'),
    '<q>q</q>',
  );
});

Deno.test('sanitizeHtml: rejects raw control-character smuggling', () => {
  assertEquals(sanitizeHtml('<a href="\njavascript:alert(1)">x</a>'), '<a>x</a>');
  assertEquals(sanitizeHtml('<a href="\tjava\tscript:alert(1)">x</a>'), '<a>x</a>');
});

Deno.test('sanitizeHtml: rejects vbscript and data:text', () => {
  assertEquals(sanitizeHtml('<a href="vbscript:msgbox(1)">x</a>'), '<a>x</a>');
  assertEquals(sanitizeHtml('<a href="data:text/html;base64,PGI+">x</a>'), '<a>x</a>');
});

Deno.test('sanitizeHtml: data: images only survive on img src', () => {
  assertEquals(
    sanitizeHtml('<a href="data:image/png;base64,AAA">x</a>'),
    '<a>x</a>',
  );
  assertEquals(
    sanitizeHtml('<img src="data:image/png;base64,AAA">'),
    '<img src="data:image/png;base64,AAA">',
  );
});

Deno.test('sanitizeHtml: rejects data:image/svg+xml but keeps raster data URIs', () => {
  assertEquals(
    sanitizeHtml('<img src="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pg==">'),
    '<img>',
  );
  assertEquals(
    sanitizeHtml('<img src="data:image/png;base64,AAA">'),
    '<img src="data:image/png;base64,AAA">',
  );
});

Deno.test('sanitizeHtml: keeps allowed schemes', () => {
  assertEquals(
    sanitizeHtml('<a href="mailto:a@b.c">m</a>'),
    '<a href="mailto:a@b.c">m</a>',
  );
  assertEquals(
    sanitizeHtml('<a href="https://x/?a=b&amp;c=d">l</a>'),
    '<a href="https://x/?a=b&amp;c=d">l</a>',
  );
  assertEquals(sanitizeHtml('<a href="tel:+123">t</a>'), '<a href="tel:+123">t</a>');
});

Deno.test('sanitizeHtml: drops svg/math subtrees entirely', () => {
  assertEquals(sanitizeHtml('<svg><script>alert(1)</script></svg>'), '');
  assertEquals(
    sanitizeHtml('<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>'),
    '',
  );
  assertEquals(
    sanitizeHtml(
      '<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>',
    ),
    '',
  );
});

Deno.test('sanitizeHtml: drops form/input/link/meta/iframe subtrees', () => {
  assertEquals(sanitizeHtml('<form><input name="x"></form>'), '');
  assertEquals(sanitizeHtml('<iframe src="https://evil"></iframe>'), '');
  assertEquals(sanitizeHtml('<meta http-equiv="refresh" content="0;url=//evil">'), '');
  assertEquals(sanitizeHtml('<link rel="stylesheet" href="//evil.css">'), '');
});

Deno.test('sanitizeHtml: strips unknown tags but keeps their text by default', () => {
  assertEquals(sanitizeHtml('<marquee>hello</marquee>'), 'hello');
  assertEquals(sanitizeHtml('a<custom-el>x</custom-el>b'), 'axb');
});

Deno.test('sanitizeHtml: discards unknown tag content in discard mode', () => {
  assertEquals(
    sanitizeHtml('<marquee>hello</marquee>', { disallowedTagsMode: 'discard' }),
    '',
  );
  assertEquals(
    sanitizeHtml('<div><custom-el>x</custom-el></div>', { disallowedTagsMode: 'discard' }),
    '<div></div>',
  );
});

Deno.test('sanitizeHtml: only allows _blank targets and forces noopener rel', () => {
  assertEquals(
    sanitizeHtml('<a href="https://x" target="_blank">l</a>'),
    '<a href="https://x" target="_blank" rel="noopener noreferrer">l</a>',
  );
  assertEquals(
    sanitizeHtml('<a href="https://x" target="_self">l</a>'),
    '<a href="https://x">l</a>',
  );
});

Deno.test('sanitizeHtml: rel=opener on _blank is neutralized, not passed through', () => {
  assertEquals(
    sanitizeHtml('<a href="https://x" target="_blank" rel="opener">l</a>'),
    '<a href="https://x" target="_blank" rel="noopener noreferrer">l</a>',
  );
  assertEquals(
    sanitizeHtml('<a href="https://x" target="_blank" rel="nofollow opener">l</a>'),
    '<a href="https://x" target="_blank" rel="nofollow noopener noreferrer">l</a>',
  );
  assertEquals(
    sanitizeHtml('<a href="https://x" target="_blank" rel="noopener">l</a>'),
    '<a href="https://x" target="_blank" rel="noopener noreferrer">l</a>',
  );
  assertEquals(
    sanitizeHtml('<a href="https://x" rel="opener">l</a>'),
    '<a href="https://x" rel="opener">l</a>',
  );
});

Deno.test('sanitizeHtml: uppercase TARGET="_blank" still forces noopener rel', () => {
  assertEquals(
    sanitizeHtml('<a href="https://x" TARGET="_blank">l</a>'),
    '<a href="https://x" target="_blank" rel="noopener noreferrer">l</a>',
  );
  assertEquals(
    sanitizeHtml('<a href="https://x" TaRgEt="_blank" REL="opener">l</a>'),
    '<a href="https://x" target="_blank" rel="noopener noreferrer">l</a>',
  );
  // First case-insensitive occurrence wins, matching browser semantics.
  assertEquals(
    sanitizeHtml('<a href="https://x" TARGET="_self" target="_blank">l</a>'),
    '<a href="https://x">l</a>',
  );
});

Deno.test('sanitizeHtml: uppercase TARGET result is idempotent', () => {
  const once = sanitizeHtml('<a href="https://x" TARGET="_blank">l</a>');
  assertEquals(sanitizeHtml(once), once);
});

Deno.test('sanitizeHtml: escapes attribute values', () => {
  assertEquals(
    sanitizeHtml('<p title="a&quot;onload=alert(1)">x</p>'),
    '<p title="a&quot;onload=alert(1)">x</p>',
  );
});

Deno.test('sanitizeHtml: strips comments, doctype and CDATA', () => {
  assertEquals(sanitizeHtml('<!-- x -->hi'), 'hi');
  assertEquals(sanitizeHtml('<!DOCTYPE html><p>hi</p>'), '<p>hi</p>');
  assertEquals(sanitizeHtml('<![CDATA[<script>alert(1)</script>]]>x'), 'x');
});

Deno.test('sanitizeHtml: keeps unbalanced allowed tags inert', () => {
  assertEquals(sanitizeHtml('<p><b>bold'), '<p><b>bold');
});

const IDEMPOTENCE_VECTORS = [
  'hello &amp; goodbye',
  '<p class="x">a <strong>b</strong></p>',
  '<script>alert(1)</script><img src=x onerror=alert(1)><a href="java&colon;script:alert(1)">x</a>',
  '<<script>alert(1)</script>',
  '<svg><script>alert(1)</script></svg><p>ok</p>',
  '<marquee>text</marquee><p title="a&quot;b">x</p>',
  '<a href="data:text/html,<b>x</b>">d</a><img src="data:image/png;base64,AAA">',
  '<TABLE><TR><TD>x</TD></TR></TABLE>',
];

for (const input of IDEMPOTENCE_VECTORS) {
  Deno.test(`sanitizeHtml: is idempotent for: ${input.slice(0, 40)}`, () => {
    const once = sanitizeHtml(input);
    assertEquals(sanitizeHtml(once), once);
  });
}

const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel', 'sms']);

Deno.test('isSafeUrl: accepts allowed schemes and relatives', () => {
  assertEquals(isSafeUrl('https://x', SAFE_SCHEMES), true);
  assertEquals(isSafeUrl('/path', SAFE_SCHEMES), true);
  assertEquals(isSafeUrl('mailto:a@b', SAFE_SCHEMES), true);
  assertEquals(isSafeUrl('data:image/png;base64,AAA', SAFE_SCHEMES, true), true);
});

Deno.test('isSafeUrl: data: images are opt-in per tag', () => {
  assertEquals(isSafeUrl('data:image/png;base64,AAA', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('data:image/png;base64,AAA', SAFE_SCHEMES, true), true);
  assertEquals(isSafeUrl('data:text/html,<b>x</b>', SAFE_SCHEMES, true), false);
});

Deno.test('isSafeUrl: rejects executable schemes and smuggling', () => {
  assertEquals(isSafeUrl('javascript:alert(1)', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('&#106;avascript:alert(1)', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('java&colon;script:alert(1)', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('javascript&colon;alert(1)', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('data&colon;text/html;base64,PGI+', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('java&COLON;script:alert(1)', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('data:text/html,<b>x</b>', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('data:image/svg+xml,<svg/>', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('\njavascript:alert(1)', SAFE_SCHEMES), false);
  assertEquals(isSafeUrl('./:x', SAFE_SCHEMES), false);
});
