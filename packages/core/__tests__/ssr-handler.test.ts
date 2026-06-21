/**
 * @openelement/core - wrapInDocument & renderSsrError tests (Deno)
 *
 * Both functions are now in html-escape.ts (ssr-handler.ts was removed
 * as a pure re-export facade).
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { renderSsrError, wrapInDocument } from '../src/html-escape.ts';

Deno.test('html-escape - wrapInDocument', async (t) => {
  await t.step('wraps body in full HTML document', () => {
    const html = wrapInDocument('<h1>Hello</h1>', { title: 'Test' });
    assertEquals(html.includes('<!DOCTYPE html>'), true);
    assertEquals(html.includes('<title>Test</title>'), true);
    assertEquals(html.includes('<h1>Hello</h1>'), true);
  });

  await t.step('includes client script', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      clientScript:
        '<script type="module">customElements.define("x-demo", class extends HTMLElement {})</script>',
    });
    assertEquals(html.includes('customElements.define("x-demo"'), true);
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

  await t.step('devScripts injects Vite client script', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      devScripts: '<script type="module" src="/@vite/client"></script>',
    });
    assertEquals(html.includes('/@vite/client'), true);
  });

  await t.step('devScripts with route module registration', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      devScripts:
        '<script type="module" src="/@vite/client"></script>\n  <script type="module">\nimport \'/app/routes/index.ts\';\n</script>',
    });
    assertEquals(html.includes('/@vite/client'), true);
    assertEquals(html.includes("import '/app/routes/index.ts'"), true);
  });

  await t.step('devScripts without route module only injects Vite client', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      devScripts: '<script type="module" src="/@vite/client"></script>',
    });
    assertEquals(html.includes('/@vite/client'), true);
    assertEquals(html.includes("import '"), false);
  });

  await t.step('includes headExtras', () => {
    const html = wrapInDocument('<h1>Hello</h1>', {
      headExtras: '<link rel="stylesheet" href="/app.css">',
    });
    assertEquals(html.includes('<link rel="stylesheet" href="/app.css">'), true);
  });

  await t.step('defaults to title=openElement and lang=en', () => {
    const html = wrapInDocument('<h1>Hello</h1>');
    assertEquals(html.includes('<title>openElement</title>'), true);
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

Deno.test('html-escape - renderSsrError', async (t) => {
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
    const html = renderSsrError(error, {
      type: 'page',
      path: '/test',
      filePath: 'test.tsx',
      varName: 'TestPage',
    }, false);
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
