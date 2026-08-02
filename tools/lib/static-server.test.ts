import { assertEquals, assertStringIncludes } from '@std/assert';
import { contentType, serveStatic } from './static-server.ts';

Deno.test('contentType maps known extensions and falls back to octet-stream', () => {
  assertEquals(contentType('/a/b.html'), 'text/html; charset=utf-8');
  assertEquals(contentType('/a/b.JS'), 'text/javascript; charset=utf-8');
  assertEquals(contentType('/a/b.css'), 'text/css; charset=utf-8');
  assertEquals(contentType('/a/b.svg'), 'image/svg+xml');
  assertEquals(contentType('no-extension'), 'application/octet-stream');
});

Deno.test('serveStatic serves files, pretty URLs, directory index, and SPA fallback', async () => {
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(`${root}/index.html`, '<h1>root</h1>');
  await Deno.writeTextFile(`${root}/app.js`, 'console.log(1)');
  await Deno.mkdir(`${root}/guide`);
  await Deno.writeTextFile(`${root}/guide/index.html`, '<h1>guide</h1>');
  await Deno.writeTextFile(`${root}/about.html`, '<h1>about</h1>');

  const server = serveStatic(root);
  try {
    const page = await (await fetch(`${server.origin}/about`)).text();
    assertStringIncludes(page, 'about');

    const dir = await (await fetch(`${server.origin}/guide/`)).text();
    assertStringIncludes(dir, 'guide');

    const js = await fetch(`${server.origin}/app.js`);
    assertEquals(js.headers.get('content-type'), 'text/javascript; charset=utf-8');

    // SPA-style fallback: unknown path serves the root index.
    const spa = await (await fetch(`${server.origin}/no/such/route`)).text();
    assertStringIncludes(spa, 'root');
  } finally {
    await server.close();
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('serveStatic rejects NUL with 403, returns 404 when nothing matches', async () => {
  const root = await Deno.makeTempDir();
  const server = serveStatic(root);
  try {
    // `..` cannot be exercised through fetch (WHATWG URL parsing resolves dot
    // segments, including %2e, before the request leaves the client), but the
    // NUL byte survives percent-decoding into the guard.
    const nul = await fetch(`${server.origin}/%00`);
    assertEquals(nul.status, 403);
    await nul.body?.cancel();

    // No root index.html present: nothing matches.
    const missing = await fetch(`${server.origin}/anything`);
    assertEquals(missing.status, 404);
    await missing.body?.cancel();
  } finally {
    await server.close();
    await Deno.remove(root, { recursive: true });
  }
});
