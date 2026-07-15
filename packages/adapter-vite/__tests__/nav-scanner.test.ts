import { assertEquals } from '@std/assert';
import { extractMeta } from '../src/internal/content/nav/scanner.ts';

Deno.test('extractMeta parses nested metadata with TypeScript AST', () => {
  assertEquals(
    extractMeta(`
      export const meta = {
        section: 'Guide',
        label: \`Getting Started\`,
        order: -2,
        nested: { braces: { doNotTruncate: true } },
      } as const;
    `),
    { section: 'Guide', label: 'Getting Started', order: -2 },
  );
});

Deno.test('extractMeta ignores comments and strings that resemble metadata', () => {
  assertEquals(extractMeta(`const text = "export const meta = { section: 'Fake' }";`), null);
});
