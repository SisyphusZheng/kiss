/**
 * @openelement/router/i18n — locale-aware path normalization.
 *
 * Pure function, no DOM dependency. Verifies prefix detection, default-locale
 * fallback, localized-path construction, and default-locale identity.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { normalizeLocalePath } from '../src/i18n.ts';

Deno.test('i18n: strips a recognized locale prefix', () => {
  const result = normalizeLocalePath('/en/about', {
    locales: ['en', 'fr', 'de'],
    defaultLocale: 'en',
  });
  assertEquals(result, {
    locale: 'en',
    path: '/about',
    localizedPath: '/about',
    isDefaultLocalePath: true,
  });
});

Deno.test('i18n: prefixes a non-default locale path', () => {
  const result = normalizeLocalePath('/about', {
    locales: ['en', 'fr', 'de'],
    defaultLocale: 'en',
  });
  assertEquals(result, {
    locale: 'en',
    path: '/about',
    localizedPath: '/about',
    isDefaultLocalePath: true,
  });

  const fr = normalizeLocalePath('/fr/about', {
    locales: ['en', 'fr', 'de'],
    defaultLocale: 'en',
  });
  assertEquals(fr.locale, 'fr');
  assertEquals(fr.path, '/about');
  assertEquals(fr.localizedPath, '/fr/about');
  assertEquals(fr.isDefaultLocalePath, false);
});

Deno.test('i18n: falls back to default locale when no prefix', () => {
  const result = normalizeLocalePath('products/widget', {
    locales: ['en', 'ja'],
    defaultLocale: 'ja',
  });
  assertEquals(result.locale, 'ja');
  assertEquals(result.path, '/products/widget');
  assertEquals(result.localizedPath, '/products/widget');
  assertEquals(result.isDefaultLocalePath, true);
});

Deno.test('i18n: root path maps to locale + "/"', () => {
  const result = normalizeLocalePath('/', {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  });
  assertEquals(result.locale, 'en');
  assertEquals(result.path, '/');
  assertEquals(result.localizedPath, '/');
});

Deno.test('i18n: uses first locale when defaultLocale not in list', () => {
  const result = normalizeLocalePath('/', {
    locales: ['fr', 'de'],
    defaultLocale: 'en',
  });
  assertEquals(result.locale, 'fr');
  assertEquals(result.isDefaultLocalePath, true);
});

Deno.test('i18n: empty locales list falls back to defaultLocale', () => {
  const result = normalizeLocalePath('/de/foo', {
    locales: [],
    defaultLocale: 'en',
  });
  assertEquals(result.locale, 'en');
  assertEquals(result.path, '/de/foo');
});
