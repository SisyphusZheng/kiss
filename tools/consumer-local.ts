/**
 * Local Workspace Consumer Build - generates a test project from the local
 * workspace create package and builds it. This is faster than the
 * post-publish smoke test because it uses local source directly, making
 * it suitable for running on every PR.
 *
 * Usage: deno run --allow-read --allow-write --allow-run --allow-env --allow-net --allow-ffi tools/consumer-local.ts
 *
 * Exit code 0 = consumer project builds successfully.
 * Exit code 1 = consumer project build failed.
 */

import { dirname, join } from 'node:path';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { allPackageAliases } from './lib/package-graph.ts';

function findMissingGeneratedImports(
  source: string,
  importMap: Record<string, string>,
): string[] {
  const specifiers = extractBareImportSpecifiers(source);
  return [...specifiers].filter((specifier) => !isMappedSpecifier(specifier, importMap)).sort();
}

function extractBareImportSpecifiers(source: string): Set<string> {
  const specifiers = new Set<string>();
  const patterns = [
    /\bimport\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+[^'"]+\s+from\s+["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier && !specifier.includes('${') && isBareSpecifier(specifier)) {
        specifiers.add(specifier);
      }
    }
  }

  return specifiers;
}

function isBareSpecifier(specifier: string): boolean {
  return !specifier.startsWith('.') &&
    !specifier.startsWith('/') &&
    !specifier.startsWith('file:') &&
    !specifier.startsWith('http:') &&
    !specifier.startsWith('https:') &&
    !specifier.startsWith('data:') &&
    !specifier.startsWith('node:') &&
    !specifier.startsWith('npm:') &&
    !specifier.startsWith('jsr:');
}

function isMappedSpecifier(
  specifier: string,
  importMap: Record<string, string>,
): boolean {
  if (Object.hasOwn(importMap, specifier)) return true;
  return Object.keys(importMap).some((key) => key.endsWith('/') && specifier.startsWith(key));
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function vitePath(path: string): string {
  return path.replace(/\\/g, '/');
}

const tmpRoot = Deno.makeTempDirSync({ prefix: 'openelement-consumer-local-' });
const projectName = 'consumer-test-app';
const keepTemp = Deno.env.get('OPEN_ELEMENT_KEEP_CONSUMER_LOCAL') === '1';
const packagedImportMapCheckOnly = Deno.args.includes('--packaged-import-map-check');
let exitCode = 0;

function cleanup(): void {
  if (keepTemp) {
    console.log(`Keeping temp project at ${tmpRoot}`);
    return;
  }
  rmSync(tmpRoot, { recursive: true, force: true });
}

async function runCommand(
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
): Promise<{ code: number; stdout: string; stderr: string }> {
  const result = await new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    env,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: result.code,
    stdout: new TextDecoder().decode(result.stdout),
    stderr: new TextDecoder().decode(result.stderr),
  };
}

console.log(`Generating test project from local workspace...`);

// Step 1: Generate project using local create package
const createResult = await runCommand([
  'run',
  '-A',
  join(repoRoot, 'packages', 'create', 'src', 'cli.ts'),
  projectName,
], tmpRoot);

if (createResult.code !== 0) {
  console.error('Failed to generate consumer project:');
  console.error(createResult.stderr);
  cleanup();
  Deno.exit(1);
}

const appDir = join(tmpRoot, projectName);
console.log(`Project generated at ${appDir}`);

// Step 2: Patch deno.json imports to point to local workspace source
const denoJsonPath = join(appDir, 'deno.json');
const denoJson = JSON.parse(readFileSync(denoJsonPath, 'utf-8'));
const generatedImportMap = { ...denoJson.imports } as Record<string, string>;
const productImports = [
  '@deno/vite-plugin',
  '@openelement/adapter-vite',
  '@openelement/app',
  '@openelement/element',
  'vite',
];
if (Object.keys(generatedImportMap).sort().join('\n') !== productImports.join('\n')) {
  console.error('Generated starter exposes a non-product import surface.');
  console.error(Object.keys(generatedImportMap).sort().join('\n'));
  cleanup();
  Deno.exit(1);
}

for (const [specifier, url] of allPackageAliases(repoRoot)) {
  denoJson.imports[specifier] = url;
}

denoJson.imports['lit'] = 'npm:lit@^3.2.0';
denoJson.imports['vite'] = 'npm:vite@8.0.10';
denoJson.imports['@deno/vite-plugin'] = 'npm:@deno/vite-plugin';
denoJson.imports['hono'] = 'npm:hono@4.12.23';
denoJson.imports['@hono/vite-dev-server'] = 'npm:@hono/vite-dev-server@^0.25.3';
denoJson.imports['parse5'] = 'npm:parse5@7.0.0';
denoJson.imports['entities'] = 'npm:entities@^4';
denoJson.imports['entities/'] = 'npm:entities@^4/';

// Override build task to use local source
denoJson.tasks.build = `deno run -A ${
  join(repoRoot, 'packages', 'adapter-vite', 'src', 'cli', 'build.ts')
}`;
delete denoJson.tasks['build:ssr'];
delete denoJson.tasks['build:client'];
delete denoJson.tasks['build:ssg'];

writeFileSync(denoJsonPath, JSON.stringify(denoJson, null, 2));

// Step 3: Patch Vite only with workspace aliases needed to execute the local
// implementation. The generated app itself remains limited to product imports.
const aliases = [...allPackageAliases(repoRoot)]
  .filter(([find]) => find !== '@openelement/ui/')
  .map(([find, url]) => ({
    find,
    replacement: vitePath(fileURLToPath(url)),
  }));

const viteConfigPath = join(appDir, 'vite.config.ts');
let viteConfig = readFileSync(viteConfigPath, 'utf-8');

viteConfig = viteConfig.replace(
  'plugins: [',
  `resolve: { alias: ${JSON.stringify(aliases, null, 4)} },\n  plugins: [`,
);
writeFileSync(viteConfigPath, viteConfig);

// Step 4: Symlink node_modules from repo root
try {
  Deno.symlinkSync(join(repoRoot, 'node_modules'), join(appDir, 'node_modules'), {
    type: 'dir',
  });
} catch {
  // Symlink may already exist or node_modules may not exist
}

// Step 5: Build the project
console.log('Building consumer project...');
const buildResult = await runCommand(['task', 'build'], appDir);

const stdout = buildResult.stdout;
const stderr = buildResult.stderr;

if (buildResult.code !== 0) {
  console.error('Consumer build FAILED:');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

if (!stdout.includes('Routes: 2 page(s), 1 API route(s)')) {
  console.error('Consumer build did not scan the expected page/API route surface.');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

// Step 6: Verify output
const indexHtmlPath = join(appDir, 'dist', 'index.html');
if (!existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found; consumer build produced no output');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

const freshnessHtmlPath = join(appDir, 'dist', 'freshness', 'index.html');
if (!existsSync(freshnessHtmlPath)) {
  console.error('dist/freshness/index.html not found; ISR intent route was not generated');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

const assetPath = join(appDir, 'dist', 'openelement-mark.svg');
if (!existsSync(assetPath)) {
  console.error('dist/openelement-mark.svg not found; public asset was not copied');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
if (!indexHtml.includes('Hello from openElement')) {
  console.error('dist/index.html does not contain expected content');
  console.error('Last 300 chars:', indexHtml.substring(indexHtml.length - 300));
  cleanup();
  Deno.exit(1);
}

if (!indexHtml.includes('data-open-layout="app-shell"')) {
  console.error('dist/index.html does not contain expected app shell marker');
  console.error('Last 300 chars:', indexHtml.substring(indexHtml.length - 300));
  cleanup();
  Deno.exit(1);
}

if (!indexHtml.includes('/openelement-mark.svg')) {
  console.error('dist/index.html does not reference the generated public asset');
  console.error('Last 300 chars:', indexHtml.substring(indexHtml.length - 300));
  cleanup();
  Deno.exit(1);
}

const freshnessHtml = readFileSync(freshnessHtmlPath, 'utf-8');
if (!freshnessHtml.includes('Freshness proof')) {
  console.error('dist/freshness/index.html does not contain expected ISR intent content');
  console.error('Last 300 chars:', freshnessHtml.substring(freshnessHtml.length - 300));
  cleanup();
  Deno.exit(1);
}

const serverEntryPath = join(appDir, 'dist', 'server', 'entry.js');
if (!existsSync(serverEntryPath)) {
  console.error('dist/server/entry.js not found; SSR bundle was not generated');
  console.error(stdout);
  console.error(stderr);
  cleanup();
  Deno.exit(1);
}

const serverEntry = readFileSync(serverEntryPath, 'utf-8');
const missingGeneratedImports = findMissingGeneratedImports(serverEntry, generatedImportMap);
const missingProductImports = missingGeneratedImports.filter((specifier) =>
  specifier.startsWith('@openelement/')
);
if (missingProductImports.length > 0) {
  console.error(
    'Generated SSR bundle leaks non-product OpenElement imports. ' +
      'A consumer must not need internal package aliases.',
  );
  for (const specifier of missingProductImports) {
    console.error(`- ${specifier}`);
  }
  cleanup();
  Deno.exit(1);
}

if (missingGeneratedImports.length > 0) {
  console.log(
    'Local bundle contains third-party runtime dependencies; packed npm smoke validates their ' +
      'published dependency metadata.',
  );
}

if (packagedImportMapCheckOnly) {
  console.log('Packaged starter import-map smoke passed.');
  cleanup();
  Deno.exit(0);
}

console.log(
  'Local consumer build passed; pages, app shell, island, API route, asset, and ISR intent surface verified.',
);

// Step 7: Mount the generated server entry in a real Nitro node output.
console.log('Building generated app through Nitro node preset...');
writeFileSync(
  join(appDir, 'nitro.config.ts'),
  `export default defineNitroConfig({
  srcDir: 'server',
  preset: 'node-server',
  publicAssets: [{ dir: '../public' }],
  output: { dir: '.output-node' },
  compatibilityDate: '2026-06-12',
});
`,
);

const nitroRouteDir = join(appDir, 'server', 'routes');
await Deno.mkdir(nitroRouteDir, { recursive: true });
writeFileSync(
  join(nitroRouteDir, '[...path].ts'),
  `import { createOpenElementNitroHandler } from '${
    pathToFileURL(join(repoRoot, 'packages', 'adapter-vite', 'src', 'nitro-mount.ts')).href
  }';
import { eventHandler, getMethod, getRequestHeaders, getRequestURL } from 'h3';
import { openElementHandler } from '../../dist/server/entry.js';

const handler = createOpenElementNitroHandler({
  baseUrl: 'http://localhost',
  handler: openElementHandler,
});

export default eventHandler(async (event) => {
  const url = getRequestURL(event);
  const result = await handler({
    method: getMethod(event),
    path: url.pathname,
    headers: getRequestHeaders(event),
    platform: {
      waitUntil() {},
      passThroughOnException() {},
    },
  });
  return result.response;
});
`,
);

const nitroResult = await runCommand([
  'run',
  '--node-modules-dir=auto',
  '-A',
  'npm:nitro@3.0.0',
  'build',
], appDir);

if (nitroResult.code !== 0) {
  console.error('Generated app Nitro build FAILED:');
  console.error(nitroResult.stdout);
  console.error(nitroResult.stderr);
  cleanup();
  Deno.exit(1);
}

const nitroServerEntry = join(appDir, '.output-node', 'server', 'index.mjs');
if (!existsSync(nitroServerEntry)) {
  console.error(`Nitro node server entry missing: ${nitroServerEntry}`);
  console.error(nitroResult.stdout);
  console.error(nitroResult.stderr);
  cleanup();
  Deno.exit(1);
}

// Let the OS choose from its ephemeral range. The previous fixed 48000-48999
// range collides with parallel CI jobs often enough to make this proof flaky.
// There is still a small bind-after-close window, but avoiding the shared fixed
// range removes the deterministic cross-job collision seen in GitHub Actions.
const portProbe = Deno.listen({ hostname: '127.0.0.1', port: 0 });
const port = (portProbe.addr as Deno.NetAddr).port;
portProbe.close();
const server = new Deno.Command('node', {
  args: [nitroServerEntry],
  cwd: appDir,
  env: {
    HOST: '127.0.0.1',
    PORT: String(port),
  },
  stdout: 'piped',
  stderr: 'piped',
}).spawn();
let serverExited = false;
const serverStatus = server.status.then((status) => {
  serverExited = true;
  return status;
});
const serverStdout = new Response(server.stdout).text();
const serverStderr = new Response(server.stderr).text();

let nitroSmokeFailed = false;
try {
  const baseUrl = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      await fetch(`${baseUrl}/api/health`);
      // Any HTTP response proves the server is listening. Route correctness is
      // asserted below with the full status and payload so a 4xx/5xx is not
      // misreported as a startup timeout.
      ready = true;
      break;
    } catch {
      // wait below
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) {
    console.error('Generated app Nitro smoke failed: server did not become ready.');
    const status = serverExited ? await serverStatus : null;
    if (status) {
      console.error(JSON.stringify({ serverStatus: status }, null, 2));
      const [stdout, stderr] = await Promise.all([
        serverStdout.catch(() => ''),
        serverStderr.catch(() => ''),
      ]);
      if (stdout) console.error(stdout);
      if (stderr) console.error(stderr);
    }
    nitroSmokeFailed = true;
  }

  if (!nitroSmokeFailed) {
    const health = await fetch(`${baseUrl}/api/health`);
    const healthPayload = await health.json() as {
      ok?: boolean;
      framework?: string;
      route?: string;
    };
    if (
      health.status !== 200 ||
      healthPayload.ok !== true ||
      healthPayload.framework !== 'openElement' ||
      healthPayload.route !== '/api/health'
    ) {
      console.error(JSON.stringify({ status: health.status, healthPayload }, null, 2));
      nitroSmokeFailed = true;
    }
  }

  if (!nitroSmokeFailed) {
    const home = await fetch(`${baseUrl}/`);
    const homeHtml = await home.text();
    if (
      home.status !== 200 ||
      !homeHtml.includes('Hello from openElement') ||
      !homeHtml.includes('data-open-layout="app-shell"')
    ) {
      console.error(JSON.stringify({ status: home.status, body: homeHtml.slice(-500) }, null, 2));
      nitroSmokeFailed = true;
    }
  }

  if (!nitroSmokeFailed) {
    const freshness = await fetch(`${baseUrl}/freshness`);
    const freshnessHtml = await freshness.text();
    if (
      freshness.status !== 200 ||
      !freshnessHtml.includes('Freshness proof') ||
      !freshnessHtml.includes('data-open-layout="app-shell"')
    ) {
      console.error(JSON.stringify(
        {
          status: freshness.status,
          body: freshnessHtml.slice(-500),
        },
        null,
        2,
      ));
      nitroSmokeFailed = true;
    }
  }

  if (!nitroSmokeFailed) {
    const asset = await fetch(`${baseUrl}/openelement-mark.svg`);
    const assetBody = await asset.text();
    if (
      asset.status !== 200 ||
      !assetBody.includes('<svg') ||
      !assetBody.includes('&lt;open/&gt; mark')
    ) {
      console.error(
        JSON.stringify({ status: asset.status, body: assetBody.slice(0, 200) }, null, 2),
      );
      nitroSmokeFailed = true;
    }
  }
} finally {
  if (!serverExited) {
    try {
      server.kill('SIGTERM');
    } catch (err) {
      if (!(err instanceof TypeError)) {
        console.error('[consumer-local] failed to stop Nitro smoke server:', err);
      }
    }
  }
  await serverStatus.catch(() => undefined);
}

if (nitroSmokeFailed) {
  const [stdout, stderr] = await Promise.all([
    serverStdout.catch(() => ''),
    serverStderr.catch(() => ''),
  ]);
  if (stdout) console.error(stdout);
  if (stderr) console.error(stderr);
}

if (nitroSmokeFailed) exitCode = 1;
else console.log('Generated app Nitro node smoke passed.');

// Cleanup
cleanup();
if (exitCode !== 0) Deno.exit(exitCode);
