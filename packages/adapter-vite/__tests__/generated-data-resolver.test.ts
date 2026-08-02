import { assert, assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createGeneratedDataResolverPlugin,
  GENERATED_BLOG_DATA_ID,
  GENERATED_I18N_ID,
  GENERATED_NAV_ID,
  generatedDataPath,
} from '../src/generated-data-resolver.ts';

Deno.test('generatedDataPath maps generated namespace to app data files', () => {
  const normalized = (path: string | null) => path?.replaceAll('\\', '/');

  assert(
    normalized(generatedDataPath('/site', GENERATED_NAV_ID))?.endsWith(
      '/site/app/data/_generated-nav.ts',
    ),
  );
  assert(
    normalized(generatedDataPath('/site', GENERATED_BLOG_DATA_ID))?.endsWith(
      '/site/app/data/_generated-blog-data.ts',
    ),
  );
  assert(
    normalized(generatedDataPath('/site', GENERATED_I18N_ID))?.endsWith(
      '/site/app/data/_generated-i18n-data.ts',
    ),
  );
});

Deno.test('generatedDataPath resolves unknown ids to null', () => {
  assertEquals(generatedDataPath('/site', '@openelement/generated/nope'), null);
});

Deno.test('generated data resolver resolves only @openelement/generated namespace', () => {
  const plugin = createGeneratedDataResolverPlugin({ root: '/site' });
  const resolveId = plugin.resolveId as (id: string) => string | null;

  assertEquals(resolveId(GENERATED_NAV_ID), '\0open:generated-data:@openelement/generated/nav');
  assertEquals(resolveId('@openelement/content/' + 'nav'), null);
  assertEquals(resolveId('virtual:open-' + 'nav'), null);
});

Deno.test('generated data resolver provides fallback modules before first generation', () => {
  const plugin = createGeneratedDataResolverPlugin({ root: '/missing-site' });
  const load = plugin.load as (id: string) => string | null;

  assertStringIncludes(
    load('\0open:generated-data:@openelement/generated/i18n') ?? '',
    'getDefaultLocale',
  );
});

// ─── #671: build mode is fail-closed for required generated data ───

Deno.test('generated data resolver throws for a required id whose file is missing', () => {
  const plugin = createGeneratedDataResolverPlugin({
    root: '/missing-site',
    required: [GENERATED_NAV_ID],
  });
  const load = plugin.load as (id: string) => string | null;

  const error = assertThrows(
    () => load('\0open:generated-data:@openelement/generated/nav'),
    Error,
    'fail-closed',
  );
  assertStringIncludes(error.message, '_generated-nav.ts');
});

Deno.test('generated data resolver keeps the fallback for ids that are not required', () => {
  const plugin = createGeneratedDataResolverPlugin({
    root: '/missing-site',
    required: [GENERATED_NAV_ID],
  });
  const load = plugin.load as (id: string) => string | null;

  // blog-data is not required (its plugin never ran): dev fallback still applies.
  assertStringIncludes(
    load('\0open:generated-data:@openelement/generated/blog-data') ?? '',
    'getPostBySlug',
  );
});

Deno.test('generated data resolver loads a required id from disk when the write succeeded', () => {
  const root = Deno.makeTempDirSync();
  try {
    const dataDir = join(root, 'app', 'data');
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      join(dataDir, '_generated-i18n-data.ts'),
      'export const locales = ["en"];',
      'utf-8',
    );

    const plugin = createGeneratedDataResolverPlugin({
      root,
      required: [GENERATED_I18N_ID],
    });
    const resolveId = plugin.resolveId as (id: string) => string | null;

    // The on-disk file wins over the virtual fallback module.
    assertEquals(resolveId(GENERATED_I18N_ID), join(dataDir, '_generated-i18n-data.ts'));
  } finally {
    Deno.removeSync(root, { recursive: true });
  }
});
