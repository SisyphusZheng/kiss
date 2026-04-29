/**
 * @kissjs/core - html-template.ts tests (Deno)
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { htmlTemplatePlugin, extractRouteMeta } from '../src/html-template.ts';

// ─── htmlTemplatePlugin ────────────────────────────────────────

Deno.test('htmlTemplatePlugin returns a Vite plugin with correct name', () => {
  const plugin = htmlTemplatePlugin();
  assertEquals(plugin.name, 'kiss:html-template');
});

Deno.test('htmlTemplatePlugin has transformIndexHtml hook defined', () => {
  const plugin = htmlTemplatePlugin();
  // transformIndexHtml exists (may be function or object shape depending on Vite version)
  assertExists(plugin.transformIndexHtml);
});

Deno.test('htmlTemplatePlugin accepts options without error', () => {
  const plugin = htmlTemplatePlugin({
    routesDir: 'app/routes',
    islandsDir: 'app/islands',
  });
  assertEquals(plugin.name, 'kiss:html-template');
});

// ─── extractRouteMeta ─────────────────────────────────────────

Deno.test('extractRouteMeta extracts title from meta export', () => {
  const mod = { meta: { title: 'My Page', description: 'A test page' } };
  const result = extractRouteMeta(mod as unknown as Record<string, unknown>);
  assertEquals(result.title, 'My Page');
  assertEquals(result.description, 'A test page');
});

Deno.test('extractRouteMeta individual exports override meta', () => {
  const mod = {
    meta: { title: 'Meta Title', description: 'Meta Desc' },
    title: 'Individual Title',
    description: 'Individual Desc',
  };
  const result = extractRouteMeta(mod as unknown as Record<string, unknown>);
  assertEquals(result.title, 'Individual Title');
  assertEquals(result.description, 'Individual Desc');
});

Deno.test('extractRouteMeta handles module with no meta', () => {
  const mod = { title: 'Just Title' };
  const result = extractRouteMeta(mod as unknown as Record<string, unknown>);
  assertEquals(result.title, 'Just Title');
  assertEquals(result.description, undefined);
});

Deno.test('extractRouteMeta handles completely empty module', () => {
  const result = extractRouteMeta({});
  assertEquals(result.title, undefined);
  assertEquals(result.description, undefined);
});

Deno.test('extractRouteMeta ignores non-string title/description in meta', () => {
  const mod = { meta: { title: 123, description: null } };
  const result = extractRouteMeta(mod as unknown as Record<string, unknown>);
  // String() conversion happens for truthy values; null/undefined are skipped by if-check
  assertEquals(result.title, '123');
  // null is falsy, so description stays undefined
  assertEquals(result.description, undefined);
});
