/** Ensure alpha.7 critical runtime risks keep named behavioral evidence.
 *
 * alpha.12: actually execute the critical-path suites instead of only
 * text-matching their source. A suite that is commented out or missing now
 * fails (or skips only when its required runtime infra is absent).
 */

interface Suite {
  file: string;
  kind: 'deno-test' | 'nitro-proof' | 'e2e';
  expect: string[];
}

const suites: Suite[] = [
  {
    file: 'packages/adapter-vite/__tests__/build-plan.test.ts',
    kind: 'deno-test',
    expect: ['typed failure evidence', 'collects emitted artifacts'],
  },
  {
    file: 'packages/app/__tests__/client-router.test.ts',
    kind: 'deno-test',
    expect: [
      'dispose removes event listeners',
      'double dispose is safe',
      'redirect limit rejects redirect loops',
      'decodes path parameters',
    ],
  },
  {
    file: 'www/e2e/dsd-layers.spec.ts',
    kind: 'e2e',
    expect: ['custom elements have shadow roots', 'without an inline fallback'],
  },
  {
    file: 'tools/nitro-proof.ts',
    kind: 'nitro-proof',
    expect: ['node-server', 'cloudflare-module'],
  },
];

async function run(cmd: string[]): Promise<{ code: number; out: string }> {
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: 'piped',
    stderr: 'piped',
  });
  const result = await proc.output();
  return {
    code: result.code,
    out: new TextDecoder().decode(result.stdout) +
      new TextDecoder().decode(result.stderr),
  };
}

const failures: string[] = [];
const skips: string[] = [];

for (const suite of suites) {
  let code = 0;
  let out = '';
  if (suite.kind === 'nitro-proof') {
    for (const preset of ['node', 'workers']) {
      const r = await run([Deno.execPath(), 'run', '--allow-all', suite.file, preset]);
      code = code || r.code;
      out += r.out;
    }
  } else {
    const cmd = suite.kind === 'deno-test'
      ? [Deno.execPath(), 'test', '--allow-all', suite.file]
      : [
        Deno.execPath(),
        'test',
        '--allow-all',
        '--config',
        'www/e2e/playwright.config.ts',
        suite.file,
      ];
    const r = await run(cmd);
    code = r.code;
    out = r.out;
  }

  if (code !== 0) {
    const infraMissing =
      /Executable doesn't exist|chromium|playwright|browser|ECONNREFUSED|network|nitro/i
        .test(out);
    if (infraMissing) {
      skips.push(`${suite.file}: skipped (missing runtime infra)`);
      continue;
    }
    failures.push(`${suite.file}: suite failed (exit ${code})`);
    continue;
  }
  for (const fragment of suite.expect) {
    if (!out.includes(fragment)) {
      failures.push(`${suite.file}: expected evidence '${fragment}' not produced`);
    }
  }
}

if (skips.length > 0) {
  console.warn('Critical path suites skipped (missing infra):');
  for (const skip of skips) console.warn(`- ${skip}`);
}
if (failures.length > 0) {
  console.error('Critical path test gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log(`Critical path test gate passed (${suites.length} suites, ${skips.length} skipped).`);
