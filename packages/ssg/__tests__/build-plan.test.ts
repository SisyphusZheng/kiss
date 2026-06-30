/**
 * @openelement/ssg - BuildPlan / BuildArtifacts contract tests
 *
 * These tests exercise the protocol shapes imported by @openelement/ssg.
 * They do not require filesystem access.
 */

import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import type {
  BuildArtifacts,
  BuildClientAsset,
  BuildIslandInput,
  BuildManifestArtifact,
  BuildOutputOptions,
  BuildPageArtifact,
  BuildPlan,
  BuildRouteInput,
} from '@openelement/ssg';

Deno.test('BuildPlan can be constructed with required fields', () => {
  const routes: BuildRouteInput[] = [
    {
      kind: 'page',
      path: '/',
      filePath: 'app/routes/index.tsx',
      importPath: './app/routes/index.tsx',
      tagName: 'page-home',
    },
    {
      kind: 'page',
      path: '/blog/:slug',
      filePath: 'app/routes/blog/[slug].tsx',
      importPath: './app/routes/blog/[slug].tsx',
      tagName: 'page-blog-post',
      paramNames: ['slug'],
      staticParams: [{ slug: 'hello' }],
    },
  ];

  const islands: BuildIslandInput[] = [
    {
      tagName: 'counter-island',
      modulePath: 'app/islands/counter.tsx',
      hydrate: 'idle',
      ssr: true,
      source: 'local',
    },
  ];

  const output: BuildOutputOptions = {
    root: '/tmp/project',
    outDir: 'dist',
    base: '/',
    spa: false,
  };

  const plan: BuildPlan = {
    options: {
      mode: 'ssg',
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
    },
    routes,
    islands,
    output,
    i18n: { locales: ['en'], defaultLocale: 'en' },
    content: { contentDir: 'content', basePath: '/blog' },
    packageIslands: { packages: [] },
    evidence: {},
  };

  assertEquals(plan.routes.length, 2);
  assertEquals(plan.islands[0].tagName, 'counter-island');
  assertEquals(plan.output.spa, false);
});

Deno.test('BuildArtifacts collects pages, manifest, client assets, warnings, and errors', () => {
  const pages: BuildPageArtifact[] = [
    { path: '/', html: '<html></html>', errors: [] },
    {
      path: '/blog/hello',
      html: '<html><body>Hello</body></html>',
      errors: [{ message: 'minor hydration mismatch', route: '/blog/hello' }],
    },
  ];

  const manifest: BuildManifestArtifact = {
    routes: [
      { path: '/', tagName: 'page-home', isDynamic: false },
      { path: '/blog/:slug', tagName: 'page-blog-post', isDynamic: true },
    ],
    islands: [
      { tagName: 'counter-island', modulePath: 'app/islands/counter.tsx' },
    ],
  };

  const css: BuildClientAsset = {
    fileName: 'assets/client.css',
    source: 'body { margin: 0; }',
    sizeBytes: 18,
  };

  const artifacts: BuildArtifacts = {
    pages,
    manifest,
    clientAssets: [css],
    warnings: ['large island bundle'],
    errors: [],
    success: true,
  };

  assertEquals(artifacts.pages.length, 2);
  assertEquals(artifacts.manifest.routes.length, 2);
  assertEquals(artifacts.clientAssets[0].sizeBytes, 18);
  assertEquals(artifacts.success, true);
});

Deno.test('BuildArtifacts success is false when fatal errors present', () => {
  const artifacts: BuildArtifacts = {
    pages: [],
    manifest: { routes: [], islands: [] },
    clientAssets: [],
    warnings: [],
    errors: ['SSR bundle failed'],
    success: false,
  };

  assertEquals(artifacts.success, false);
});
