/**
 * @openelement/core - context.ts tests (Deno)
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { createSsrContext, extractParams, parseQuery } from '../src/context.ts';
import type { RouteEntry } from '@openelement/protocol/framework';

Deno.test('context - extractParams', async (t) => {
  await t.step('extracts single param', () => {
    const params = extractParams('/posts/:id', '/posts/123');
    assertEquals(params, { id: '123' });
  });

  await t.step('extracts multiple params', () => {
    const params = extractParams('/users/:userId/posts/:postId', '/users/42/posts/99');
    assertEquals(params, { userId: '42', postId: '99' });
  });

  await t.step('returns empty object for static routes', () => {
    const params = extractParams('/about', '/about');
    assertEquals(params, {});
  });

  await t.step('handles URL-encoded values', () => {
    const params = extractParams('/search/:query', '/search/hello%20world');
    // URLPattern preserves raw encoding (standard behaviour); consumer decodes if needed
    assertEquals(params, { query: 'hello%20world' });
  });
});

Deno.test('context - parseQuery', async (t) => {
  await t.step('parses query parameters', () => {
    const url = new URL('http://localhost:3000/search?q=test&page=2');
    const query = parseQuery(url);
    assertEquals(query, { q: 'test', page: '2' });
  });

  await t.step('returns empty object for no query', () => {
    const url = new URL('http://localhost:3000/about');
    const query = parseQuery(url);
    assertEquals(query, {});
  });

  await t.step('handles duplicate keys as array', () => {
    const url = new URL('http://localhost:3000/?tag=a&tag=b');
    const query = parseQuery(url);
    assertEquals(query.tag, ['a', 'b']);
  });

  await t.step('handles single key and multi-value key mixed', () => {
    const url = new URL('http://localhost:3000/?tag=a&tag=b&page=1');
    const query = parseQuery(url);
    assertEquals(query.tag, ['a', 'b']);
    assertEquals(query.page, '1');
  });
});

Deno.test('context - createSsrContext', async (t) => {
  await t.step('creates context with params and query', () => {
    const route: RouteEntry = {
      path: '/posts/:id',
      filePath: 'posts/[id].ts',
      type: 'page',
      varName: 'Route_PostsId',
    };
    const url = new URL('http://localhost:3000/posts/42?ref=home');
    const ctx = createSsrContext(route, url);

    assertEquals(ctx.route, route);
    assertEquals(ctx.url, url);
    assertEquals(ctx.params, { id: '42' });
    assertEquals(ctx.query, { ref: 'home' });
    assertEquals(ctx.islands, []);
    assertEquals(ctx.status, 200);
    assertEquals(ctx.data, {});
  });

  await t.step('creates context for static routes', () => {
    const route: RouteEntry = {
      path: '/about',
      filePath: 'about.ts',
      type: 'page',
      varName: 'Route_About',
    };
    const url = new URL('http://localhost:3000/about');
    const ctx = createSsrContext(route, url);

    assertEquals(ctx.params, {});
    assertEquals(ctx.query, {});
  });

  await t.step('accepts requestId option', () => {
    const route: RouteEntry = {
      path: '/',
      filePath: 'index.ts',
      type: 'page',
      varName: 'Route_Index',
    };
    const url = new URL('http://localhost:3000/');
    const ctx = createSsrContext(route, url, { requestId: 'req-123' });

    assertEquals(ctx.requestId, 'req-123');
  });
});
