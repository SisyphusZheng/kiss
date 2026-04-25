/**
 * @kissjs/core - ssr-handler.ts tests (Deno)
 *
 * DIA: collectIslands removed (moved to build-time map).
 * Only renderSsrError and wrapInDocument remain.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { renderSsrError, wrapInDocument } from '../src/ssr-handler.ts';

Deno.test('ssr-handler - wrapInDocument', async (t) => {
  await t.step('wraps body in full HTML document', () => {
    const html = wrapInDocument('<h1>Hello</h1>', { title: 'Test' });
    assertEquals(html.includes('<!DOCTYPE html>'), true);
    assertEquals(html.includes('<title>Test</title>'), true);
    assertEquals(html.includes('<h1>Hello</h1>'), true);
  });

  await t.step('includes hydration script', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      hydrateScript: '<script type="module">hydrate()</script>',
    });
    assertEquals(html.includes('<script type="module">hydrate()</script>'), true);
  });

  await t.step('supports custom lang attribute', () => {
    const html = wrapInDocument('<h1>Hello</h1>', { lang: 'zh-CN' });
    assertEquals(html.includes('lang="zh-CN"'), true);
  });

  await t.step('supports meta tags', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      meta: { description: 'Test page' },
    });
    assertEquals(html.includes('name="description"'), true);
    assertEquals(html.includes('content="Test page"'), true);
  });
});

Deno.test('ssr-handler - renderSsrError', async (t) => {
  await t.step('shows error details in dev mode', () => {
    const error = new Error('Something went wrong');
    const html = renderSsrError(error, 500, true);
    assertEquals(html.includes('SSR Render Error'), true);
    assertEquals(html.includes('Something went wrong'), true);
  });

  await t.step('shows generic message in production', () => {
    const error = new Error('Something went wrong');
    const html = renderSsrError(error, 500, false);
    assertEquals(html.includes('Something went wrong'), true);
    // Production error page should NOT contain "SSR Render Error"
    assertEquals(html.includes('SSR Render Error'), false);
  });
});
