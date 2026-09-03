import { assertEquals } from '@std/assert';
import {
  escapeAttr,
  escapeAttrValue,
  escapeHtml,
  wrapInDocument,
} from '../src/internal/core/html-escape.ts';

Deno.test('escapeHtml and escapeAttr share one ESCAPE_MAP and identical output', () => {
  const samples = ['', 'a', '&<>"\'', '<script>alert(1)</script>', 'a&b<c>d"e\'f'];
  for (const s of samples) {
    assertEquals(
      escapeAttr(s),
      escapeHtml(s),
      `escapeAttr must equal escapeHtml for ${JSON.stringify(s)}`,
    );
  }
});

Deno.test('escapeHtml escapes all five special characters in one pass', () => {
  assertEquals(escapeHtml('&<>"\''), '&amp;&lt;&gt;&quot;&#39;');
});

Deno.test('escapeAttr escapes the ampersand before quoting (no double escape)', () => {
  assertEquals(escapeAttr('a&b'), 'a&amp;b');
});

Deno.test('escapeAttrValue coerces non-string via String() while escapeHtml returns empty for non-string', () => {
  assertEquals(escapeAttrValue(null), '');
  assertEquals(escapeAttrValue(undefined), '');
  assertEquals(escapeAttrValue(42), '42');
  assertEquals(escapeHtml(null as unknown as string), '');
  assertEquals(escapeHtml(42 as unknown as string), '');
});

Deno.test('wrapInDocument: strips unclosed script tags from headExtras', () => {
  const out = wrapInDocument('x', { headExtras: '<script src="https://evil.example/x.js">' });
  assertEquals(out.includes('<script'), false);
  assertEquals(out.includes('evil.example'), false);
});

Deno.test('wrapInDocument: strips slash-delimited script tags from headExtras', () => {
  const out = wrapInDocument('x', {
    headExtras: '<script/src="https://evil.example/x.js"></script><meta name="ok" content="1">',
  });
  assertEquals(out.includes('<script'), false);
  assertEquals(out.includes('evil.example'), false);
  assertEquals(out.includes('<meta name="ok" content="1">'), true);
});

Deno.test('wrapInDocument: script end tags with attributes close the strip precisely (#1281, CodeQL bad-tag-filter)', () => {
  // Browsers accept `</script\t\n bar>` as a script end tag (attributes on end
  // tags are ignored), so the stripper must match it — and must stop there
  // instead of falling back to the strip-to-EOF pass that eats later markup.
  const out = wrapInDocument('x', {
    headExtras: '<script>alert(1)</script\t\n bar><meta name="ok" content="1">',
  });
  assertEquals(out.includes('alert(1)'), false);
  assertEquals(out.includes('<meta name="ok" content="1">'), true);
});

Deno.test('wrapInDocument: strips re-formed script tags to a fixed point (#1281, CodeQL incomplete sanitization)', () => {
  // Removing the inner pair of a nested fragment re-forms a live outer
  // `<script>...</script>`; the strip must consume it precisely instead of
  // falling back to strip-to-EOF, which would eat the trailing <meta>.
  const out = wrapInDocument('x', {
    headExtras: '<scri<script></script>pt>alert(1)</scri</script>pt><meta name="ok" content="1">',
  });
  assertEquals(out.includes('<script'), false);
  assertEquals(out.includes('alert(1)'), false);
  assertEquals(out.includes('<meta name="ok" content="1">'), true);
});

Deno.test('wrapInDocument: strips on* handlers exposed by an earlier strip (#1281, CodeQL incomplete sanitization)', () => {
  // Removing ` onx='y'` concatenates the leftover ` o` prefix with the
  // `nclick=...` suffix, re-forming a live `onclick` handler that a
  // single-pass strip emits into the document. The strip must repeat until
  // no handler pattern remains.
  const out = wrapInDocument('x', {
    headExtras: `<a o onx='y'nclick=alert(1)>text</a>`,
  });
  assertEquals(out.includes('onclick'), false);
  assertEquals(out.includes('alert(1)'), false);
  assertEquals(out.includes('text'), true);
});

Deno.test('wrapInDocument: --!> counts as a comment close in the balance check (#1281, CodeQL bad-tag-filter)', () => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (msg: unknown) => warnings.push(String(msg));
  try {
    wrapInDocument('x', { headExtras: '<!-- ok --!>' });
    wrapInDocument('x', { headExtras: '<!-- unclosed' });
  } finally {
    console.warn = originalWarn;
  }
  const unbalanced = warnings.filter((w) => w.includes('unbalanced HTML comments'));
  assertEquals(unbalanced.length, 1);
});
