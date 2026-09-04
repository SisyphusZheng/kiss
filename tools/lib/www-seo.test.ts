/** Unit tests for the www SEO plan + application (#1307). */
import { assert, assertEquals } from '@std/assert';
import type { ContentGraph } from './content-graph.ts';
import {
  applySeoToHtml,
  brandedTitle,
  buildSeoPlan,
  builtFileToRoute,
  routeToBuiltFile,
} from './www-seo.ts';

const LOCALES = ['en', 'zh'] as const;

function graphWith(entries: Partial<ContentGraph['entries'][number]>[]): ContentGraph {
  return {
    version: 1,
    generated: 'deterministic',
    entries: entries.map((entry, index) => ({
      id: `entry:${index}`,
      kind: 'article',
      locale: 'en',
      source: { path: 'x.md' },
      alternates: [],
      references: [],
      fingerprint: `f${index}`,
      data: {},
      ...entry,
    })) as ContentGraph['entries'],
  };
}

Deno.test('builtFileToRoute maps built files to localized routes', () => {
  assertEquals(builtFileToRoute('index.html', LOCALES), { route: '/', locale: 'en' });
  assertEquals(builtFileToRoute('apilist/index.html', LOCALES), {
    route: '/apilist',
    locale: 'en',
  });
  assertEquals(builtFileToRoute('zh/apilist/index.html', LOCALES), {
    route: '/apilist',
    locale: 'zh',
  });
  assertEquals(builtFileToRoute('zh/index.html', LOCALES), { route: '/', locale: 'zh' });
  assertEquals(builtFileToRoute('404.html', LOCALES), { route: '/404', locale: 'en' });
  assertEquals(builtFileToRoute('assets/app.js', LOCALES), null);
});

Deno.test('routeToBuiltFile mirrors the SSG output layout', () => {
  assertEquals(routeToBuiltFile('/'), 'index.html');
  assertEquals(routeToBuiltFile('/zh'), 'zh/index.html');
  assertEquals(routeToBuiltFile('/apilist'), 'apilist/index.html');
  assertEquals(routeToBuiltFile('/404'), '404.html');
  assertEquals(routeToBuiltFile('/zh/404'), 'zh/404/index.html');
});

Deno.test('brandedTitle appends the brand unless already present', () => {
  assertEquals(brandedTitle('API Reference'), 'API Reference — openElement');
  assertEquals(
    brandedTitle('openElement — The Web, composed.'),
    'openElement — The Web, composed.',
  );
});

Deno.test('buildSeoPlan covers route-level and content pages, fail-closed', () => {
  const graph = graphWith([
    {
      id: 'article:guide/getting-started:en',
      route: '/guide/getting-started',
      locale: 'en',
      alternates: [{ locale: 'zh', id: 'article:guide/getting-started:zh' }],
      data: { title: 'Getting Started', lede: 'Install and run your first element.' },
    },
    {
      id: 'article:guide/getting-started:zh',
      route: '/guide/getting-started',
      locale: 'zh',
      alternates: [{ locale: 'en', id: 'article:guide/getting-started:en' }],
      data: { title: '快速开始', lede: '安装并运行你的第一个元素。' },
    },
  ]);
  const { plan, failures } = buildSeoPlan({
    graph,
    routeSeo: {
      '/': {
        en: { title: 'Home', description: 'The openElement homepage description here.' },
        zh: { title: '首页', description: 'openElement 首页的中文描述文字。' },
      },
    },
    locales: LOCALES,
    builtHtmlFiles: [
      'index.html',
      'zh/index.html',
      'guide/getting-started/index.html',
      'zh/guide/getting-started/index.html',
    ],
  });
  assertEquals(failures, []);
  assertEquals(plan.length, 4);
  const zhGuide = plan.find((entry) => entry.file === 'zh/guide/getting-started/index.html');
  assertEquals(zhGuide?.title, '快速开始 — openElement');
  assertEquals(zhGuide?.alternates.en, '/guide/getting-started');
  assertEquals(zhGuide?.alternates.zh, '/zh/guide/getting-started');
});

Deno.test('buildSeoPlan fails when a built page has no SEO entry', () => {
  const { failures } = buildSeoPlan({
    graph: graphWith([]),
    routeSeo: {},
    locales: LOCALES,
    builtHtmlFiles: ['mystery/index.html'],
  });
  assertEquals(failures.length, 1);
  assert(failures[0].message.includes('mystery'));
});

Deno.test('buildSeoPlan fails when an SEO entry has no built page', () => {
  const { failures } = buildSeoPlan({
    graph: graphWith([]),
    routeSeo: {
      '/ghost': {
        en: { title: 'Ghost', description: 'A route that was never built into a page.' },
        zh: { title: '幽灵', description: '从未构建出页面的路由描述文字。' },
      },
    },
    locales: LOCALES,
    builtHtmlFiles: [],
  });
  assertEquals(failures.length, 2);
});

Deno.test('buildSeoPlan lets locale-expanded originals inherit their own entry', () => {
  // Blog posts are single-language originals: the zh page of an English post
  // exists (locale expansion) but has no zh graph entry.
  const graph = graphWith([
    {
      id: 'article:blog/post:en',
      kind: 'blog-post',
      route: '/blog/post',
      locale: 'en',
      data: { title: 'English-only dispatch' },
    },
  ]);
  const { plan, failures } = buildSeoPlan({
    graph,
    routeSeo: {},
    locales: LOCALES,
    builtHtmlFiles: ['blog/post/index.html', 'zh/blog/post/index.html'],
  });
  assertEquals(failures, []);
  const zh = plan.find((entry) => entry.file === 'zh/blog/post/index.html');
  assertEquals(zh?.title, 'English-only dispatch — openElement');
  assertEquals(zh?.description, 'English-only dispatch — openElement dispatch');
});

Deno.test('applySeoToHtml rewrites head metadata and injects links', () => {
  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>openElement</title>
  <meta property="og:title" content="OpenElement - The Web, composed.">
  <meta property="og:url" content="https://openelement.org">
  <meta name="description" content="Boilerplate description that says nothing about the page.">
</head>
<body></body>
</html>`;
  const applied = applySeoToHtml(html, {
    file: 'zh/apilist/index.html',
    route: '/zh/apilist',
    locale: 'zh',
    title: 'API 参考 — openElement',
    description: 'openElement 受支持的 API 面。',
    alternates: { en: '/apilist', zh: '/zh/apilist' },
  });
  assert(applied !== null);
  assert(applied.includes('<title>API 参考 — openElement</title>'));
  assert(applied.includes('<meta name="description" content="openElement 受支持的 API 面。">'));
  assert(applied.includes('<meta property="og:title" content="API 参考 — openElement">'));
  assert(applied.includes('<meta property="og:url" content="https://openelement.org/zh/apilist">'));
  assert(applied.includes('<link rel="canonical" href="https://openelement.org/zh/apilist">'));
  assert(
    applied.includes('<link rel="alternate" hreflang="en" href="https://openelement.org/apilist">'),
  );
  assert(applied.includes('hreflang="x-default" href="https://openelement.org/apilist"'));
});

Deno.test('applySeoToHtml returns null when the boilerplate anchors drifted', () => {
  assertEquals(
    applySeoToHtml('<html><head></head></html>', {
      file: 'index.html',
      route: '/',
      locale: 'en',
      title: 'x',
      description: 'y',
      alternates: {},
    }),
    null,
  );
});

Deno.test('applySeoToHtml skips canonical/hreflang on 404 documents', () => {
  const html =
    '<html><head><title>openElement</title>\n<meta name="description" content="Boilerplate description text here."></head></html>';
  const applied = applySeoToHtml(html, {
    file: '404.html',
    route: '/404',
    locale: 'en',
    title: '404 — Page not found — openElement',
    description: 'The requested page does not exist at all.',
    alternates: { en: '/404', zh: '/zh/404' },
  });
  assert(applied !== null);
  assert(!applied.includes('rel="canonical"'));
  assert(applied.includes('<title>404 — Page not found — openElement</title>'));
});
