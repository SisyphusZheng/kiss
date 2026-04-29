/**
 * @kissjs/core - ssr-handler.ts tests (Deno)
 *
 * KISS Architecture: collectIslands removed (moved to build-time map).
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

  await t.step('devMode injects Vite client script', () => {
    const html = wrapInDocument('<h1>Hello</h1>', { devMode: true });
    assertEquals(html.includes('/@vite/client'), true);
  });

  await t.step('devMode with routeModulePath injects registration script', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      devMode: true,
      routeModulePath: '/app/routes/index.ts',
    });
    assertEquals(html.includes('/@vite/client'), true);
    assertEquals(html.includes("import '/app/routes/index.ts'"), true);
  });

  await t.step('devMode without routeModulePath only injects Vite client', () => {
    const html = wrapInDocument('<h1>Hello</h1>', { devMode: true });
    assertEquals(html.includes('/@vite/client'), true);
    assertEquals(html.includes("import '"), false);
  });

  await t.step('includes headExtras', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      headExtras: '<link rel="stylesheet" href="/app.css">',
    });
    assertEquals(html.includes('<link rel="stylesheet" href="/app.css">'), true);
  });

  await t.step('defaults to title=KISS App and lang=en', () => {
    const html = wrapInDocument('<h1>Hello</h1>');
    assertEquals(html.includes('<title>KISS App</title>'), true);
    assertEquals(html.includes('lang="en"'), true);
  });

  await t.step('escapes HTML in meta description', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      meta: { description: 'Test "quote" & <script>' },
    });
    assertEquals(html.includes('&quot;'), true);
    assertEquals(html.includes('&amp;'), true);
    assertEquals(html.includes('&lt;script&gt;'), true);
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

  await t.step('accepts RouteEntry instead of status number', () => {
    const error = new Error('Render failed');
    // In production mode, status defaults to 500 when RouteEntry is passed
    // deno-lint-ignore no-explicit-any
    const html = renderSsrError(error, { type: 'page', path: '/test' } as any, false);
    assertEquals(html.includes('Error 500'), true);
    assertEquals(html.includes('Render failed'), true);
  });

  await t.step('handles error without stack in dev mode', () => {
    const error = new Error('No stack');
    error.stack = undefined;
    const html = renderSsrError(error, 500, true);
    assertEquals(html.includes('No stack'), true);
    // Should not have a <pre> tag when no stack
    assertEquals(html.includes('<pre>'), false);
  });

  await t.step('handles error with stack in dev mode', () => {
    const error = new Error('With stack');
    const html = renderSsrError(error, 500, true);
    assertEquals(html.includes('With stack'), true);
    assertEquals(html.includes('<pre>'), true);
  });

  await t.step('escapes HTML in error message', () => {
    const error = new Error('<script>alert("xss")</script>');
    const html = renderSsrError(error, 500, false);
    assertEquals(html.includes('&lt;script&gt;'), true);
    assertEquals(html.includes('<script>alert'), false);
  });
});
