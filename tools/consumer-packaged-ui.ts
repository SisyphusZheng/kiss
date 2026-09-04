/**
 * Packed-artifact consumer qualification for @openelement/ui (#1301).
 *
 * The observational rule for packaging defects: qualify the PACKED artifact,
 * never the workspace source. This tool installs the five pack:dry-run
 * tarballs into a scratch consumer OUTSIDE the repository (so the adapter's
 * workspace auto-alias in workspace-alias.ts cannot substitute workspace
 * source for the packed modules), builds a minimal app that admits
 * @openelement/ui through the documented `packageIslands` path, and asserts
 * the prerendered HTML carries the compiled DSD for <open-theme-toggle>.
 *
 * Pre-#1301 the packed ui modules lost their compile-time-only
 * @element/@property intrinsics to `deno pack` transpilation, no Part
 * Program registered, and the static prerender failed closed with
 * OE_PROGRAM_MISSING (route / -> 500, build error). Post-fix the packed
 * modules carry the compiler output and the build succeeds.
 */

import { existsSync } from '@std/fs';
import { join, resolve } from '@std/path';
import { formatJson } from '@openelement/element/build-utils';
import { PACKAGE_VERSION, RETAINED_PACKAGE_NAMES } from './project-constants.ts';
import { readPackages } from './lib/package-graph.ts';
import { tarballPath } from './lib/npm-tarball.ts';

const repoRoot = resolve(import.meta.dirname!, '..');
// Generous ceiling for the real SSG build; a hung packed adapter must fail
// the tool instead of stalling CI forever (same contract as
// consumer-packaged-starter.ts).
const BUILD_TIMEOUT_MS = 10 * 60_000;

async function run(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs?: number,
): Promise<{ success: boolean; output: string }> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = timeoutMs === undefined ? undefined : setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const result = await new Deno.Command(command, {
      args,
      cwd,
      stdout: 'piped',
      stderr: 'piped',
      ...(timeoutMs === undefined ? {} : { signal: controller.signal }),
    }).output();
    const decoder = new TextDecoder();
    const output = decoder.decode(result.stdout) + decoder.decode(result.stderr);
    if (timedOut) {
      return {
        success: false,
        output: `Timed out after ${timeoutMs}ms: ${command} ${args.join(' ')}\n${output}`,
      };
    }
    return { success: result.success, output };
  } finally {
    clearTimeout(timeoutId);
  }
}

function assertIncludes(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`Packed consumer assertion failed (${label}): missing ${needle}`);
  }
}

const CONSUMER_DENO_JSON = {
  imports: {
    '@openelement/app': `npm:@openelement/app@${PACKAGE_VERSION}`,
    '@openelement/adapter-vite': `npm:@openelement/adapter-vite@${PACKAGE_VERSION}`,
    '@openelement/element': `npm:@openelement/element@${PACKAGE_VERSION}`,
    '@openelement/element/jsx-runtime': `npm:@openelement/element@${PACKAGE_VERSION}/jsx-runtime`,
    '@openelement/element/jsx-dev-runtime':
      `npm:@openelement/element@${PACKAGE_VERSION}/jsx-dev-runtime`,
    '@openelement/ui': `npm:@openelement/ui@${PACKAGE_VERSION}`,
    '@openelement/ui/open-theme-toggle': `npm:@openelement/ui@${PACKAGE_VERSION}/open-theme-toggle`,
    'hono': 'npm:hono@^4.12',
    'vite': 'npm:vite@8.0.16',
  },
  nodeModulesDir: 'manual',
  minimumDependencyAge: 0,
  tasks: {
    build:
      `deno run --config deno.json -A npm:@openelement/adapter-vite@${PACKAGE_VERSION}/cli/build`,
  },
  compilerOptions: {
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    jsx: 'react-jsx',
    jsxImportSource: '@openelement/element',
  },
};

const CONSUMER_VITE_CONFIG = `import { openElement } from '@openelement/adapter-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@openelement/element',
  },
  plugins: [
    ...openElement({
      routesDir: 'app/routes',
      appShell: false,
      // The documented packed-artifact admission path under test (#1301).
      packageIslands: ['@openelement/ui'],
      ssr: {
        noExternal: ['@openelement/ui'],
      },
      html: {
        title: 'packed ui consumer',
      },
    }),
  ],
});
`;

const CONSUMER_ROUTE = `import { definePage } from '@openelement/app';
import HomePage from '../components/page-home.tsx';

export default definePage(HomePage, {
  head: { title: 'packed ui consumer — home' },
});
`;

const CONSUMER_PAGE = `import { element, OpenElement } from '@openelement/element';
import '@openelement/ui/open-theme-toggle';

@element('index-page', { root: 'shadow-open' })
export default class HomePage extends OpenElement {
  render() {
    return (
      <main>
        <h1 id='home-marker'>packed ui consumer home</h1>
        <open-theme-toggle theme='light'></open-theme-toggle>
      </main>
    );
  }
}
`;

const tmp = await Deno.makeTempDir({ prefix: 'openelement-packaged-ui-' });
try {
  const workspacePackages = await readPackages();
  const tarballs = RETAINED_PACKAGE_NAMES.map((name) => {
    const pkg = workspacePackages.find((candidate) => candidate.name === name);
    if (!pkg) throw new Error(`Retained package missing from workspace graph: ${name}`);
    return { name, path: join(repoRoot, tarballPath(pkg)) };
  });
  for (const tarball of tarballs) {
    if (!existsSync(tarball.path)) {
      throw new Error(
        `Missing packed release artifact: ${tarball.path} (run \`deno task pack:dry-run\` first)`,
      );
    }
  }

  // @jsr/* packages are served by JSR's npm compatibility layer (see
  // consumer-packaged-starter.ts, #886).
  Deno.writeTextFileSync(join(tmp, '.npmrc'), '@jsr:registry=https://npm.jsr.io\n');

  // An explicit package.json with file: deps keeps npm from walking ancestor
  // directories and from pruning the external deps on tarball re-install.
  const dependencies: Record<string, string> = {
    'vite': '8.0.16',
    'hono': '4.12.0',
  };
  for (const tarball of tarballs) dependencies[tarball.name] = `file:${tarball.path}`;
  Deno.writeTextFileSync(
    join(tmp, 'package.json'),
    formatJson({
      name: 'openelement-packed-ui-consumer',
      private: true,
      type: 'module',
      dependencies,
    }),
  );

  const install = await run(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    tmp,
  );
  if (!install.success) throw new Error(`Packed package installation failed:\n${install.output}`);

  // The packed tarballs only cover @openelement/*; vite/hono resolve from the
  // registry. npm lays the tarball contents into node_modules directly, so no
  // repo node_modules scavenging happens here — the consumer is hermetic.

  Deno.writeTextFileSync(join(tmp, 'deno.json'), formatJson(CONSUMER_DENO_JSON));
  Deno.writeTextFileSync(join(tmp, 'vite.config.ts'), CONSUMER_VITE_CONFIG);
  Deno.mkdirSync(join(tmp, 'app', 'routes'), { recursive: true });
  Deno.mkdirSync(join(tmp, 'app', 'components'), { recursive: true });
  Deno.writeTextFileSync(join(tmp, 'app', 'routes', 'index.tsx'), CONSUMER_ROUTE);
  Deno.writeTextFileSync(join(tmp, 'app', 'components', 'page-home.tsx'), CONSUMER_PAGE);

  const build = await run(Deno.execPath(), ['task', 'build'], tmp, BUILD_TIMEOUT_MS);
  if (!build.success) {
    throw new Error(`Packed ui consumer SSG build failed:\n${build.output}`);
  }

  // A green exit alone is not enough: the prerendered page must carry the
  // compiled DSD for the packed island — the host tag, its declarative shadow
  // template, the compiled static markup and the compiled data-theme sink.
  const indexHtmlPath = join(tmp, 'dist', 'index.html');
  if (!existsSync(indexHtmlPath)) {
    throw new Error(`Packed ui consumer build emitted no prerendered page: ${indexHtmlPath}`);
  }
  const html = Deno.readTextFileSync(indexHtmlPath);
  assertIncludes(html, '<open-theme-toggle theme="light">', 'island host tag');
  assertIncludes(html, '<template shadowrootmode="open"', 'island DSD template');
  assertIncludes(html, 'class="theme-toggle"', 'compiled island markup');
  assertIncludes(html, 'data-theme="light"', 'compiled property sink');

  console.log(
    `Packed @openelement/ui consumer qualification passed for ${PACKAGE_VERSION}: ` +
      'packageIslands SSR admission renders the compiled DSD from the packed artifact.',
  );
} finally {
  await Deno.remove(tmp, { recursive: true }).catch(() => undefined);
}
