/**
 * Static-output freeze proof (0.42.0-alpha.5 TP-5.5, issue #560).
 *
 * VERSION_PLAN.md requires the TP-2 byte-identical static-output regression
 * proof to be repeated at every alpha and at 0.42.0; the alpha.1 proof was a
 * one-time manual worktree comparison. This tool makes it repeatable:
 *
 *   1. determinism self-check: build the CURRENT working tree twice and
 *      compare the two output trees byte-for-byte. If the current build is
 *      not self-deterministic (embedded timestamps, unstable hashes), the
 *      freeze proof against a baseline is meaningless, so the tool reports
 *      the differing files and exits non-zero.
 *   2. baseline comparison: create a temp git worktree of the baseline ref
 *      (default v0.41.2), build the same site there, and compare the two
 *      output trees file-by-file (byte comparison).
 *
 * Site: `www` is the designated vehicle (VERSION_PLAN TP-4 amendment: "www
 * deploys to Cloudflare Pages as a pure-static site and doubles as the
 * byte-identical regression vehicle"). There is no smaller pure-static
 * fixture under packages/adapter-vite/__fixtures__/ (request-time and
 * nitro-proof both carry request-time routes).
 *
 * The baseline worktree is prepared by symlinking the current tree's
 * `node_modules/` and `vendor/` into it (both are gitignored); the build at
 * the baseline ref then runs offline. If the baseline build still fails
 * (toolchain drift, missing deps), the failure is reported with the command
 * to reproduce it and the tool exits non-zero — use `--self-check` as the
 * gate form until the baseline builds again.
 *
 * CLI:
 *   --baseline <ref>   baseline git ref (default: v0.41.2)
 *   --self-check       run only the current-tree determinism check
 *
 * Exit codes: 0 = identical, 1 = byte difference or build/environment failure.
 *
 * Normalization: the www build embeds a `builtAt` ISO timestamp in every
 * `island-manifests/*.json` (packages/adapter-vite/src/internal/ssg/
 * island-manifest.ts). That field is build metadata, not site content, so the
 * comparison strips it; everything else — including content-hashed chunk
 * filenames — is compared byte-for-byte. The applied normalization is logged.
 * Any further nondeterminism fails the self-check instead of being silently
 * masked.
 *
 * CI wiring note: tools/autoflow/policy.ts owns gate wiring and is edited by
 * another stream; the wiring point is the root task `check:static-output-freeze`.
 */

import { walk } from '@std/fs/walk';

type Snapshot = Map<string, Uint8Array>;

/** Build-metadata normalizers applied before comparison (see header). */
const NORMALIZERS: Array<{ match: RegExp; description: string; apply: (text: string) => string }> =
  [
    {
      match: /(^|\/)island-manifests\/[^/]*\.json$/,
      description: 'strip builtAt timestamp from island-manifests/*.json',
      apply: (text) => {
        const data = JSON.parse(text) as Record<string, unknown>;
        delete data.builtAt;
        return JSON.stringify(data);
      },
    },
    {
      match: /(^|\/)pagefind\/pagefind-entry\.json$/,
      description: 'canonicalize pagefind-entry.json (index hash + set ordering)',
      apply: (text) => {
        // The hash is a fingerprint of the staged HTML (which is itself
        // compared byte-for-byte), and include_characters comes from a set
        // whose iteration order is not bit-stable across pagefind's parallel
        // indexer runs (#867). Canonicalizing loses no signal: the indexed
        // content is compared in the HTML files themselves.
        const data = JSON.parse(text) as {
          version?: unknown;
          languages?: Record<string, Record<string, unknown>>;
          include_characters?: unknown[];
        };
        for (const lang of Object.values(data.languages ?? {})) {
          delete lang.hash;
        }
        const canonical: Record<string, unknown> = {};
        if (data.version !== undefined) canonical.version = data.version;
        // Language key order follows pagefind's Rust HashMap iteration,
        // which is randomized per process — sort it (this was the actual
        // intermittent freeze-gate failure: same content, different order).
        const languages: Record<string, unknown> = {};
        for (const key of Object.keys(data.languages ?? {}).sort()) {
          languages[key] = data.languages![key];
        }
        canonical.languages = languages;
        if (data.include_characters !== undefined) {
          canonical.include_characters = [...data.include_characters].sort();
        }
        return JSON.stringify(canonical);
      },
    },
  ];

function normalize(relPath: string, bytes: Uint8Array): Uint8Array {
  for (const normalizer of NORMALIZERS) {
    if (normalizer.match.test(relPath)) {
      const text = new TextDecoder().decode(bytes);
      return new TextEncoder().encode(normalizer.apply(text));
    }
  }
  return bytes;
}

const SITE = { dir: 'www', outDir: 'www/dist', buildTask: 'build' } as const;

function parseArgs(): { baseline: string; selfCheck: boolean } {
  const args: Record<string, string> = {};
  const flags = new Set<string>();
  for (let i = 0; i < Deno.args.length; i++) {
    const arg = Deno.args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = Deno.args[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        flags.add(key);
      }
    }
  }
  return {
    baseline: args.baseline ?? 'v0.41.2',
    selfCheck: flags.has('self-check'),
  };
}

async function run(cmd: string[], cwd: string): Promise<{ ok: boolean; output: string }> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout, stderr } = await command.output();
  const output = new TextDecoder().decode(stdout) + new TextDecoder().decode(stderr);
  return { ok: code === 0, output };
}

function tail(output: string, lines = 40): string {
  const all = output.trimEnd().split('\n');
  return all.slice(Math.max(0, all.length - lines)).join('\n');
}

/** Build the site in `root` and snapshot its output tree (path -> bytes). */
async function buildAndSnapshot(root: string, site: { outDir: string; buildTask: string }) {
  const build = await run(['deno', 'task', site.buildTask], root);
  if (!build.ok) {
    return { error: tail(build.output) };
  }
  const snapshot: Snapshot = new Map();
  const outRoot = `${root}/${site.outDir}`;
  for await (const entry of walk(outRoot, { includeDirs: false })) {
    const rel = entry.path.slice(outRoot.length + 1);
    snapshot.set(rel, normalize(rel, await Deno.readFile(entry.path)));
  }
  if (snapshot.size === 0) {
    return { error: `build succeeded but ${site.outDir} is empty in ${root}` };
  }
  return { snapshot };
}

/** Byte-compare two snapshots; returns a list of human-readable diffs. */
function diffSnapshots(a: Snapshot, b: Snapshot, labelA: string, labelB: string): string[] {
  const diffs: string[] = [];
  for (const [path, bytesA] of a) {
    const bytesB = b.get(path);
    if (bytesB === undefined) {
      diffs.push(`only in ${labelA}: ${path}`);
    } else if (bytesA.length !== bytesB.length || !bytesA.every((v, i) => v === bytesB[i])) {
      diffs.push(
        `content differs: ${path} (${labelA}: ${bytesA.length}B, ${labelB}: ${bytesB.length}B)`,
      );
    }
  }
  for (const path of b.keys()) {
    if (!a.has(path)) diffs.push(`only in ${labelB}: ${path}`);
  }
  return diffs;
}

function fail(message: string): never {
  console.error(`static-output-freeze: FAIL — ${message}`);
  Deno.exit(1);
}

const { baseline, selfCheck } = parseArgs();

const root = Deno.cwd();

// Phase 1: determinism self-check — build the current tree twice.
for (const n of NORMALIZERS) console.log(`static-output-freeze: normalizing — ${n.description}`);
console.log('static-output-freeze: building current tree (www) — run 1/2');
const run1 = await buildAndSnapshot(root, SITE);
if (run1.error) fail(`current-tree build (run 1) failed:\n${run1.error}`);
console.log('static-output-freeze: building current tree — run 2/2');
const run2 = await buildAndSnapshot(root, SITE);
if (run2.error) fail(`current-tree build (run 2) failed:\n${run2.error}`);

const selfDiffs = diffSnapshots(run1.snapshot!, run2.snapshot!, 'run 1', 'run 2');
if (selfDiffs.length > 0) {
  console.error(
    `static-output-freeze: the current build is NOT self-deterministic — ${selfDiffs.length} file(s) differ across two runs:`,
  );
  for (const d of selfDiffs.slice(0, 50)) console.error(`  ${d}`);
  fail(
    'freeze proof against a baseline is meaningless until the build is deterministic. ' +
      'Fix the nondeterminism (embedded timestamps, unstable ordering) or add normalization here.',
  );
}
console.log(
  `static-output-freeze: determinism OK (${run1.snapshot!.size} files byte-identical across runs)`,
);

if (selfCheck) {
  console.log('static-output-freeze: PASS (self-check only)');
  Deno.exit(0);
}

// Phase 2: baseline worktree build + comparison.
const tmp = await Deno.makeTempDir({ prefix: 'static-output-freeze-' });
const worktreeDir = `${tmp}/baseline`;
try {
  const add = await run(['git', 'worktree', 'add', '--detach', worktreeDir, baseline], root);
  if (!add.ok) {
    fail(
      `could not create worktree of '${baseline}':\n${tail(add.output)}\n` +
        `Reproduce: git worktree add --detach <dir> ${baseline}`,
    );
  }

  // node_modules/ is gitignored: symlink it from the current tree so the
  // baseline build resolves npm dependencies offline. vendor/ is partially
  // tracked (license attribution), so it already exists in the worktree —
  // merge-copy the current tree's vendored sources over it instead.
  try {
    await Deno.symlink(`${root}/node_modules`, `${worktreeDir}/node_modules`);
  } catch (err) {
    fail(
      `could not symlink node_modules into the baseline worktree: ${err}\n` +
        `Manual fallback: cd <worktree of ${baseline}> && deno install (needs network).`,
    );
  }
  const vendorCopy = await run(['cp', '-R', `${root}/vendor/`, `${worktreeDir}/vendor/`], root);
  if (!vendorCopy.ok) {
    fail(`could not copy vendor/ into the baseline worktree:\n${tail(vendorCopy.output)}`);
  }

  console.log(`static-output-freeze: building baseline ${baseline} in ${worktreeDir}`);
  const base = await buildAndSnapshot(worktreeDir, SITE);
  if (base.error) {
    fail(
      `baseline build failed at '${baseline}' (environmental — old toolchain or missing deps):\n${base.error}\n` +
        `Reproduce: cd <worktree of ${baseline}> && deno task build. ` +
        `Until this is fixed, gate on: deno task check:static-output-freeze -- --self-check`,
    );
  }

  const diffs = diffSnapshots(base.snapshot!, run2.snapshot!, baseline, 'current');
  if (diffs.length > 0) {
    console.error(
      `static-output-freeze: ${diffs.length} file(s) differ between ${baseline} and the current tree:`,
    );
    for (const d of diffs.slice(0, 50)) console.error(`  ${d}`);
    if (diffs.length > 50) console.error(`  ... and ${diffs.length - 50} more`);
    fail(`static output is not byte-identical to ${baseline}`);
  }
  console.log(
    `static-output-freeze: PASS — ${
      base.snapshot!.size
    } files byte-identical between ${baseline} and current tree`,
  );
} finally {
  // Best-effort cleanup; report but do not mask the result.
  const remove = await run(['git', 'worktree', 'remove', '--force', worktreeDir], root);
  if (!remove.ok) {
    console.error(
      `static-output-freeze: warning — worktree cleanup failed: ${tail(remove.output, 5)}`,
    );
  }
  await Deno.remove(tmp, { recursive: true }).catch(() => {});
}
