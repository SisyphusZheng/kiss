/** www truth checker unit + integration tests (#1159). */
import { assert, assertEquals } from '@std/assert';
import { checkWwwTruth, extractHeaderNav, roadmapCurrentVersion } from './check-www-truth.ts';

Deno.test('extractHeaderNav: reads the vite.config headerNav literal via AST', () => {
  const source = `
openElement({
  content: {
    nav: {
      routesDir: 'app/routes',
      headerNav: [
        { href: '/docs', label: 'Docs' },
        { href: 'https://github.com/open-element/openelement', label: 'GitHub' },
      ],
    },
  },
});
`;
  assertEquals(extractHeaderNav(source), [
    { href: '/docs', label: 'Docs' },
    { href: 'https://github.com/open-element/openelement', label: 'GitHub' },
  ]);
  assertEquals(extractHeaderNav('const x = 1;'), []);
});

Deno.test('roadmapCurrentVersion: reads the CURRENT-stamped entry via AST', () => {
  const source = `
const entries = {
  en: [
    { version: 'v0.44.0-beta.1', theme: 'x', state: 'next', stamp: 'CURRENT' },
    { version: 'v0.43.3', theme: 'y', state: 'stable' },
  ],
};
`;
  assertEquals(roadmapCurrentVersion(source), 'v0.44.0-beta.1');
  assertEquals(roadmapCurrentVersion('const entries = {};'), undefined);
});

Deno.test('checkWwwTruth: current repository truth passes', async () => {
  const failures = await checkWwwTruth();
  assertEquals(failures, []);
});

Deno.test('checkWwwTruth integration sanity: real nav covers the core routes', async () => {
  // The real committed nav must name these routes; a hand-edit drift would
  // flip checkWwwTruth above, so this guards the test itself against vacuity.
  const nav = await Deno.readTextFile('www/app/data/_generated-nav.ts');
  for (const route of ['/apilist', '/roadmap', '/guide/getting-started']) {
    assert(nav.includes(`"${route}"`), `generated nav is missing ${route}`);
  }
});
