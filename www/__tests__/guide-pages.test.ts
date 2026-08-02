import { assert, assertEquals, assertExists } from '@std/assert';

const { GuidePage } = await import('../app/site-ui/guide-page.tsx');

// The fourteen guide routes share the site-ui guide shell (#749): each route
// module contributes only its bilingual content record and optional hooks.
const guideRoutes = [
  ['api', 'GuideApiPage'],
  ['architecture', 'GuideArchitecturePage'],
  ['comparison', 'GuideComparisonPage'],
  ['configuration', 'GuideConfigurationPage'],
  ['core-concepts', 'GuideCoreConceptsPage'],
  ['deployment', 'GuideDeploymentPage'],
  ['error-handling', 'GuideErrorHandlingPage'],
  ['getting-started', 'GuideGettingStartedPage'],
  ['islands-and-ssr', 'GuideIslandsAndSsrPage'],
  ['mdx', 'GuideMdxPage'],
  ['migration', 'GuideMigrationPage'],
  ['routing-and-data', 'GuideRoutingAndDataPage'],
  ['security', 'GuideSecurityPage'],
  ['testing', 'GuideTestingPage'],
] as const;

type RouteModule = {
  default: typeof GuidePage;
  meta: { section: string; label: string; order: number };
};

for (const [route, className] of guideRoutes) {
  Deno.test(`guide/${route} builds on the shared guide shell`, async () => {
    const mod = (await import(`../app/routes/guide/${route}.tsx`)) as unknown as RouteModule;
    const pageClass = mod.default;
    assertExists(pageClass, `guide/${route} must default-export its page class`);
    assertEquals(pageClass.name, className);
    assert(
      pageClass.prototype instanceof GuidePage,
      `${className} must extend the shared GuidePage shell`,
    );
    assertExists(mod.meta?.label, `guide/${route} must keep its route meta`);

    const { content } = pageClass.guide;
    for (const locale of ['en', 'zh'] as const) {
      const t = content[locale];
      assertExists(t, `${className} must define ${locale} content`);
      assert(t.breadcrumb && t.title && t.lede, `${className} ${locale} metadata incomplete`);
      assert(t.outline.length > 0, `${className} ${locale} outline must not be empty`);
      assert(t.cards.length > 0, `${className} ${locale} cards must not be empty`);
      const ids = new Set(t.outline.map((item) => item.id));
      assertEquals(ids.size, t.outline.length, `${className} ${locale} outline ids must be unique`);
    }
  });
}

// #749: guide/architecture and guide/comparison are orientation cards that
// point at the full Architecture pages instead of maintaining a second copy.
for (const route of ['architecture', 'comparison'] as const) {
  Deno.test(`guide/${route} is a guide card for the full architecture page`, async () => {
    const mod = (await import(`../app/routes/guide/${route}.tsx`)) as unknown as RouteModule;
    for (const locale of ['en', 'zh'] as const) {
      const fullPage = mod.default.guide.content[locale].fullPage;
      assertExists(fullPage, `guide/${route} ${locale} must link the full page`);
      assert(
        fullPage.href.startsWith('/architecture/'),
        `guide/${route} full page must live under /architecture/`,
      );
    }
  });
}
