import { assertEquals } from '@std/assert';
import { diffSnapshots, normalize, parseArgs } from './check-static-output-freeze.ts';

// M15 (#1230): the freeze gate's normalizers decide which byte differences
// are masked before comparison — logic that can turn a real failure into a
// success. Pin the masking surface and the diff verdicts.

const enc = (text: string) => new TextEncoder().encode(text);
const dec = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

Deno.test('freeze args: defaults, flags and values parse distinctly', () => {
  assertEquals(parseArgs([]), { baseline: 'v0.41.2', selfCheck: false });
  assertEquals(parseArgs(['--self-check']), { baseline: 'v0.41.2', selfCheck: true });
  assertEquals(parseArgs(['--baseline', 'v0.43.0']), { baseline: 'v0.43.0', selfCheck: false });
  // A trailing flag without a value must not swallow the next flag as a value.
  assertEquals(parseArgs(['--baseline', '--self-check']), {
    baseline: 'v0.41.2',
    selfCheck: true,
  });
});

Deno.test('freeze normalize: island manifests mask only builtAt', () => {
  const path = 'island-manifests/home.json';
  const a = normalize(path, enc(JSON.stringify({ builtAt: '2026-01-01', islands: ['x'] })));
  const b = normalize(path, enc(JSON.stringify({ builtAt: '2026-09-04', islands: ['x'] })));
  assertEquals(dec(a), dec(b));
  assertEquals(dec(a).includes('builtAt'), false);
  // Any other field difference survives masking.
  const c = normalize(path, enc(JSON.stringify({ builtAt: '2026-01-01', islands: ['y'] })));
  assertEquals(dec(a) === dec(c), false);
});

Deno.test('freeze normalize: pagefind entry canonicalizes hash, language order and set ordering', () => {
  const path = 'pagefind/pagefind-entry.json';
  const a = normalize(
    path,
    enc(JSON.stringify({
      version: 1,
      languages: { zh: { hash: 'h1', pages: 3 }, en: { hash: 'h2', pages: 5 } },
      include_characters: [98, 97],
    })),
  );
  const b = normalize(
    path,
    enc(JSON.stringify({
      version: 1,
      languages: { en: { hash: 'CHANGED', pages: 5 }, zh: { hash: 'ALSO-CHANGED', pages: 3 } },
      include_characters: [97, 98],
    })),
  );
  assertEquals(dec(a), dec(b));
  assertEquals(dec(a).includes('hash'), false);
});

Deno.test('freeze normalize: non-normalized paths pass bytes through untouched', () => {
  const bytes = enc('<html>builtAt stays in ordinary HTML</html>');
  assertEquals(normalize('index.html', bytes), bytes);
  assertEquals(normalize('assets/chunk-abc123.js', bytes), bytes);
});

Deno.test('freeze diff: identical, content-differing and one-sided snapshots are distinguished', () => {
  const a = new Map([['index.html', enc('<html/>')], ['app.js', enc('1')]]);
  const b = new Map([['index.html', enc('<html/>')], ['app.js', enc('1')]]);
  assertEquals(diffSnapshots(a, b, 'a', 'b'), []);

  const changed = new Map([['index.html', enc('<html/>')], ['app.js', enc('2')]]);
  assertEquals(diffSnapshots(a, changed, 'a', 'b'), ['content differs: app.js (a: 1B, b: 1B)']);

  const missing = new Map([['index.html', enc('<html/>')]]);
  assertEquals(diffSnapshots(a, missing, 'a', 'b'), ['only in a: app.js']);
  assertEquals(diffSnapshots(missing, a, 'a', 'b'), ['only in b: app.js']);
});
