/** Content Graph adapter + generator integration tests (#1157). */
import { assert, assertEquals } from '@std/assert';
import {
  extractMarkdownReferences,
  extractRoadmapTimeline,
  scanPublicRoutes,
} from './content-graph-adapters.ts';
import { generateContentGraphJson } from '../generate-content-graph.ts';
import type { ContentGraph } from './content-graph.ts';

Deno.test('extractMarkdownReferences: classifies internal links, skips external and fragments', () => {
  const content = [
    'See [the guide](/guide/getting-started) and [localized](/zh/guide/api#x).',
    'Relative [peer](./other.md) and [translation](other.zh.md) plus [anchor](#top).',
    'External [site](https://example.com/docs) and [mail](mailto:a@b.c) are skipped.',
    '[ref]: /architecture/islands',
  ].join('\n');
  const references = extractMarkdownReferences(
    content,
    (target) =>
      target.startsWith('/')
        ? { kind: 'route', target }
        : { kind: 'entry', target: `article:guide/${target.replace(/\.mdx?$/, '')}` },
  );
  assertEquals(references, [
    { kind: 'route', target: '/guide/getting-started', line: 1 },
    { kind: 'route', target: '/zh/guide/api', line: 1 },
    { kind: 'entry', target: 'article:guide/./other', line: 2 },
    { kind: 'entry', target: 'article:guide/other.zh', line: 2 },
    { kind: 'route', target: '/architecture/islands', line: 4 },
  ]);
});

Deno.test('extractRoadmapTimeline: reads the bilingual timeline through the TS AST', () => {
  const source = `
const entries: Record<'en' | 'zh', TimelineEntry[]> = {
  en: [
    { version: 'v0.44.0-beta.1', theme: 'qualification', copy: 'English copy.', state: 'next', stamp: 'CURRENT', status: 'prerelease' },
  ],
  zh: [
    { version: 'v0.44.0-beta.1', theme: '限定', copy: '中文文案。', state: 'next', stamp: 'CURRENT', status: 'prerelease' },
  ],
};
`;
  const timeline = extractRoadmapTimeline(source);
  assertEquals(Object.keys(timeline).sort(), ['en', 'zh']);
  assertEquals(timeline.en.length, 1);
  assertEquals(timeline.en[0].version, 'v0.44.0-beta.1');
  assertEquals(timeline.en[0].stamp, 'CURRENT');
  assertEquals(timeline.zh[0].copy, '中文文案。');
  assertEquals(timeline.en[0].line > 0, true);
});

Deno.test('scanPublicRoutes: discovers the real www route universe', async () => {
  const routes = await scanPublicRoutes();
  for (const expected of ['/guide/getting-started', '/roadmap', '/apilist', '/changelog']) {
    assert(routes.includes(expected), `missing route ${expected}`);
  }
  assert(routes.every((route) => !route.includes(':')), 'dynamic segments must be excluded');
});

Deno.test('generateContentGraphJson: real repo sources produce a valid deterministic graph', async () => {
  const first = await generateContentGraphJson();
  const second = await generateContentGraphJson();
  assertEquals(first, second);

  const graph = JSON.parse(first) as ContentGraph;
  const ids = new Set(graph.entries.map((entry) => entry.id));
  // Every adapter contributes: markdown, public API data, compiler metadata,
  // roadmap and release truth.
  assert(ids.has('article:guide/getting-started:en'), 'markdown adapter missing');
  assert(ids.has('api:@openelement/element'), 'api adapter missing');
  assert(ids.has('element:open-dialog'), 'compiler metadata adapter missing');
  assert(ids.has('roadmap:en:0'), 'roadmap adapter missing');
  assert(ids.has('release:state'), 'release adapter missing');

  // Locale pairs are symmetric and translated.
  const en = graph.entries.find((entry) => entry.id === 'article:guide/getting-started:en');
  const zh = graph.entries.find((entry) => entry.id === 'article:guide/getting-started:zh');
  assert(en && zh, 'guide locale pair missing');
  assertEquals(en.alternates, [{ locale: 'zh', id: 'article:guide/getting-started:zh' }]);
  assertEquals(zh.alternates, [{ locale: 'en', id: 'article:guide/getting-started:en' }]);
});
