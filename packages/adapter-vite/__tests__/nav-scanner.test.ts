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

Deno.test('scanNavData excludes the 404 page but keeps lookalikes like rfc-4040 (#1039)', async () => {
  const { join } = await import('@std/path');
  const { scanNavData } = await import('../src/internal/content/nav/scanner.ts');
  const root = await Deno.makeTempDir();
  try {
    const route = (label: string) =>
      `export const meta = { section: 'Guide', label: '${label}' } as const;`;
    await Deno.writeTextFile(join(root, 'index.tsx'), route('Home'));
    await Deno.writeTextFile(join(root, '404.tsx'), route('Not Found'));
    await Deno.writeTextFile(join(root, 'rfc-4040.tsx'), route('RFC 4040'));
    const sections = await scanNavData({ routesDir: root });
    const labels = sections.flatMap((s) => s.items.map((i) => i.label)).sort();
    assertEquals(labels, ['Home', 'RFC 4040']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
