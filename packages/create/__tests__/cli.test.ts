import { assert, assertEquals, assertFalse, assertThrows } from '@std/assert';
import { existsSync } from '@std/fs';
import { join } from '@std/path';
import {
  assertUnifiedProductVersions,
  buildTemplates,
  resolveVersions,
} from '../src/template-builder.ts';

const packageDir = join(import.meta.dirname!, '..');

function readTemplate(path: string): string {
  return Deno.readTextFileSync(join(packageDir, 'templates', path));
}

async function runCreate(executable: string, cwd: string, name: string) {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', executable, name],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  return new TextDecoder().decode(result.stdout);
}

Deno.test('starter exposes only product imports and the standard lifecycle', () => {
  const denoJson = JSON.parse(readTemplate('deno.json.tmpl'));
  assertEquals(Object.keys(denoJson.imports).sort(), [
    '@deno/vite-plugin',
    '@openelement/adapter-vite',
    '@openelement/adapter-vite/nitro-mount',
    '@openelement/app',
    '@openelement/element',
    '@openelement/element/jsx-dev-runtime',
    '@openelement/element/jsx-runtime',
    '@openelement/generated/blog-data',
    'hono',
    'vite',
  ]);
  // The blog routes import the adapter-generated data module; the import map
  // points at the local type stub so `deno task check` passes before the
  // first dev/build generates the runtime module.
  assertEquals(
    denoJson.imports['@openelement/generated/blog-data'],
    './app/data/_generated-blog-data.d.ts',
  );
  assertEquals(
    denoJson.imports['@openelement/element/jsx-runtime'],
    'npm:@openelement/element@${v.element}/jsx-runtime',
  );
  assertEquals(
    denoJson.imports['@openelement/element/jsx-dev-runtime'],
    'npm:@openelement/element@${v.element}/jsx-dev-runtime',
  );
  assertEquals(
    Object.keys(denoJson.tasks).sort(),
    ['build', 'check', 'dev', 'preview', 'start', 'test'],
  );
  assert(
    String(denoJson.imports['@openelement/adapter-vite/nitro-mount'] || '').includes(
      'nitro-mount',
    ),
    'starter import map must include adapter-vite/nitro-mount (#601)',
  );
  assert(
    String(denoJson.tasks.start || '').includes('cli/start'),
    'starter must expose deno task start (#601)',
  );
  assertEquals(denoJson.tasks.test, 'deno test --config deno.json --permit-no-files');
  assertEquals(denoJson.imports.hono, 'npm:hono@^4.12');
  assertEquals(denoJson.compilerOptions.jsxImportSource, '@openelement/element');
  assertFalse(JSON.stringify(denoJson).includes('@openelement/core'));
  assertFalse(JSON.stringify(denoJson).includes('@openelement/router'));
  assertFalse(JSON.stringify(denoJson).includes('@openelement/signal'));
});

Deno.test('embedded CLI version matches its package manifest', () => {
  const manifest = JSON.parse(Deno.readTextFileSync(join(packageDir, 'deno.json')));
  const versionSource = Deno.readTextFileSync(join(packageDir, 'src', 'version.ts'));
  assert(versionSource.includes(`'${manifest.version}'`));
});

Deno.test('Create and all five packages share one release version', () => {
  const versions = ['adapter-vite', 'app', 'create', 'element', 'ui'].map((name) =>
    JSON.parse(Deno.readTextFileSync(join(packageDir, '..', name, 'deno.json'))).version as string
  );
  assertEquals([...new Set(versions)], [resolveVersions().app]);
});

Deno.test('Create rejects mixed product versions instead of silently generating', () => {
  assertThrows(
    () =>
      assertUnifiedProductVersions({
        app: '0.41.0-alpha.13',
        adapterVite: '0.41.0-alpha.12',
        element: '0.41.0-alpha.13',
      }),
    Error,
    'same-version release invariant',
  );
});

Deno.test('async template build returns deterministic path order', async () => {
  const templates = await buildTemplates(resolveVersions());
  assertEquals(Object.keys(templates), Object.keys(templates).toSorted());
  assertFalse(Object.values(templates).some((content) => content.includes('${v.')));
});

Deno.test('generated starter pins every OpenElement import to the exact release', async () => {
  const versions = resolveVersions();
  const config = JSON.parse((await buildTemplates(versions))['deno.json']);
  assertEquals(config.imports['@openelement/app'], `npm:@openelement/app@${versions.app}`);
  assertEquals(
    config.imports['@openelement/adapter-vite'],
    `npm:@openelement/adapter-vite@${versions.adapterVite}`,
  );
  assertEquals(
    config.imports['@openelement/element'],
    `npm:@openelement/element@${versions.element}`,
  );
  assertEquals(
    config.imports['@openelement/element/jsx-runtime'],
    `npm:@openelement/element@${versions.element}/jsx-runtime`,
  );
  assertEquals(
    config.imports['@openelement/element/jsx-dev-runtime'],
    `npm:@openelement/element@${versions.element}/jsx-dev-runtime`,
  );
});

Deno.test('starter pins vite exactly, pins @deno/vite-plugin, and type-checks app-shell', () => {
  const denoJson = JSON.parse(readTemplate('deno.json.tmpl'));
  // #680: @deno/vite-plugin must be pinned to an exact version, not a range.
  const vitePlugin = String(denoJson.imports['@deno/vite-plugin'] || '');
  assert(/^npm:@deno\/vite-plugin@\d+\.\d+\.\d+$/.test(vitePlugin), vitePlugin);
  // #681: starter vite version must stay aligned with packages/adapter-vite.
  const adapterViteImports = JSON.parse(
    Deno.readTextFileSync(join(packageDir, '..', 'adapter-vite', 'deno.json')),
  ).imports;
  assertEquals(denoJson.imports.vite, adapterViteImports.vite);
  assert(/^npm:vite@\d+\.\d+\.\d+$/.test(String(denoJson.imports.vite)), denoJson.imports.vite);
  // #927: the dev task must pin the same exact vite version as the import
  // map — a bare npm:vite resolves to latest independently of import maps,
  // which would run a second vite copy next to the pinned one.
  const devTask = String(denoJson.tasks.dev || '');
  const pinnedVite = String(denoJson.imports.vite).match(/@([^@]+)$/)?.[1] ?? '';
  assert(devTask.includes(`npm:vite@${pinnedVite}`), devTask);
  // #679: the check task must cover the app-shell component template.
  const checkTask = String(denoJson.tasks.check || '');
  assert(checkTask.includes('app/components/app-shell.tsx'), checkTask);
  // The check task must cover every shipped route (including the dynamic blog
  // route and the API route) plus vite.config.ts, so template regressions
  // surface in the generated app's own `deno task check`.
  assert(checkTask.includes('app/routes/blog/index.tsx'), checkTask);
  assert(checkTask.includes('app/routes/blog/[slug].tsx'), checkTask);
  assert(checkTask.includes('app/routes/api/health.ts'), checkTask);
  assert(checkTask.includes('vite.config.ts'), checkTask);
});

Deno.test('starter templates use the supported Element JSX entrypoint', () => {
  for (
    const path of [
      'app/routes/index.tsx',
      'app/routes/freshness.tsx',
      'app/routes/contact.tsx',
      'app/routes/blog/index.tsx',
      'app/routes/blog/[slug].tsx',
      'app/components/app-shell.tsx',
      'app/islands/my-counter.tsx',
      'app/islands/only-ticker.tsx',
    ]
  ) {
    const source = readTemplate(path);
    assert(source.includes('@jsxImportSource @openelement/element'), path);
    assertFalse(source.includes('@openelement/core'), path);
  }
  assert(readTemplate('gitignore.tmpl').includes('dist/'));
});

Deno.test('starter island binds its signal through hydration markers', () => {
  const island = readTemplate('app/islands/my-counter.tsx');
  // A plain `{count.value}` render output is static text: hydration only
  // rewires data-signal markers, so the starter island must register its
  // signal and reference it by name to stay interactive after load.
  assert(island.includes("registerSignal('count'"), island);
  assert(island.includes("data-signal='count'"), island);
});

Deno.test('client-only starter island declares a data-signal marker (#939)', () => {
  const island = readTemplate('app/islands/only-ticker.tsx');
  // hydrate:'only' ships no DSD template; the CSR render must still activate
  // the manual data-signal marker, so the island must register its signal and
  // reference it by name — same contract as the DSD path.
  assert(island.includes("hydrate: 'only'"), island);
  assert(island.includes("registerSignal('tick'"), island);
  assert(island.includes("data-signal='tick'"), island);
});

Deno.test('starter global style block scopes tokens under :root', () => {
  const config = readTemplate('vite.config.ts');
  // Bare `--token:value` declarations at stylesheet top level are dropped by
  // CSS error recovery and take the following body rule down with them.
  assert(config.includes('<style>:root{'), config);
  assert(config.includes('--gray-0:#f8f9fa'), config);
});

Deno.test('starter blog routes consume the generated blog-data module', () => {
  const index = readTemplate('app/routes/blog/index.tsx');
  const slug = readTemplate('app/routes/blog/[slug].tsx');
  assert(index.includes('@openelement/generated/blog-data'), index);
  assert(slug.includes('@openelement/generated/blog-data'), slug);
  // Dynamic post page: prerender one page per post and render trusted
  // markdown HTML (pattern mirrors the www site blog routes).
  assert(slug.includes('getStaticPaths'), slug);
  assert(slug.includes('getPostBySlug'), slug);
  assert(slug.includes('trustedHtml'), slug);
  // #922: unknown slugs signal 404 through notFound(), not a 200 page.
  assert(slug.includes('notFound'), slug);
});

Deno.test('starter --brand token stays aligned with the ui package --violet-6 (#804)', () => {
  const viteConfig = readTemplate('vite.config.ts');
  const brand = viteConfig.match(/--brand:(#[0-9a-fA-F]{3,8})/)?.[1];
  const uiTokens = Deno.readTextFileSync(
    join(packageDir, '..', 'ui', 'src', 'open-props-tokens.css'),
  );
  const violet6 = uiTokens.match(/--violet-6:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
  assert(brand, 'starter vite.config.ts must define a --brand token');
  assertEquals(brand, violet6);
});

Deno.test('source CLI generates a complete, token-free starter', async () => {
  const tmpRoot = Deno.makeTempDirSync({ prefix: 'open-create-source-' });
  try {
    const stdout = await runCreate(join(packageDir, 'src', 'cli.ts'), tmpRoot, 'sample-app');
    const appDir = join(tmpRoot, 'sample-app');
    assert(existsSync(join(appDir, '.gitignore')));
    assertFalse(existsSync(join(appDir, 'gitignore.tmpl')));
    assertFalse(Deno.readTextFileSync(join(appDir, 'deno.json')).includes('${v.'));
    // Starter ships the blog routes wired to content/blog, the blog-data type
    // stub, and a README explaining tasks/conventions.
    assert(existsSync(join(appDir, 'README.md')));
    assert(existsSync(join(appDir, 'app', 'routes', 'blog', 'index.tsx')));
    assert(existsSync(join(appDir, 'app', 'routes', 'blog', '[slug].tsx')));
    assert(existsSync(join(appDir, 'app', 'data', '_generated-blog-data.d.ts')));
    // Success output points at the README for the full task list.
    assert(stdout.includes('README.md'), stdout);
  } finally {
    Deno.removeSync(tmpRoot, { recursive: true });
  }
});

Deno.test('packed CLI retains every starter template, including dotfiles', async () => {
  const tmpRoot = Deno.makeTempDirSync({ prefix: 'open-create-packed-' });
  try {
    const tarball = join(tmpRoot, 'create.tgz');
    const pack = await new Deno.Command(Deno.execPath(), {
      args: ['pack', '--allow-dirty', '--output', tarball],
      cwd: packageDir,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(pack.code, 0, new TextDecoder().decode(pack.stderr));
    const unpack = await new Deno.Command('tar', {
      args: ['-xzf', tarball, '-C', tmpRoot],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(unpack.code, 0, new TextDecoder().decode(unpack.stderr));
    await runCreate(join(tmpRoot, 'package', 'src', 'cli.js'), tmpRoot, 'sample-app');
    assert(existsSync(join(tmpRoot, 'sample-app', '.gitignore')));
    assert(existsSync(join(tmpRoot, 'sample-app', 'content', 'blog', 'welcome.md')));
    assert(existsSync(join(tmpRoot, 'sample-app', 'README.md')));
    assert(existsSync(join(tmpRoot, 'sample-app', 'app', 'routes', 'blog', '[slug].tsx')));
    assert(existsSync(join(tmpRoot, 'sample-app', 'app', 'data', '_generated-blog-data.d.ts')));
  } finally {
    Deno.removeSync(tmpRoot, { recursive: true });
  }
});
