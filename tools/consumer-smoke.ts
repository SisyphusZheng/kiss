#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * consumer-smoke — v0.41.0
 *
 * Post-publish npm smoke test: creates temporary consumer projects and
 * verifies @openelement/core can be consumed from npm in Deno and Node.
 * Also checks the jsDelivr CDN browser-safe export and Nitro build output.
 *
 * Usage:
 *   deno run -A tools/consumer-smoke.ts
 *   deno run -A tools/consumer-smoke.ts --local
 *   deno run -A tools/consumer-smoke.ts --version 0.41.0
 *   deno run -A tools/consumer-smoke.ts --version 0.41.0 --jsdelivr --nitro
 */

function getArg(flag: string): string | null {
  const idx = Deno.args.indexOf(flag);
  if (idx !== -1 && idx + 1 < Deno.args.length) return Deno.args[idx + 1];
  return null;
}

function getArgFlag(flag: string): boolean {
  return Deno.args.includes(flag);
}

async function run(
  cmd: string,
  args: string[],
  cwd?: string,
): Promise<{ success: boolean; output: string }> {
  const result = await new Deno.Command(cmd, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  const decoder = new TextDecoder();
  const output = decoder.decode(result.stdout) + decoder.decode(result.stderr);

  return {
    success: result.code === 0,
    output: output.slice(0, 2000),
  };
}

async function runWithOutput(
  cmd: string,
  args: string[],
  cwd?: string,
): Promise<{ success: boolean; output: string }> {
  const result = await new Deno.Command(cmd, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  const decoder = new TextDecoder();
  const output = decoder.decode(result.stdout) + decoder.decode(result.stderr);

  return {
    success: result.code === 0,
    output,
  };
}

const denoSource = `
import { isVNode, type VNode } from '@openelement/core';

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
import { isVNode } from '@openelement/core';

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
        { imports: { '@openelement/core': `npm:@openelement/core@^${version}` } },
        null,
        2,
      ),
    );

    console.log('  deno check smoke.ts');
    const check = await run('deno', ['check', 'smoke.ts'], tmpDir);
    if (!check.success) {
      console.error(`  check failed:\n${check.output}`);
      Deno.exit(1);
    }

    console.log('  deno run smoke.ts');
    const exec = await run('deno', ['run', 'smoke.ts'], tmpDir);
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
      const workspacePackages = ['signal', 'protocol', 'core'];
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

    const dep = local ? 'file:./openelement-core.tgz' : `^${version}`;
    const localDeps = local
      ? {
        '@openelement/core': 'file:./openelement-core.tgz',
        '@openelement/signal': 'file:./openelement-signal.tgz',
        '@openelement/protocol': 'file:./openelement-protocol.tgz',
        '@preact/signals-core': '^1.12.1',
      }
      : { '@openelement/core': dep };

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

async function jsdelivrSmoke(version: string): Promise<void> {
  const url = `https://cdn.jsdelivr.net/npm/@openelement/core@${version}/+esm`;
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
    if (!result.success) {
      console.error(`  ${target} failed:\n${result.output.slice(0, 2000)}`);
      Deno.exit(1);
    }
    if (!result.output.includes(`nitro proof ${target}:`)) {
      console.error(`  ${target} missing success marker`);
      Deno.exit(1);
    }
    const lastLine = result.output.trim().split('\n').slice(-1)[0];
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
  const local = getArgFlag('--local');
  const versionArg = getArg('--version');
  const version = versionArg ?? '0.41.0';
  const versionProvided = versionArg !== null;
  const projectRoot = Deno.cwd().replace(/\\/g, '/');

  const runJsDelivr = getArgFlag('--jsdelivr') || (versionProvided && !local);
  const runNitro = getArgFlag('--nitro') || (versionProvided && !local);

  console.log('Consumer npm smoke test');
  console.log(`  mode: ${local ? 'local workspace' : `npm @openelement/core@${version}`}`);
  if (runJsDelivr) console.log('  + jsDelivr CDN smoke');
  if (runNitro) console.log('  + Nitro output smoke');

  if (!local) {
    const exists = await npmPackageExists('@openelement/core', version);
    if (!exists) {
      console.log(
        `\n@openelement/core@${version} is not yet available on npm; skipping npm consumer smoke.`,
      );
      console.log('Run again after publish, or use --local to test against workspace sources.');
      return;
    }
  }

  await denoNpmSmoke(version, projectRoot, local);
  await nodeEsmSmoke(version, projectRoot, local);

  if (runJsDelivr) {
    await jsdelivrSmoke(version);
  }

  if (runNitro) {
    await nitroSmoke();
  }

  console.log('\nAll smoke tests passed');
}

await main();
