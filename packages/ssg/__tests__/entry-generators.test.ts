import { assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.0';
import type { ClientIslandEntry } from '@openelement/protocol/ssg';
import { generateClientEntry, validateIslandModuleSpecifier } from '../src/entry-generators.ts';
import {
  quoteGeneratedJavaScriptStringLiteral,
  quoteGeneratedJavaScriptValue,
} from '../src/codegen-literals.ts';

Deno.test('generated client entry string literals escape JavaScript code boundaries', () => {
  assertEquals(
    quoteGeneratedJavaScriptStringLiteral('</script>\u2028\u2029'),
    '"\\u003C/script\\u003E\\u2028\\u2029"',
  );
});

Deno.test('quoteGeneratedJavaScriptValue escapes code boundaries in object values', () => {
  assertEquals(
    quoteGeneratedJavaScriptValue({ reason: '</script>\u2028' }),
    '{"reason":"\\u003C/script\\u003E\\u2028"}',
  );
});

Deno.test('validateIslandModuleSpecifier accepts admitted relative, root, and bare specifiers', () => {
  validateIslandModuleSpecifier('./islands/counter.ts');
  validateIslandModuleSpecifier('/islands/counter.ts');
  validateIslandModuleSpecifier('@scope/pkg/island.js');
  validateIslandModuleSpecifier('plain-pkg');
});

Deno.test('validateIslandModuleSpecifier rejects remote or traversal specifiers', () => {
  assertThrows(() => validateIslandModuleSpecifier('https://example.com/x.js'));
  assertThrows(() => validateIslandModuleSpecifier('//cdn.example.com/x.js'));
  assertThrows(() => validateIslandModuleSpecifier('../secret.ts'));
  assertThrows(() => validateIslandModuleSpecifier('./islands/../secret.ts'));
  assertThrows(() => validateIslandModuleSpecifier(''));
});

Deno.test('generateClientEntry emits admitted dynamic import factories', () => {
  const islands: ClientIslandEntry[] = [
    { tagName: 'my-island', modulePath: './islands/my-island.ts', strategy: 'load' },
  ];
  const code = generateClientEntry(islands);
  assertEquals(
    code.includes('() => import("./islands/my-island.ts")'),
    true,
  );
  assertEquals(code.includes('customElements.define("my-island", mod.default)'), true);
});

Deno.test('generateClientEntry rejects un-admitted module specifiers', () => {
  const islands: ClientIslandEntry[] = [
    { tagName: 'bad-island', modulePath: 'https://evil.com/x.js', strategy: 'load' },
  ];
  assertThrows(() => generateClientEntry(islands));
});
