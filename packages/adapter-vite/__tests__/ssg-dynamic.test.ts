import { assertEquals } from '@std/assert';
import { join } from 'node:path';
import { expandI18nLocales } from '../src/internal/ssg/ssg-dynamic.ts';

Deno.test('expandI18nLocales skips the default locale output', async () => {
  const root = await Deno.makeTempDir();
  const calls: string[] = [];
  try {
    await expandI18nLocales(
      { i18nOptions: { locales: ['en', 'zh'], defaultLocale: 'en' } },
      (_path, options) => {
        calls.push(String(options?.locale));
        return Promise.resolve({
          html: '<html></html>',
          errors: [],
          hydrationHints: [],
          componentCount: 0,
          renderTimeMs: 0,
        });
      },
      [{ path: '/guide', tagName: 'guide-page', isDynamic: false, paramNames: [] }],
      undefined,
      { root, outDir: 'dist' },
      root,
      'dist',
    );
    assertEquals(calls, ['zh']);
    let defaultOutputExists = true;
    try {
      await Deno.stat(join(root, 'dist', 'en', 'guide', 'index.html'));
    } catch {
      defaultOutputExists = false;
    }
    assertEquals(defaultOutputExists, false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
