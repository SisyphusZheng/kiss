/** www truth checker unit + integration tests (#1159). */
import { assert, assertEquals } from '@std/assert';
import {
  blogFrontmatterLang,
  checkWwwTruth,
  extractHeaderNav,
  findRouteLocaleFailures,
  roadmapCurrentVersion,
} from './check-www-truth.ts';

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

Deno.test('roadmapCurrentVersion: quoted property keys parse the same (#1343)', () => {
  const source = `
const entries = {
  en: [
    { 'version': 'v0.44.0-beta.2', 'theme': 'x', 'state': 'next', 'stamp': 'CURRENT' },
    { 'version': 'v0.43.3', 'theme': 'y', 'state': 'stable' },
  ],
};
`;
  assertEquals(roadmapCurrentVersion(source), 'v0.44.0-beta.2');
});

Deno.test('findRouteLocaleFailures: an en-only content record fails (#1307)', () => {
  const masquerade = `
const content = {
  en: { title: 'Hello' },
} as const;
`;
  const failures = findRouteLocaleFailures('www/app/routes/example.tsx', masquerade);
  assertEquals(failures.length, 1);
  assert(failures[0].message.includes("'zh'"));

  const bilingual = `
const content = {
  en: { title: 'Hello' },
  zh: { title: '你好' },
} as const;
`;
  assertEquals(findRouteLocaleFailures('www/app/routes/example.tsx', bilingual), []);
  // Route modules without a locale-keyed content record are out of scope.
  assertEquals(findRouteLocaleFailures('www/app/routes/plain.tsx', 'const x = 1;'), []);
});

Deno.test('blogFrontmatterLang: posts must declare their original language (#1307)', () => {
  const declared = `---\ntitle: 'Post'\ndate: '2026-01-01'\nlang: 'zh'\n---\n\nBody\n`;
  assertEquals(blogFrontmatterLang('post.md', declared), []);
  const bomDeclared = `﻿---\ntitle: 'Post'\ndate: '2026-01-01'\nlang: 'en'\n---\n\nBody\n`;
  assertEquals(blogFrontmatterLang('post.md', bomDeclared), []);
  const missing = `---\ntitle: 'Post'\ndate: '2026-01-01'\n---\n\nBody\n`;
  assertEquals(blogFrontmatterLang('post.md', missing).length, 1);
  const invalid = `---\ntitle: 'Post'\ndate: '2026-01-01'\nlang: 'fr'\n---\n\nBody\n`;
  const invalidFailures = blogFrontmatterLang('post.md', invalid);
  assertEquals(invalidFailures.length, 1);
  assert(invalidFailures[0].message.includes("'fr'"));
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
