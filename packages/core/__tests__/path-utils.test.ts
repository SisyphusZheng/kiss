/**
 * @openelement/core - path-utils.ts tests (Deno).
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  normalizeBasePath,
  normalizeRoutePath,
  normalizeSeparators,
  pathToTagName,
} from '../src/path-utils.ts';

Deno.test('path-utils - normalizeSeparators', async (t) => {
  await t.step('replaces backslashes with forward slashes', () => {
    assertEquals(normalizeSeparators('a\\b\\c'), 'a/b/c');
  });

  await t.step('collapses repeated forward slashes', () => {
    assertEquals(normalizeSeparators('a//b///c'), 'a/b/c');
  });

  await t.step('supports hyphen separator', () => {
    assertEquals(normalizeSeparators('a//b--c', '-'), 'a-b-c');
  });

  await t.step('returns empty string for empty input', () => {
    assertEquals(normalizeSeparators(''), '');
  });
});

Deno.test('path-utils - pathToTagName', async (t) => {
  await t.step('converts nested paths to kebab case', () => {
    assertEquals(pathToTagName('routes/docs/index.tsx'), 'routes-docs-index');
  });

  await t.step('strips leading ./ and /', () => {
    assertEquals(pathToTagName('./routes/about.ts'), 'routes-about');
    assertEquals(pathToTagName('/routes/about.ts'), 'routes-about');
  });

  await t.step('ensures at least one hyphen', () => {
    assertEquals(pathToTagName('about.ts'), 'about-page');
  });

  await t.step('prefixes with el- when path starts with a digit', () => {
    assertEquals(pathToTagName('404.ts'), 'el-404');
  });

  await t.step('handles empty input', () => {
    assertEquals(pathToTagName(''), '');
  });

  await t.step('lowercases result and ensures hyphen', () => {
    assertEquals(pathToTagName('MyComponent.ts'), 'mycomponent-page');
  });
});

Deno.test('path-utils - normalizeBasePath', async (t) => {
  await t.step('normalizes to leading and trailing slash', () => {
    assertEquals(normalizeBasePath('docs'), '/docs/');
    assertEquals(normalizeBasePath('/docs'), '/docs/');
    assertEquals(normalizeBasePath('docs/'), '/docs/');
  });

  await t.step('collapses multiple slashes', () => {
    assertEquals(normalizeBasePath('//docs//'), '/docs/');
  });

  await t.step('root stays root', () => {
    assertEquals(normalizeBasePath('/'), '/');
    assertEquals(normalizeBasePath(''), '/');
    assertEquals(normalizeBasePath('   '), '/');
  });
});

Deno.test('path-utils - normalizeRoutePath', async (t) => {
  await t.step('adds leading slash and removes trailing slash', () => {
    assertEquals(normalizeRoutePath('docs/'), '/docs');
    assertEquals(normalizeRoutePath('/docs/'), '/docs');
    assertEquals(normalizeRoutePath('docs'), '/docs');
  });

  await t.step('root stays root', () => {
    assertEquals(normalizeRoutePath('/'), '/');
    assertEquals(normalizeRoutePath(''), '/');
    assertEquals(normalizeRoutePath('   '), '/');
  });

  await t.step('trims whitespace', () => {
    assertEquals(normalizeRoutePath('  docs/  '), '/docs');
  });
});
