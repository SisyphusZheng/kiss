import { assert, assertEquals, assertFalse, assertThrows } from 'jsr:@std/assert@^1.0.0';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertUnifiedProductVersions,
  buildTemplates,
  resolveVersions,
} from '../src/template-builder.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = join(__dirname, '..');

function readTemplate(path: string): string {
  return readFileSync(join(packageDir, 'templates', path), 'utf-8');
}

async function runCreate(executable: string, cwd: string, name: string) {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', executable, name],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
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
    'hono',
    'vite',
  ]);
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
  const manifest = JSON.parse(readFileSync(join(packageDir, 'deno.json'), 'utf-8'));
  const versionSource = readFileSync(join(packageDir, 'src', 'version.ts'), 'utf-8');
  assert(versionSource.includes(`'${manifest.version}'`));
});

Deno.test('Create and all five packages share one release version', () => {
  const versions = ['adapter-vite', 'app', 'create', 'element', 'ui'].map((name) =>
    JSON.parse(readFileSync(join(packageDir, '..', name, 'deno.json'), 'utf-8')).version as string
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
    readFileSync(join(packageDir, '..', 'adapter-vite', 'deno.json'), 'utf-8'),
  ).imports;
  assertEquals(denoJson.imports.vite, adapterViteImports.vite);
  assert(/^npm:vite@\d+\.\d+\.\d+$/.test(String(denoJson.imports.vite)), denoJson.imports.vite);
  // #679: the check task must cover the app-shell component template.
  const checkTask = String(denoJson.tasks.check || '');
  assert(checkTask.includes('app/components/app-shell.tsx'), checkTask);
});

Deno.test('starter templates use the supported Element JSX entrypoint', () => {
  for (
    const path of [
      'app/routes/index.tsx',
      'app/routes/freshness.tsx',
      'app/routes/contact.tsx',
      'app/components/app-shell.tsx',
      'app/islands/my-counter.tsx',
    ]
  ) {
    const source = readTemplate(path);
    assert(source.includes('@jsxImportSource @openelement/element'), path);
    assertFalse(source.includes('@openelement/core'), path);
  }
  assert(readTemplate('gitignore.tmpl').includes('dist/'));
});

Deno.test('starter --brand token stays aligned with the ui package --violet-6 (#804)', () => {
  const viteConfig = readTemplate('vite.config.ts');
  const brand = viteConfig.match(/--brand:(#[0-9a-fA-F]{3,8})/)?.[1];
  const uiTokens = readFileSync(
    join(packageDir, '..', 'ui', 'src', 'open-props-tokens.css'),
    'utf-8',
  );
  const violet6 = uiTokens.match(/--violet-6:\s*(#[0-9a-fA-F]{3,8})/)?.[1];
  assert(brand, 'starter vite.config.ts must define a --brand token');
  assertEquals(brand, violet6);
});

Deno.test('source CLI generates a complete, token-free starter', async () => {
  const tmpRoot = Deno.makeTempDirSync({ prefix: 'open-create-source-' });
  try {
    await runCreate(join(packageDir, 'src', 'cli.ts'), tmpRoot, 'sample-app');
    const appDir = join(tmpRoot, 'sample-app');
    assert(existsSync(join(appDir, '.gitignore')));
    assertFalse(existsSync(join(appDir, 'gitignore.tmpl')));
    assertFalse(readFileSync(join(appDir, 'deno.json'), 'utf-8').includes('${v.'));
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
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
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});
