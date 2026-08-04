#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * consumer-smoke
 *
 * Post-publish npm smoke test: creates temporary consumer projects and
 * verifies @openelement/element can be consumed from npm in Deno and Node.
 * Also checks the jsDelivr CDN browser-safe export and Nitro build output.
 *
 * Usage:
 *   deno run -A tools/consumer-smoke.ts
 *   deno run -A tools/consumer-smoke.ts --local
 *   deno run -A tools/consumer-smoke.ts --version <x.y.z>
 *   deno run -A tools/consumer-smoke.ts --version <x.y.z> --jsdelivr --nitro
 */

import { getArg, runWithOutput } from './lib/process.ts';
import { readJson } from './lib/fs.ts';
import { normalizeSlashes } from './lib/path.ts';

function getArgFlag(flag: string): boolean {
  return Deno.args.includes(flag);
}

async function run(
  cmd: string,
  args: string[],
  cwd?: string,
): Promise<{ success: boolean; output: string }> {
  const result = await runWithOutput(cmd, args, { cwd });
  return {
    success: result.success,
    output: (result.stdout + result.stderr).slice(0, 2000),
  };
}

const denoSource = `
import { isVNode, type VNode } from '@openelement/element';

const node: VNode = {
  tag: 'div',
  props: { class: 'test' },
  children: ['Hello openElement'],
};

console.log('isVNode:', isVNode(node));
console.log('tag:', node.tag);
console.log('children:', node.children);
console.log('Smoke test passed!');
`.trim();

const nodeSource = `
import { isVNode } from '@openelement/element';

const node = {
  tag: 'div',
  props: { class: 'test' },
  children: ['Hello openElement'],
};

console.log('isVNode:', isVNode(node));
console.log('tag:', node.tag);
console.log('children:', node.children);
console.log('Smoke test passed!');
`.trim();

async function denoNpmSmoke(version: string, projectRoot: string, local: boolean): Promise<void> {
  const tmpDir = local
    ? await Deno.makeTempDir({ dir: projectRoot, prefix: '.openelement-smoke-deno-' })
    : await Deno.makeTempDir({ prefix: 'openelement-smoke-deno-' });
  console.log(`\n[Deno npm consumer] ${tmpDir}`);

  try {
    await Deno.writeTextFile(`${tmpDir}/smoke.ts`, denoSource);

    if (local) {
      // Run from the workspace root so workspace packages resolve.
      // Sloppy imports are required because core sources use .js extension imports.
      console.log('  deno check smoke.ts (workspace source)');
      const check = await run(
        'deno',
        ['check', '--unstable-sloppy-imports', `${tmpDir}/smoke.ts`],
        projectRoot,
      );
      if (!check.success) {
        console.error(`  check failed:\n${check.output}`);
        Deno.exit(1);
      }

      console.log('  deno run smoke.ts (workspace source)');
      const exec = await run(
        'deno',
        ['run', '--unstable-sloppy-imports', `${tmpDir}/smoke.ts`],
        projectRoot,
      );
      if (!exec.success) {
        console.error(`  run failed:\n${exec.output}`);
        Deno.exit(1);
      }
      console.log(`  ok: ${exec.output.trim().split('\n').slice(-1)[0]}`);
      return;
    }

    await Deno.writeTextFile(
      `${tmpDir}/deno.json`,
      JSON.stringify(
        { imports: { '@openelement/element': `npm:@openelement/element@^${version}` } },
        null,
        2,
      ),
    );

    console.log('  deno check smoke.ts');
    const check = await run('deno', ['check', '--minimum-dependency-age', '0', 'smoke.ts'], tmpDir);
    if (!check.success) {
      console.error(`  check failed:\n${check.output}`);
      Deno.exit(1);
    }

    console.log('  deno run smoke.ts');
    const exec = await run('deno', ['run', '--minimum-dependency-age', '0', 'smoke.ts'], tmpDir);
    if (!exec.success) {
      console.error(`  run failed:\n${exec.output}`);
      Deno.exit(1);
    }
    console.log(`  ok: ${exec.output.trim().split('\n').slice(-1)[0]}`);
  } finally {
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch { /* ok */ }
  }
}

async function nodeEsmSmoke(version: string, projectRoot: string, local: boolean): Promise<void> {
  const tmpDir = await Deno.makeTempDir({ prefix: 'openelement-smoke-node-' });
  console.log(`\n[Node ESM consumer] ${tmpDir}`);

  try {
    if (local) {
      const workspacePackages = ['element'];
      for (const pkg of workspacePackages) {
        console.log(`  deno pack packages/${pkg}`);
        const pack = await run(
          'deno',
          ['pack', '--allow-dirty', '-o', `${tmpDir}/openelement-${pkg}.tgz`],
          `${projectRoot}/packages/${pkg}`,
        );
        if (!pack.success) {
          console.error(`  pack failed:\n${pack.output}`);
          Deno.exit(1);
        }
      }
    }

    const dep = local ? 'file:./openelement-element.tgz' : `^${version}`;
    const localDeps = local
      ? {
        '@openelement/element': 'file:./openelement-element.tgz',
        '@preact/signals-core': '^1.12.1',
      }
      : { '@openelement/element': dep };

    await Deno.writeTextFile(
      `${tmpDir}/package.json`,
      JSON.stringify({ type: 'module', dependencies: localDeps }, null, 2),
    );
    await Deno.writeTextFile(`${tmpDir}/smoke.mjs`, nodeSource);

    console.log('  npm install');
    const install = await run('npm', ['install'], tmpDir);
    if (!install.success) {
      console.error(`  install failed:\n${install.output}`);
      Deno.exit(1);
    }

    console.log('  node smoke.mjs');
    const exec = await run('node', ['smoke.mjs'], tmpDir);
    if (!exec.success) {
      console.error(`  run failed:\n${exec.output}`);
      Deno.exit(1);
    }
    console.log(`  ok: ${exec.output.trim().split('\n').slice(-1)[0]}`);
  } finally {
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch { /* ok */ }
  }
}

async function exactVersionStarterSmoke(version: string): Promise<void> {
  const tmpDir = await Deno.makeTempDir({ prefix: 'openelement-smoke-starter-' });
  console.log(`\n[Exact-version starter] ${tmpDir}`);
  try {
    const create = await run(
      'deno',
      [
        'run',
        '-A',
        '--minimum-dependency-age',
        '0',
        `npm:@openelement/create@${version}`,
        'starter',
      ],
      tmpDir,
    );
    if (!create.success) throw new Error(`starter generation failed:\n${create.output}`);
    const config = await readJson(`${tmpDir}/starter/deno.json`) as {
      imports: Record<string, string>;
    };
    for (const pkg of ['app', 'adapter-vite', 'element']) {
      const expected = `npm:@openelement/${pkg}@${version}`;
      if (config.imports[`@openelement/${pkg}`] !== expected) {
        throw new Error(
          `starter import @openelement/${pkg}=${
            config.imports[`@openelement/${pkg}`]
          }, expected=${expected}`,
        );
      }
    }
    const check = await run('deno', ['task', 'check'], `${tmpDir}/starter`);
    if (!check.success) throw new Error(`starter check failed:\n${check.output}`);
    console.log('  ok: generated package graph and typecheck use the released version');
  } finally {
    await Deno.remove(tmpDir, { recursive: true }).catch(() => undefined);
  }
}

async function jsdelivrSmoke(version: string): Promise<void> {
  const url = `https://cdn.jsdelivr.net/npm/@openelement/element@${version}/+esm`;
  console.log(`\n[jsDelivr CDN browser-safe export] ${url}`);

  const response = await fetch(url);
  const text = await response.text();

  if (response.status !== 200) {
    console.error(`  failed: status ${response.status}`);
    console.error(text.slice(0, 500));
    Deno.exit(1);
  }

  if (text.trim().length === 0) {
    console.error('  failed: empty response');
    Deno.exit(1);
  }

  console.log(`  ok: ${text.length} bytes`);
}

async function nitroSmoke(): Promise<void> {
  console.log('\n[Nitro output smoke]');

  for (const target of ['node', 'workers']) {
    console.log(`  deno task nitro:proof:${target}`);
    const result = await runWithOutput('deno', ['task', `nitro:proof:${target}`]);
    const output = result.stdout + result.stderr;
    if (!result.success) {
      console.error(`  ${target} failed:\n${output.slice(0, 2000)}`);
      Deno.exit(1);
    }
    if (!output.includes(`nitro proof ${target}:`)) {
      console.error(`  ${target} missing success marker`);
      Deno.exit(1);
    }
    const lastLine = output.trim().split('\n').slice(-1)[0];
    console.log(`  ok: ${lastLine}`);
  }
}

async function npmPackageExists(name: string, version: string): Promise<boolean> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${name}/${version}`);
    return response.status === 200;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const { PACKAGE_VERSION } = await import('./project-constants.ts');
  const local = getArgFlag('--local');
  const versionArg = getArg('--version');
  const version = versionArg ?? PACKAGE_VERSION;
  const versionProvided = versionArg !== null;
  const projectRoot = normalizeSlashes(Deno.cwd());

  const runJsDelivr = getArgFlag('--jsdelivr') || (versionProvided && !local);
  const runNitro = getArgFlag('--nitro') || (versionProvided && !local);

  console.log('Consumer npm smoke test');
  console.log(`  mode: ${local ? 'local workspace' : `npm @openelement/element@${version}`}`);
  if (runJsDelivr) console.log('  + jsDelivr CDN smoke');
  if (runNitro) console.log('  + Nitro output smoke');

  if (!local) {
    const exists = await npmPackageExists('@openelement/element', version);
    if (!exists) {
      console.log(
        `\n@openelement/element@${version} is not yet available on npm; skipping npm consumer smoke.`,
      );
      console.log('Run again after publish, or use --local to test against workspace sources.');
      return;
    }
  }

  await denoNpmSmoke(version, projectRoot, local);
  await nodeEsmSmoke(version, projectRoot, local);
  if (!local) await exactVersionStarterSmoke(version);

  if (runJsDelivr) {
    await jsdelivrSmoke(version);
  }

  if (runNitro) {
    await nitroSmoke();
  }

  console.log('\nAll smoke tests passed');
}

await main();
