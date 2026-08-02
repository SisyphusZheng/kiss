/**
 * @openelement/adapter-vite - route-manifest.ts tests (Deno)
 *
 * Tests route manifest generation for SPA mode:
 * - File system scanning and URL pattern mapping
 * - Manifest content generation
 * - Edge cases: empty routes, nested routes, params, catch-all
 */
import { assertEquals, assertMatch, assertStringIncludes } from '@std/assert';
import { join } from 'jsr:@std/path@^1.0.0';
import { writeRouteManifest } from '../src/route-manifest.ts';

/** Create a temp directory that auto-cleans up after each test. */
function tempDir(): { path: string; cleanup: () => void } {
  const path = Deno.makeTempDirSync({ prefix: 'open-rm-' });
  return {
    path,
    cleanup: () => {
      try {
        Deno.removeSync(path, { recursive: true });
      } catch { /* ignore */ }
    },
  };
}

/** Write a route file into a temp routes directory. */
async function writeRoute(routesDir: string, relativePath: string, content = 'export default {}') {
  const fullPath = join(routesDir, relativePath);
  const parent = join(fullPath, '..');
  try {
    await Deno.mkdir(parent, { recursive: true });
  } catch { /* ignore */ }
  await Deno.writeTextFile(fullPath, content);
}

/**
 * Generate a manifest through the production writeRouteManifest() path and
 * read the file back (generateRouteManifestContent was test-only, #847).
 */
async function generateContent(routesDir: string, manifestPath: string): Promise<string> {
  await writeRouteManifest({ routesDir, outDir: join(manifestPath, '..') });
  return await Deno.readTextFile(manifestPath);
}

// ─── URL Pattern Mapping ─────────────────────────────────

Deno.test({
  name: 'route-manifest: index.tsx → /',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'index.tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/': () => import(");
      assertMatch(content, /\/routes\/index\.tsx/);
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: products.tsx → /products',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'products.tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/products': () => import(");
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: [id].tsx → /:id',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'products/[id].tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/products/:id': () => import(");
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: nested index.tsx → /products',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'products/index.tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/products': () => import(");
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: nested subroute → /products/reviews',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'products/reviews.tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/products/reviews': () => import(");
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: catch-all [...slug].tsx → /products/:slug{.+}',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'products/[...slug].tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      // scanRoutes (#556) converts a catch-all segment to the Hono named
      // regex parameter :slug{.+} (matches across '/').
      assertStringIncludes(content, "'/products/:slug{.+}': () => import(");
    } finally {
      dir.cleanup();
    }
  },
});

// ─── Edge Cases ────────────────────────────────────────

Deno.test({
  name: 'route-manifest: empty routes directory',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await Deno.mkdir(routesDir, { recursive: true });

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, 'export const routeManifest = {} as const;');
      assertStringIncludes(content, 'No page routes found');
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: non-existent routes directory',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'nonexistent');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, '{} as const;');
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: skips special files (_renderer, _middleware)',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'index.tsx');
      await writeRoute(routesDir, '_renderer.ts');
      await writeRoute(routesDir, '_middleware.ts');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/': () => import(");
      assertEquals(content.includes('_renderer'), false);
      assertEquals(content.includes('_middleware'), false);
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: skips API routes (api/ subdirectory)',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'index.tsx');
      await writeRoute(routesDir, 'api/posts.ts');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/': () => import(");
      assertEquals(content.includes('/api/posts'), false);
    } finally {
      dir.cleanup();
    }
  },
});

// ─── Generated Content Validity ────────────────────────

Deno.test({
  name: 'route-manifest: generated content is valid TypeScript syntax',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'index.tsx');
      await writeRoute(routesDir, 'about.tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      // Verify structural elements
      assertStringIncludes(content, 'Auto-generated');
      assertStringIncludes(content, 'export const routeManifest');
      assertStringIncludes(content, 'as const;');
      // Must start with comment/export
      assertMatch(content, /^\/\//);
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: import paths are relative',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'index.tsx');

      // Manifest goes into a nested subdirectory
      const manifestPath = join(dir.path, '.openelement/generated/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      // Should contain ../ or ../..
      assertMatch(content, /import\('[.][.]/);
    } finally {
      dir.cleanup();
    }
  },
});

// ─── writeRouteManifest Integration ────────────────────

Deno.test({
  name: 'route-manifest: writeRouteManifest writes file and returns count',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'index.tsx');
      await writeRoute(routesDir, 'about.tsx');
      await writeRoute(routesDir, 'products.tsx');

      const outDir = join(dir.path, '.openelement');
      const count = await writeRouteManifest({ routesDir, outDir });
      assertEquals(count, 3);

      // Verify the file was written
      const written = await Deno.readTextFile(join(outDir, 'route-manifest.ts'));
      assertStringIncludes(written, "'/': () => import(");
      assertStringIncludes(written, "'/about': () => import(");
      assertStringIncludes(written, "'/products': () => import(");
    } finally {
      dir.cleanup();
    }
  },
});

Deno.test({
  name: 'route-manifest: writeRouteManifest with empty routes returns 0',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await Deno.mkdir(routesDir, { recursive: true });

      const outDir = join(dir.path, '.openelement');
      const count = await writeRouteManifest({ routesDir, outDir });
      assertEquals(count, 0);

      const written = await Deno.readTextFile(join(outDir, 'route-manifest.ts'));
      assertStringIncludes(written, 'No page routes found');
    } finally {
      dir.cleanup();
    }
  },
});

// ─── Multiple Routes ───────────────────────────────────

Deno.test({
  name: 'route-manifest: multiple routes with mixed static/dynamic',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'index.tsx');
      await writeRoute(routesDir, 'products.tsx');
      await writeRoute(routesDir, 'products/[id].tsx');
      await writeRoute(routesDir, 'about.tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/': () => import(");
      assertStringIncludes(content, "'/products': () => import(");
      assertStringIncludes(content, "'/products/:id': () => import(");
      assertStringIncludes(content, "'/about': () => import(");
    } finally {
      dir.cleanup();
    }
  },
});

// ─── About route ───────────────────────────────────────

Deno.test({
  name: 'route-manifest: about.tsx → /about',
  permissions: { read: true, write: true },
  async fn() {
    const dir = tempDir();
    try {
      const routesDir = join(dir.path, 'routes');
      await writeRoute(routesDir, 'about.tsx');

      const manifestPath = join(dir.path, '.openelement/route-manifest.ts');
      const content = await generateContent(routesDir, manifestPath);

      assertStringIncludes(content, "'/about': () => import(");
    } finally {
      dir.cleanup();
    }
  },
});
