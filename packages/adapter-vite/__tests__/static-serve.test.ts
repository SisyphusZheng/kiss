/**
 * @openelement/adapter-vite - static-serve.ts tests (#732)
 *
 * Pins the shared MIME table, static candidate rules, and traversal guard so
 * cli/start.ts and the request-time fixture server cannot drift apart again.
 */

import { assert, assertEquals } from '@std/assert';
import { join } from 'node:path';
import { contentTypeFor, staticFileCandidates, tryStatic } from '../src/internal/static-serve.ts';

Deno.test('contentTypeFor covers the merged MIME table (#732)', () => {
  assertEquals(contentTypeFor('/d/index.html'), 'text/html; charset=utf-8');
  assertEquals(contentTypeFor('/d/app.js'), 'text/javascript; charset=utf-8');
  // Added to close the drift: start.ts lacked these three.
  assertEquals(contentTypeFor('/d/app.mjs'), 'text/javascript; charset=utf-8');
  assertEquals(contentTypeFor('/d/favicon.ico'), 'image/x-icon');
  assertEquals(contentTypeFor('/d/sitemap.xml'), 'application/xml; charset=utf-8');
  assertEquals(contentTypeFor('/d/unknown.bin'), 'application/octet-stream');
});

Deno.test('staticFileCandidates: exact, /index.html, then .html', () => {
  assertEquals(staticFileCandidates('/'), ['index.html', 'index.html/index.html']);
  assertEquals(staticFileCandidates('/about'), ['about', 'about/index.html', 'about.html']);
  assertEquals(staticFileCandidates('/about/'), ['about/', 'about/index.html']);
  assertEquals(staticFileCandidates('/a.html'), ['a.html', 'a.html/index.html']);
  assertEquals(staticFileCandidates('/x y'), ['x y', 'x y/index.html', 'x y.html']);
});

Deno.test('tryStatic serves files and refuses path escape', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(join(root, 'index.html'), '<h1>home</h1>');
    await Deno.mkdir(join(root, 'about'));
    await Deno.writeTextFile(join(root, 'about', 'index.html'), '<h1>about</h1>');
    await Deno.writeTextFile(join(root, 'contact.html'), '<h1>contact</h1>');
    await Deno.writeTextFile(join(root, 'feed.xml'), '<rss/>');

    const home = tryStatic(root, '/');
    assert(home);
    assertEquals(await home.text(), '<h1>home</h1>');

    const about = tryStatic(root, '/about');
    assert(about);
    assertEquals(await about.text(), '<h1>about</h1>');

    const contact = tryStatic(root, '/contact');
    assert(contact);
    assertEquals(await contact.text(), '<h1>contact</h1>');

    const feed = tryStatic(root, '/feed.xml');
    assert(feed);
    assertEquals(feed.headers.get('content-type'), 'application/xml; charset=utf-8');

    assertEquals(tryStatic(root, '/missing'), null);
    // Path escape outside the static root must never be served.
    assertEquals(tryStatic(root, '/../secret.txt'), null);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
