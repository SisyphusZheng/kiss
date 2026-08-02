/**
 * Build output assertions — runs against www/dist after a production build.
 * These tests validate that build artifacts meet security and size constraints.
 *
 * Run: deno test www/__tests__/build-output.test.ts --allow-read
 * (must run after `deno task build`)
 */
import { assert, assertEquals } from '@std/assert';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname ?? '.', '..', 'dist');

Deno.test('build output: no Hono virtual entry in public assets', () => {
  assert(existsSync(DIST), `Build output is missing: ${DIST}`);
  const assetsDir = join(DIST, 'assets');
  assert(existsSync(assetsDir), `Build assets directory is missing: ${assetsDir}`);

  const files = readdirSync(assetsDir);
  const honoEntry = files.find((f) => f.startsWith('_virtual_less-hono-entry'));
  assertEquals(
    honoEntry,
    undefined,
    `Hono virtual entry should not be in dist/assets/: ${honoEntry}`,
  );
});

Deno.test('build output: client island JS stays within core budget and ships no showcase chunks', () => {
  assert(existsSync(DIST), `Build output is missing: ${DIST}`);
  const clientDir = join(DIST, 'client');
  assert(existsSync(clientDir), `Client output directory is missing: ${clientDir}`);

  // Showcase islands were removed from the site; the production build must not
  // emit any of these chunks. Keep the historical prefixes as a regression
  // guard so a re-introduced showcase island fails loudly.
  const removedShowcaseChunks = [
    'island-media-chrome-showcase',
    'island-react-showcase',
    'island-shoelace-showcase',
    'island-reactive-showcase',
    'island-scroll-reveal',
  ];
  const files = readdirSync(clientDir, { recursive: true }) as string[];
  let coreBytes = 0;
  const emittedShowcase: string[] = [];
  for (const f of files) {
    if (f.endsWith('.js')) {
      if (removedShowcaseChunks.some((prefix) => f.includes(prefix))) {
        emittedShowcase.push(f);
      } else {
        coreBytes += statSync(join(clientDir, f)).size;
      }
    }
  }
  const coreKB = coreBytes / 1024;
  assertEquals(
    emittedShowcase,
    [],
    `Removed showcase islands must not be emitted by the production build: ${
      emittedShowcase.join(', ')
    }`,
  );
  assert(
    coreKB < 700,
    `Core client island JS total ${coreKB.toFixed(1)}KB exceeds 700KB limit`,
  );
});
