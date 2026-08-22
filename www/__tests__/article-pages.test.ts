import { assert, assertEquals, assertExists, assertStringIncludes } from '@std/assert';

const { ArticlePage } = await import('../app/site-ui/article-page.tsx');
const { generateContentDataFiles, loadContentPages } = await import('../build-content-data.ts');

// The content routes share the site-ui article shell: each route module is a
// thin binding — meta (the nav contract) plus a content slug; the body lives
// in www/content/<collection>/<slug>[.<locale>].md (#1087 pilot, ADR-0136).
const articleRoutes = [
  ['guide', 'api', 'GuideApiPage', 60],
  ['guide', 'architecture', 'GuideArchitecturePage', 20],
  ['guide', 'comparison', 'GuideComparisonPage', 25],
  ['guide', 'configuration', 'GuideConfigurationPage', 70],
  ['guide', 'core-concepts', 'GuideCoreConceptsPage', 10],
  ['guide', 'deployment', 'GuideDeploymentPage', 100],
  ['guide', 'error-handling', 'GuideErrorHandlingPage', 80],
  ['guide', 'getting-started', 'GuideGettingStartedPage', 1],
  ['guide', 'islands-and-ssr', 'GuideIslandsAndSsrPage', 90],
  ['guide', 'mdx', 'GuideMdxPage', 50],
  ['guide', 'migration', 'GuideMigrationPage', 75],
  ['guide', 'routing-and-data', 'GuideRoutingAndDataPage', 40],
  ['guide', 'security', 'GuideSecurityPage', 95],
  ['guide', 'styling', 'GuideStylingPage', 5],
  ['guide', 'testing', 'GuideTestingPage', 110],
  ['architecture', 'architecture', 'ArchitecturePage', 10],
  ['architecture', 'benchmark', 'Benchmark', 100],
  ['architecture', 'comparison', 'ComparisonPage', 20],
  ['architecture', 'design-system', 'DesignSystemPage', 15],
  ['architecture', 'dsd', 'DsdGuidePage', 30],
  ['architecture', 'islands', 'IslandsPage', 40],
  ['architecture', 'islands-deep', 'IslandsDeepGuidePage', 50],
  ['architecture', 'package-compatibility', 'PackageCompatibilityPage', 90],
  ['architecture', 'standards-registry', 'StandardsRegistryPage', 80],
] as const;

type ArticleRouteModule = {
  default: typeof ArticlePage;
  meta: { section: string; label: string; order: number };
};

for (const [collection, route, className, order] of articleRoutes) {
  Deno.test(`${collection}/${route} is a thin article shell`, async () => {
    const mod =
      (await import(`../app/routes/${collection}/${route}.tsx`)) as unknown as ArticleRouteModule;
    const pageClass = mod.default;
    assertExists(pageClass, `${collection}/${route} must default-export its page class`);
    assertEquals(pageClass.name, className);
    assert(
      pageClass.prototype instanceof ArticlePage,
      `${className} must extend the shared ArticlePage shell`,
    );
    assertExists(mod.meta?.label, `${collection}/${route} must keep its route meta`);
    assertEquals(
      mod.meta?.order,
      order,
      `${collection}/${route} nav order must match the frontmatter order`,
    );
    assertEquals(
      pageClass.article.collection,
      collection,
      `${className} must bind the ${collection} collection`,
    );
    assertEquals(
      pageClass.article.slug,
      route,
      `${className} must bind the ${route} content slug`,
    );
  });
}

// Content-level assertions run against the real Markdown via the pipeline's
// pure loader — no generated-artifact dependency.
Deno.test('content covers every route in both locales', async () => {
  for (const collection of ['guide', 'architecture'] as const) {
    const pages = await loadContentPages(collection);
    for (const [, route, , order] of articleRoutes.filter((r) => r[0] === collection)) {
      for (const locale of ['en', 'zh'] as const) {
        const page = pages.find((p) => p.slug === route && p.locale === locale);
        assertExists(page, `content/${collection} missing ${route} (${locale})`);
        assertEquals(
          page.frontmatter.order,
          order,
          `${collection}/${route} (${locale}) order mismatch`,
        );
        assert(
          page.frontmatter.title.length > 0,
          `${collection}/${route} (${locale}) title must not be empty`,
        );
        assertStringIncludes(
          page.html,
          '<h2',
          `${collection}/${route} (${locale}) must have article sections`,
        );
        assert(
          !page.html.includes('open-card'),
          `${collection}/${route} (${locale}) must not contain cards`,
        );
      }
    }
  }
});

Deno.test('frontmatter orders are unique within each collection locale', async () => {
  for (const collection of ['guide', 'architecture'] as const) {
    const pages = await loadContentPages(collection);
    for (const locale of ['en', 'zh'] as const) {
      const orders = pages.filter((p) => p.locale === locale).map((p) => p.frontmatter.order);
      assertEquals(
        new Set(orders).size,
        orders.length,
        `duplicate orders in ${collection}/${locale}`,
      );
    }
  }
});

Deno.test('getting-started leads with copyable commands', async () => {
  const pages = await loadContentPages('guide');
  const en = pages.find((p) => p.slug === 'getting-started' && p.locale === 'en');
  assertExists(en);
  // The page's primary job: a fenced, copyable install command — not prose.
  assertStringIncludes(en.html, '<pre><code class="language-bash">');
  assertStringIncludes(en.html, 'npm:@openelement/create');
});

// #749: guide/architecture and guide/comparison are orientation pages that
// point at the full Architecture pages instead of maintaining a second copy.
Deno.test('architecture and comparison guide pages point at the full pages', async () => {
  const pages = await loadContentPages('guide');
  for (const slug of ['architecture', 'comparison'] as const) {
    const en = pages.find((p) => p.slug === slug && p.locale === 'en');
    const zh = pages.find((p) => p.slug === slug && p.locale === 'zh');
    assertExists(en);
    assertExists(zh);
    assertStringIncludes(en.html, `href="/architecture/${slug}"`);
    assertStringIncludes(zh.html, `href="/zh/architecture/${slug}"`);
  }
});

// The security page deep-links the configuration anchor; the configuration
// article must produce a heading whose generated id is middleware-use.
Deno.test('configuration keeps the middleware-use anchor target', async () => {
  const pages = await loadContentPages('guide');
  const en = pages.find((p) => p.slug === 'configuration' && p.locale === 'en');
  const security = pages.find((p) => p.slug === 'security' && p.locale === 'en');
  assertExists(en);
  assertExists(security);
  assertStringIncludes(en.html, '<h2>middleware.use</h2>');
  assertStringIncludes(security.html, '/guide/configuration#middleware-use');
});

Deno.test('content data module generation succeeds for all collections', async () => {
  const count = await generateContentDataFiles();
  assertEquals(count, articleRoutes.length * 2, 'every route needs en + zh content');
});
