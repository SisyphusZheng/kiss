/** Built-output link/fragment/SEO checker unit tests (#1159). */
import { assertEquals } from '@std/assert';
import {
  anchorsFragment,
  extractBuiltLinks,
  findSeoFailures,
  resolveBuiltPath,
} from './www-links.ts';

Deno.test('extractBuiltLinks: keeps internal targets, skips external/protocol/fragment-only', () => {
  const links = extractBuiltLinks(
    'index.html',
    [
      '<a href="/guide/getting-started">x</a>',
      '<a href="/guide/api#signals">y</a>',
      '<a href="#top">z</a>',
      '<a href="https://example.com">e</a>',
      '<a href="mailto:a@b.c">m</a>',
      '<a href="//cdn.example.com/x.js">p</a>',
      '<script src="/assets/app.js"></script>',
      '<img src="data:image/png;base64,xx">',
    ].join('\n'),
  );
  assertEquals(links.map((link) => [link.path, link.fragment]), [
    ['/guide/getting-started', ''],
    ['/guide/api', 'signals'],
    ['', 'top'],
    ['/assets/app.js', ''],
  ]);
});

Deno.test('resolveBuiltPath: routes, files and assets', () => {
  const files = new Set([
    'index.html',
    'guide/getting-started/index.html',
    'assets/app.js',
    '404.html',
  ]);
  const exists = (file: string) => files.has(file);
  assertEquals(resolveBuiltPath('/', exists), 'index.html');
  assertEquals(
    resolveBuiltPath('/guide/getting-started', exists),
    'guide/getting-started/index.html',
  );
  assertEquals(
    resolveBuiltPath('/guide/getting-started/', exists),
    'guide/getting-started/index.html',
  );
  assertEquals(resolveBuiltPath('/assets/app.js', exists), 'assets/app.js');
  assertEquals(resolveBuiltPath('/404', exists), '404.html');
  assertEquals(resolveBuiltPath('/nope', exists), null);
  assertEquals(resolveBuiltPath('/assets/missing.js', exists), null);
});

Deno.test('anchorsFragment: id and name anchor the fragment', () => {
  const html = '<section id="signals"></section><a name="legacy"></a>';
  assertEquals(anchorsFragment(html, 'signals'), true);
  assertEquals(anchorsFragment(html, 'legacy'), true);
  assertEquals(anchorsFragment(html, 'missing'), false);
});

Deno.test('findSeoFailures: title/description/og:title invariants', () => {
  const good = '<head><title>t</title>' +
    '<meta name="description" content="A sufficiently long description."/>' +
    '<meta property="og:title" content="t"/></head>';
  assertEquals(findSeoFailures(good, 'index.html'), []);
  const failures = findSeoFailures('<head></head>', 'index.html');
  assertEquals(failures.length, 3);
  assertEquals(
    findSeoFailures('<title>a</title><title>b</title>' + good, 'index.html')[0].message
      .includes('exactly one <title>'),
    true,
  );
});
