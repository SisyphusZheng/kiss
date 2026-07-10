// deno-lint-ignore no-unversioned-import
import { assertEquals } from 'jsr:@std/assert';
import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { extractMeta, scanNavData } from '../src/nav/scanner.ts';

const TMP_DIR = join(import.meta.dirname!, '__tmp_nav_test__');

function setup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });
}

function cleanup() {
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
}

Deno.test('extractMeta: parses simple meta export', () => {
  const source = `
export const meta = { section: 'Guide', label: 'Getting Started', order: 10 };
export class Page extends LitElement {}
`;
  const meta = extractMeta(source);
  assertEquals(meta, { section: 'Guide', label: 'Getting Started', order: 10 });
});

Deno.test('extractMeta: parses meta without order', () => {
  const source = `export const meta = { section: 'Guide', label: 'Architecture' };`;
  const meta = extractMeta(source);
  assertEquals(meta, { section: 'Guide', label: 'Architecture' });
});

Deno.test('extractMeta: returns null for file without meta', () => {
  const source = `export class Page extends LitElement {}`;
  const meta = extractMeta(source);
  assertEquals(meta, null);
});

Deno.test('extractMeta: returns null for meta without required fields', () => {
  const source = `export const meta = { section: 'Guide' };`;
  const meta = extractMeta(source);
  assertEquals(meta, null);
});

Deno.test('extractMeta: handles single-quoted values', () => {
  const source =
    `export const meta = { section: 'Start Here', label: 'Framework Positioning', order: 5 };`;
  const meta = extractMeta(source);
  assertEquals(meta, { section: 'Start Here', label: 'Framework Positioning', order: 5 });
});

Deno.test('scanNavData: scans route files and aggregates NavSection[]', async () => {
  setup();

  // Create mock route files
  mkdirSync(join(TMP_DIR, 'guide'), { recursive: true });
  writeFileSync(
    join(TMP_DIR, 'guide', 'getting-started.ts'),
    `export const meta = { section: 'Start Here', label: 'Getting Started', order: 20 };\nexport class Page {}`,
  );
  writeFileSync(
    join(TMP_DIR, 'guide', 'architecture.ts'),
    `export const meta = { section: 'Start Here', label: 'Architecture', order: 30 };\nexport class Page {}`,
  );
  writeFileSync(
    join(TMP_DIR, 'guide', 'positioning.ts'),
    `export const meta = { section: 'Start Here', label: 'Positioning', order: 10 };\nexport class Page {}`,
  );

  const sections = await scanNavData({ routesDir: TMP_DIR });

  assertEquals(sections.length, 1);
  assertEquals(sections[0].section, 'Start Here');
  assertEquals(sections[0].items.length, 3);
  // Should be sorted by order
  assertEquals(sections[0].items[0].path, '/guide/positioning');
  assertEquals(sections[0].items[0].label, 'Positioning');
  assertEquals(sections[0].items[1].path, '/guide/getting-started');
  assertEquals(sections[0].items[2].path, '/guide/architecture');

  cleanup();
});

Deno.test('scanNavData: groups multiple sections', async () => {
  setup();

  mkdirSync(join(TMP_DIR, 'guide'), { recursive: true });
  mkdirSync(join(TMP_DIR, 'examples'), { recursive: true });
  writeFileSync(
    join(TMP_DIR, 'guide', 'routing.ts'),
    `export const meta = { section: 'Core Model', label: 'Routing' };\nexport class Page {}`,
  );
  writeFileSync(
    join(TMP_DIR, 'examples', 'hello.ts'),
    `export const meta = { section: 'Examples', label: 'Hello World', order: 10 };\nexport class Page {}`,
  );

  const sections = await scanNavData({ routesDir: TMP_DIR });

  assertEquals(sections.length, 2);
  // Sections preserve first-seen order (directory scan order)
  const sectionNames = sections.map((s) => s.section);
  assertEquals(sectionNames.includes('Core Model'), true);
  assertEquals(sectionNames.includes('Examples'), true);

  cleanup();
});

Deno.test('scanNavData: skips files starting with _', async () => {
  setup();

  mkdirSync(join(TMP_DIR, 'guide'), { recursive: true });
  writeFileSync(
    join(TMP_DIR, 'guide', 'page.ts'),
    `export const meta = { section: 'Guide', label: 'Page' };\nexport class Page {}`,
  );
  writeFileSync(
    join(TMP_DIR, 'guide', '_renderer.ts'),
    `// This should be skipped\nexport const renderer = {};`,
  );

  const sections = await scanNavData({ routesDir: TMP_DIR });

  assertEquals(sections.length, 1);
  assertEquals(sections[0].items.length, 1);
  assertEquals(sections[0].items[0].label, 'Page');

  cleanup();
});

Deno.test('scanNavData: returns empty for missing directory', async () => {
  const sections = await scanNavData({ routesDir: '/nonexistent/path' });
  assertEquals(sections, []);
});

Deno.test('scanNavData: defaults routesDir to app/routes when omitted', async () => {
  const sections = await scanNavData({});
  assertEquals(Array.isArray(sections), true);
});
