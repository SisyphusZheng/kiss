/**
 * @kissjs/core - SSG integration tests (Deno)
 *
 * Tests the SSG post-processing pipeline:
 *   1. buildIslandChunkMap — scan client build output → tagName → chunk path mapping
 *   2. rewriteHtmlFiles — rewrite Island paths + apply aria-current active highlights
 *
 * KISS Architecture constraints verified:
 *   - S (Static): DSD content visible without JS
 *   - K+I (Knowledge + Isolated): Islands are the only JS
 *   - I (Isolated): No Island does what CSS can do
 */

import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { join } from 'jsr:@std/path@^1.0.0';
import { buildIslandChunkMap, rewriteHtmlFiles } from '../src/ssg-postprocess.ts';

// ─── Test fixtures ─────────────────────────────────────────────

const FIXTURES_DIR = join(Deno.cwd(), 'packages/kiss-core/__test_fixtures__/ssg');

async function setupSsgFixtures() {
  // Simulate a client build output directory structure
  const islandsDir = join(FIXTURES_DIR, 'dist', 'client', 'islands');
  await Deno.mkdir(islandsDir, { recursive: true });

  // Simulate built island chunks with tagName strings
  await Deno.writeTextFile(
    join(islandsDir, 'island-my-counter-abc123.js'),
    'const e="my-counter";customElements.define(e,MyCounter);',
  );
  await Deno.writeTextFile(
    join(islandsDir, 'island-theme-toggle-def456.js'),
    "const t='theme-toggle';customElements.define(t,Toggle);",
  );

  // Simulate SSG HTML output with DSD + hydration + sidebar
  const htmlDir = join(FIXTURES_DIR, 'dist');
  await Deno.writeTextFile(
    join(htmlDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KISS App</title>
</head>
<body>
<docs-home><template shadowroot="open" shadowrootmode="open"><style>:host { display: block; }</style>
  <app-layout currentpath="/" defer-hydration><template shadowroot="open" shadowrootmode="open"><style>:host { display: block; }</style>
    <nav class="docs-sidebar">
      <a href="/" class="" aria-current="">Home</a>
      <a href="/about" class="" aria-current="">About</a>
    </nav>
  </template></app-layout>
</template></docs-home>
<script type="module" data-kiss-hydrate>
(function() {
  const loaders = {
    'my-counter': () => import('/app/islands/my-counter.ts'),
    'theme-toggle': () => import('/app/islands/theme-toggle.ts')
  };
  async function hydrate(tag, loader) {
    try { const m = await loader(); if (m.default && !customElements.get(tag)) customElements.define(tag, m.default); }
    catch(e) { console.warn("[KISS] Island hydration failed:", e); }
  }
  if ("requestIdleCallback" in window) requestIdleCallback(() => { for (const [t,l] of Object.entries(loaders)) hydrate(t,l); });
  else setTimeout(() => { for (const [t,l] of Object.entries(loaders)) hydrate(t,l); }, 200);
})();
</script>
</body>
</html>`,
  );

  // Sub-page HTML (about page)
  const aboutDir = join(htmlDir, 'about');
  await Deno.mkdir(aboutDir, { recursive: true });
  await Deno.writeTextFile(
    join(aboutDir, 'index.html'),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KISS App</title>
</head>
<body>
<docs-about><template shadowroot="open" shadowrootmode="open"><style>:host { display: block; }</style>
  <app-layout currentpath="/about" defer-hydration><template shadowroot="open" shadowrootmode="open"><style>:host { display: block; }</style>
    <nav class="docs-sidebar">
      <a href="/" class="" aria-current="">Home</a>
      <a href="/about" class="" aria-current="">About</a>
    </nav>
  </template></app-layout>
</template></docs-about>
<script type="module" data-kiss-hydrate>
(function() {
  const loaders = {
    'my-counter': () => import('/app/islands/my-counter.ts')
  };
})();
</script>
</body>
</html>`,
  );
}

async function cleanupSsgFixtures() {
  try {
    await Deno.remove(FIXTURES_DIR, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}

// ─── Tests ─────────────────────────────────────────────────────

Deno.test('SSG integration', { permissions: { read: true, write: true } }, async (t) => {
  await setupSsgFixtures();

  await t.step('buildIslandChunkMap - maps tagName to chunk path', () => {
    const chunkMap = buildIslandChunkMap(
      join(FIXTURES_DIR),
      'dist',
      ['my-counter', 'theme-toggle'],
      '/kiss/',
    );

    assertEquals(Object.keys(chunkMap).length, 2);
    assertStringIncludes(
      chunkMap['my-counter'],
      '/kiss/client/islands/island-my-counter-abc123.js',
    );
    assertStringIncludes(
      chunkMap['theme-toggle'],
      '/kiss/client/islands/island-theme-toggle-def456.js',
    );
  });

  await t.step('buildIslandChunkMap - returns empty map when no client dir', () => {
    const chunkMap = buildIslandChunkMap(
      join(FIXTURES_DIR),
      'nonexistent',
      ['my-counter'],
    );
    assertEquals(Object.keys(chunkMap).length, 0);
  });

  await t.step('rewriteHtmlFiles - rewrites Island hydration paths', () => {
    const chunkMap: Record<string, string> = {
      'my-counter': '/kiss/client/islands/island-my-counter-abc123.js',
      'theme-toggle': '/kiss/client/islands/island-theme-toggle-def456.js',
    };

    rewriteHtmlFiles(join(FIXTURES_DIR, 'dist'), chunkMap);

    // Read the rewritten index.html
    const html = Deno.readTextFileSync(join(FIXTURES_DIR, 'dist', 'index.html'));

    // Island paths should be rewritten
    assertStringIncludes(html, "import('/kiss/client/islands/island-my-counter-abc123.js')");
    assertStringIncludes(html, "import('/kiss/client/islands/island-theme-toggle-def456.js')");

    // Original paths should be gone
    assertEquals(html.includes("import('/app/islands/my-counter.ts')"), false);
    assertEquals(html.includes("import('/app/islands/theme-toggle.ts')"), false);
  });

  await t.step('rewriteHtmlFiles - no longer applies aria-current (moved to component)', () => {
    // v0.3.0: sidebar active link highlighting was removed from rewriteHtmlFiles
    // and moved to <kiss-layout currentPath="..."> component.
    // rewriteHtmlFiles now ONLY rewrites island source paths → built chunk paths.
    // This test verifies that rewriteHtmlFiles does NOT add aria-current or class="active".
    const indexHtml = Deno.readTextFileSync(join(FIXTURES_DIR, 'dist', 'index.html'));

    // rewriteHtmlFiles should NOT inject aria-current — that's the component's job
    assertEquals(indexHtml.includes('class="active"'), false);
  });

  await t.step('rewriteHtmlFiles - preserves DSD output (S constraint)', () => {
    const html = Deno.readTextFileSync(join(FIXTURES_DIR, 'dist', 'index.html'));

    // DSD template tags must survive rewriting
    assertStringIncludes(html, 'shadowroot="open"');
    assertStringIncludes(html, 'shadowrootmode="open"');

    // Content inside DSD must be intact
    assertStringIncludes(html, 'docs-home');
    assertStringIncludes(html, 'app-layout');
    assertStringIncludes(html, 'docs-sidebar');
  });

  await t.step('rewriteHtmlFiles - preserves hydration script (I constraint)', () => {
    const html = Deno.readTextFileSync(join(FIXTURES_DIR, 'dist', 'index.html'));

    // Hydration script must exist with rewritten paths
    assertStringIncludes(html, 'data-kiss-hydrate');
    assertStringIncludes(html, '/kiss/client/islands/');
  });

  // Cleanup
  await cleanupSsgFixtures();
});
