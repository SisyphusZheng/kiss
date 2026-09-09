import { assert, assertEquals } from '@std/assert';
import {
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
} from './project-constants.ts';

// Drives tools/check-docs-truth.ts (www gate) as a subprocess against a
// minimal fixture tree so the gate's pass/fail behavior is tested in isolation.

const CHECK_SCRIPT = new URL('./check-docs-truth.ts', import.meta.url);

async function writeFixture(root: string, routeSource: string): Promise<void> {
  await Deno.mkdir(`${root}/www/app/routes`, { recursive: true });
  await Deno.mkdir(`${root}/www/app/site-ui`, { recursive: true });
  // The www gate requires the article content sources (ADR-0136 pilot);
  // version-form fixtures must satisfy that precondition to isolate the
  // retired-version rule under test.
  await Deno.mkdir(`${root}/www/content/guide`, { recursive: true });
  await Deno.mkdir(`${root}/www/content/architecture`, { recursive: true });
  await Deno.writeTextFile(`${root}/www/vite.config.ts`, 'export default {};\n');
  await Deno.writeTextFile(`${root}/www/app/routes/fixture.tsx`, routeSource);
}

async function runGate(root: string): Promise<{ code: number; stderr: string }> {
  const command = new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-read', CHECK_SCRIPT.pathname, '--check=www'],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stderr } = await command.output();
  return { code, stderr: new TextDecoder().decode(stderr) };
}

async function withFixture(
  routeSource: string,
  run: (result: { code: number; stderr: string }) => void,
): Promise<void> {
  const root = await Deno.makeTempDir();
  try {
    await writeFixture(root, routeSource);
    run(await runGate(root));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('www-truth: bare retired version without v prefix is flagged', async () => {
  await withFixture('export const x = "0.41.0-alpha.10";\n', ({ code, stderr }) => {
    assertEquals(code, 1);
    assert(stderr.includes('retired prerelease current claim'));
  });
});

Deno.test('www-truth: v-prefixed retired version is flagged', async () => {
  await withFixture('export const x = "v0.41.0-alpha.10";\n', ({ code, stderr }) => {
    assertEquals(code, 1);
    assert(stderr.includes('retired prerelease current claim'));
  });
});

Deno.test('www-truth: short alpha.N retired form is flagged', async () => {
  // alpha.7 is neither the current line nor the npm registry line.
  await withFixture('export const x = "published in alpha.7";\n', ({ code, stderr }) => {
    assertEquals(code, 1);
    assert(stderr.includes('retired prerelease current claim'));
  });
});

Deno.test('www-truth: npm registry line forms are not flagged (#730)', async () => {
  // While the registry lags the source line by one alpha,
  // PREVIOUS_PACKAGE_VERSION is the npm-published line and pages honestly
  // present it as "published" — it must not trip the retired-form rule.
  const bare = PREVIOUS_PACKAGE_VERSION; // e.g. 0.42.0-alpha.9
  const tagged = `v${PREVIOUS_PACKAGE_VERSION}`;
  const short = PREVIOUS_PACKAGE_VERSION.replace(/^\d+\.\d+\.\d+-/u, ''); // e.g. alpha.9
  await withFixture(`export const x = "${bare} ${tagged} ${short} — published";\n`, ({ code }) => {
    assertEquals(code, 0);
  });
});

Deno.test('www-truth: current version is not flagged (bare, v-prefixed, short)', async () => {
  const bare = PACKAGE_VERSION; // e.g. 0.41.0-alpha.18
  const tagged = PACKAGE_VERSION_TAG; // e.g. v0.41.0-alpha.18
  const short = PACKAGE_VERSION.replace(/^\d+\.\d+\.\d+-/u, ''); // e.g. alpha.18
  await withFixture(`export const x = "${bare} ${tagged} ${short}";\n`, ({ code }) => {
    assertEquals(code, 0);
  });
});

Deno.test('www-truth: approved planned chain versions are not flagged (ADR-0152)', async () => {
  // The roadmap page lists the approved forward chain as planned entries:
  // beta.2.1…beta.2.3 and the admitted product-stage successor 1.0.0-alpha.1.
  // Planned future releases are not retired current claims.
  await withFixture(
    'export const x = "planned: v0.44.0-beta.2.1, v0.44.0-beta.2.2, v0.44.0-beta.2.3, v1.0.0-alpha.1";\n',
    ({ code, stderr }) => {
      assertEquals(code, 0, stderr);
    },
  );
});

Deno.test('www-truth: unapproved future prerelease is flagged', async () => {
  // beta.3 is not on the approved chain (no automatic Beta.2.4-style drift).
  await withFixture('export const x = "v0.44.0-beta.3";\n', ({ code, stderr }) => {
    assertEquals(code, 1);
    assert(stderr.includes('retired prerelease current claim'));
  });
});

Deno.test('www-truth: historical internal alpha workspace is flagged', async () => {
  // 0.44.0-alpha.7 is a retired internal workspace, never a public plan entry.
  await withFixture('export const x = "v0.44.0-alpha.7";\n', ({ code, stderr }) => {
    assertEquals(code, 1);
    assert(stderr.includes('retired prerelease current claim'));
  });
});
