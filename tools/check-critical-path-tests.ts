/** Ensure alpha.7 critical runtime risks keep named behavioral evidence. */

const evidence: Array<[string, string[]]> = [
  ['packages/adapter-vite/__tests__/build-plan.test.ts', [
    'typed failure evidence',
    'collects emitted artifacts',
  ]],
  ['packages/app/__tests__/client-router.test.ts', [
    'dispose removes event listeners',
    'double dispose is safe',
    'redirect limit rejects redirect loops',
    'decodes path parameters',
  ]],
  ['www/e2e/dsd-layers.spec.ts', [
    'custom elements have shadow roots',
    'without an inline fallback',
  ]],
  ['tools/nitro-proof.ts', ['node-server', 'cloudflare-module']],
];

const failures: string[] = [];
for (const [file, fragments] of evidence) {
  let source: string;
  try {
    source = await Deno.readTextFile(file);
  } catch (error) {
    failures.push(`${file}: missing critical evidence suite (${String(error)})`);
    continue;
  }
  for (const fragment of fragments) {
    if (!source.includes(fragment)) {
      failures.push(`${file}: missing critical evidence '${fragment}'`);
    }
  }
}

if (failures.length > 0) {
  console.error('Critical path test gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log(`Critical path test gate passed (${evidence.length} evidence suites).`);
