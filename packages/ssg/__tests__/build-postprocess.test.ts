/**
 * @openelement/ssg - build-postprocess.ts tests (Deno)
 */
import { assertEquals, assertExists, assertFalse } from 'jsr:@std/assert@^1.0.0';
import { join } from 'node:path';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import type { IslandDecl } from '@openelement/protocol/ssg';
import {
  type BuildContextView,
  cleanSsrArtifacts,
  postProcessClientIslandBuild,
} from '../src/build-postprocess.ts';

function makeTempDir(): string {
  return Deno.makeTempDirSync({ prefix: 'open-test-' });
}

function cleanup(dir: string) {
  try {
    rmSync(dir, { recursive: true });
  } catch { /* ignore */ }
}

function createMockContext(root: string, outDir: string): BuildContextView {
  return {
    phase3: {
      root,
      outDir,
      base: '/',
      upgradeStrategy: 'idle',
    },
    phase1: {
      islandTagNames: ['my-counter'],
      packageIslandDecls: [],
      islandMeta: {
        'my-counter': { hydrate: 'visible' },
      },
    },
  };
}

Deno.test('postProcessClientIslandBuild injects script and writes manifests', async () => {
  const tmp = makeTempDir();
  try {
    const outDir = 'dist';
    const outputDir = join(tmp, outDir);
    const htmlPath = join(outputDir, 'index.html');
    const viteDir = join(outputDir, 'client', '.vite');
    const islandsDir = join(outputDir, 'client', 'islands');

    mkdirSync(viteDir, { recursive: true });
    mkdirSync(islandsDir, { recursive: true });
    writeFileSync(
      htmlPath,
      '<html><head></head><body><my-counter></my-counter></body></html>',
      'utf-8',
    );
    writeFileSync(
      join(viteDir, 'manifest.json'),
      JSON.stringify({
        'app/islands/my-counter.ts': { file: 'islands/island-my-counter-abc123.js' },
        'virtual:open-client-entry': { file: 'islands/client.js' },
      }),
      'utf-8',
    );

    const ctx = createMockContext(tmp, outDir);
    await postProcessClientIslandBuild(ctx, '/client/islands/client.js');

    const html = readFileSync(htmlPath, 'utf-8');
    assertExists(html.includes('<script type="module" src="/client/islands/client.js"></script>'));

    const manifestDir = join(outputDir, 'island-manifests');
    assertExists(existsSync(manifestDir));
    const files = readdirSync(manifestDir);
    assertEquals(files.length, 1);
    const manifest = JSON.parse(readFileSync(join(manifestDir, files[0]), 'utf-8'));
    assertEquals(manifest.route, '/');
    assertEquals(manifest.islands.length, 1);
    assertEquals(manifest.islands[0].tagName, 'my-counter');
    assertEquals(manifest.islands[0].chunkUrl, '/client/islands/island-my-counter-abc123.js');
    assertEquals(manifest.islands[0].strategy, 'visible');
    assertEquals(manifest.islands[0].layer, 'dsd-interactive');
  } finally {
    cleanup(tmp);
  }
});

Deno.test('postProcessClientIslandBuild includes package islands', async () => {
  const tmp = makeTempDir();
  try {
    const outDir = 'dist';
    const outputDir = join(tmp, outDir);
    mkdirSync(join(outputDir, 'client', '.vite'), { recursive: true });
    mkdirSync(join(outputDir, 'client', 'islands'), { recursive: true });
    writeFileSync(
      join(outputDir, 'index.html'),
      '<html><body><open-theme-toggle></open-theme-toggle></body></html>',
      'utf-8',
    );
    writeFileSync(
      join(outputDir, 'client', '.vite', 'manifest.json'),
      JSON.stringify({
        'virtual:open-client-entry': { file: 'islands/client.js' },
      }),
      'utf-8',
    );

    const ctx: BuildContextView = {
      phase3: { root: tmp, outDir, base: '/', upgradeStrategy: 'idle' },
      phase1: {
        islandTagNames: [],
        packageIslandDecls: [
          {
            tagName: 'open-theme-toggle',
            modulePath: './toggle.ts',
            hydrate: 'load',
            ssr: false,
          } as IslandDecl,
        ],
        islandMeta: {},
      },
    };

    await postProcessClientIslandBuild(ctx, '/client/islands/client.js');

    const manifestDir = join(outputDir, 'island-manifests');
    const files = readdirSync(manifestDir);
    const manifest = JSON.parse(readFileSync(join(manifestDir, files[0]), 'utf-8'));
    assertEquals(manifest.islands[0].tagName, 'open-theme-toggle');
    assertEquals(manifest.islands[0].strategy, 'load');
    assertEquals(manifest.islands[0].layer, 'pure-island');
  } finally {
    cleanup(tmp);
  }
});

Deno.test('cleanSsrArtifacts removes SSR virtual entry artifacts', async () => {
  const tmp = makeTempDir();
  try {
    const assetsDir = join(tmp, 'dist', 'assets');
    mkdirSync(assetsDir, { recursive: true });
    writeFileSync(join(assetsDir, '_virtual_open-hono-entry-abc.js'), '// ssr', 'utf-8');
    writeFileSync(join(assetsDir, 'src-routes-index-abc.js'), '// route', 'utf-8');
    writeFileSync(join(assetsDir, 'client-islands-client-abc.js'), '// client', 'utf-8');
    writeFileSync(join(assetsDir, 'style.css'), '/* css */', 'utf-8');

    const ctx: BuildContextView = {
      phase3: { root: tmp, outDir: 'dist', base: '/', upgradeStrategy: 'idle' },
      phase1: { islandTagNames: [], packageIslandDecls: [], islandMeta: {} },
    };

    await cleanSsrArtifacts(ctx);

    assertFalse(existsSync(join(assetsDir, '_virtual_open-hono-entry-abc.js')));
    assertFalse(existsSync(join(assetsDir, 'src-routes-index-abc.js')));
    assertExists(existsSync(join(assetsDir, 'client-islands-client-abc.js')));
    assertExists(existsSync(join(assetsDir, 'style.css')));
  } finally {
    cleanup(tmp);
  }
});

Deno.test('cleanSsrArtifacts is safe when assets dir is missing', async () => {
  const tmp = makeTempDir();
  const ctx: BuildContextView = {
    phase3: { root: tmp, outDir: 'dist', base: '/', upgradeStrategy: 'idle' },
    phase1: { islandTagNames: [], packageIslandDecls: [], islandMeta: {} },
  };
  await cleanSsrArtifacts(ctx);
  assertEquals(existsSync(join(tmp, 'dist', 'assets')), false);
});
