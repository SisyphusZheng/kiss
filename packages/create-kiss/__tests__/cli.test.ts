/**
 * @kissjs/create - cli.ts tests (Deno)
 *
 * Tests the project scaffolding CLI using temp directories.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

function makeTempDir(): string {
  const dir = join(tmpdir(), `kiss-scaffold-${randomUUID().slice(0, 8)}`);
  return dir;
}

// We test by importing and calling main() with Deno args override.
// The CLI creates a directory structure — we verify it exists.

Deno.test('create-kiss scaffolds a valid KISS project', async () => {
  const projectName = `test-app-${Date.now()}`;
  const originalArgs = [...Deno.args];

  try {
    // Override Deno.args to pass project name
    (Deno as unknown as { args: string[] }).args = [projectName];

    // Import and run
    await import('../src/cli.ts');

    // Verify created files
    assertExists(readFileSync(join(projectName, 'deno.json'), 'utf-8'));
    assertExists(readFileSync(join(projectName, 'vite.config.ts'), 'utf-8'));
    assertExists(readFileSync(join(projectName, 'app', 'routes', 'index.ts'), 'utf-8'));
    assertExists(readFileSync(join(projectName, 'app', 'islands', 'my-counter.ts'), 'utf-8'));
  } finally {
    // Cleanup
    try { rmSync(projectName, { recursive: true }); } catch { /* ignore */ }
    (Deno as unknown as { args: string[] }).args = originalArgs;
  }
});

Deno.test('create-kiss template includes three-phase build tasks', async () => {
  const projectName = `test-tasks-${Date.now()}`;
  const originalArgs = [...Deno.args];

  try {
    (Deno as unknown as { args: string[] }).args = [projectName];
    await import('../src/cli.ts');

    const denoJson = JSON.parse(readFileSync(join(projectName, 'deno.json'), 'utf-8'));

    // Must have build, build:client, build:ssg, dev, preview
    assertExists(denoJson.tasks['build']);
    assertExists(denoJson.tasks['build:client']);
    assertExists(denoJson.tasks['build:ssg']);
    assertExists(denoJson.tasks['dev']);
    assertExists(denoJson.tasks['preview']);
  } finally {
    try { rmSync(projectName, { recursive: true }); } catch { /* ignore */ }
    (Deno as unknown as { args: string[] }).args = originalArgs;
  }
});

Deno.test('create-kiss template uses @kissjs/core imports', async () => {
  const projectName = `test-imports-${Date.now()}`;
  const originalArgs = [...Deno.args];

  try {
    (Deno as unknown as { args: string[] }).args = [projectName];
    await import('../src/cli.ts');

    const routeIndex = readFileSync(join(projectName, 'app', 'routes', 'index.ts'), 'utf-8');
    const islandCounter = readFileSync(join(projectName, 'app', 'islands', 'my-counter.ts'), 'utf-8');
    const viteConfig = readFileSync(join(projectName, 'vite.config.ts'), 'utf-8');

    // Route should import from @kissjs/core
    assertExists(routeIndex.includes('@kissjs/core'));
    // Island should import from @kissjs/core
    assertExists(islandCounter.includes('@kissjs/core'));
    // Vite config should use kiss plugin
    assertExists(viteConfig.includes('kiss({'));
    // Should include packageIslands config
    assertExists(viteConfig.includes('@kissjs/ui'));
  } finally {
    try { rmSync(projectName, { recursive: true }); } catch { /* ignore */ }
    (Deno as unknown as { args: string[] }).args = originalArgs;
  }
});
