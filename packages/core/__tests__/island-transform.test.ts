/**
 * @openelement/core — Island transform unit tests (Deno)
 */
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { transformIslandSource } from '../src/island-transform.js';

Deno.test('transformIslandSource: adds markers to island files', () => {
  const result = transformIslandSource(
    'export class MyWidget extends HTMLElement {}',
    { islandsDir: 'app/islands', filePath: 'app/islands/my-widget.tsx' },
  );
  assertStringIncludes(result.code, 'export const __island = true');
  assertStringIncludes(result.code, "export const __tagName = 'my-widget'");
  assertEquals(result.islands[0].tagName, 'my-widget');
  assertEquals(result.islands[0].filePath, 'app/islands/my-widget.tsx');
});

Deno.test('transformIslandSource: skips non-island files', () => {
  const result = transformIslandSource(
    'export const x = 1;',
    { islandsDir: 'app/islands', filePath: 'app/routes/index.ts' },
  );
  assertEquals(result.islands.length, 0);
  assertEquals(result.code, 'export const x = 1;');
});

Deno.test('transformIslandSource: normalizes unsafe tag names', () => {
  // "my-mod!" contains an unsafe character, but pathToTagName normalizes it
  // to a valid custom element name instead of rejecting the file outright.
  const result = transformIslandSource('export class X {}', {
    islandsDir: 'app/islands',
    filePath: 'app/islands/my-mod!.tsx',
  });
  assertEquals(result.islands[0].tagName, 'my-mod');
});

Deno.test('transformIslandSource: handles Windows paths', () => {
  const result = transformIslandSource(
    'export class MyWidget extends HTMLElement {}',
    { islandsDir: 'app/islands', filePath: 'app\\islands\\my-widget.tsx' },
  );
  assertEquals(result.islands[0].tagName, 'my-widget');
});

Deno.test('transformIslandSource: prefixes top-level numeric file names', () => {
  const result = transformIslandSource(
    'export class My404 extends HTMLElement {}',
    { islandsDir: 'app/islands', filePath: 'app/islands/404.ts' },
  );
  assertEquals(result.islands[0].tagName, 'el-404');
});

Deno.test('transformIslandSource: adds suffix to tag names without hyphen', () => {
  const result = transformIslandSource(
    'export class Counter extends HTMLElement {}',
    { islandsDir: 'app/islands', filePath: 'app/islands/counter.ts' },
  );
  assertEquals(result.islands[0].tagName, 'counter-page');
});

Deno.test('transformIslandSource: returns empty islands for non-island dir', () => {
  const result = transformIslandSource(
    'export const x = 1;',
    { islandsDir: 'app/islands', filePath: 'app/islands-extra/my-counter.ts' },
  );
  // "islands-extra" != "islands" — the directory match must be exact segment
  assertEquals(result.islands.length, 0);
});
