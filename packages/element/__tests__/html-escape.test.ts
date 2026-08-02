import { assertEquals } from '@std/assert';
import { escapeAttr, escapeAttrValue, escapeHtml } from '../src/internal/core/html-escape.ts';

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
