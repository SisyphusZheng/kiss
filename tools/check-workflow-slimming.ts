import { exists } from './lib/fs.ts';

const failures: string[] = [];
const MAX_WORKFLOWS = 8;

for (
  const removed of [
    '.github/workflows/fast-gate.yml',
    '.github/workflows/sop-gate.yml',
    '.github/workflows/lint.yml',
    '.github/workflows/test.yml',
    '.github/workflows/hub-ci.yml',
    '.github/workflows/publish-manual.yml',
    '.github/workflows/deploy-api.yml',
    '.github/workflows/publish-jsr.yml',
  ]
) {
  if (await exists(removed)) failures.push(`${removed} should not be an active workflow.`);
}

const workflowCount = Array.from(Deno.readDirSync('.github/workflows'))
  .filter((entry) => entry.isFile && /\.ya?ml$/.test(entry.name)).length;
if (workflowCount > MAX_WORKFLOWS) {
  failures.push(`Expected at most ${MAX_WORKFLOWS} active workflows, found ${workflowCount}.`);
}

const autoflowCi = await Deno.readTextFile('.github/workflows/autoflow-ci.yml');
if (!autoflowCi.includes('deno task autoflow:ci')) {
  failures.push('autoflow-ci.yml must call deno task autoflow:ci.');
}

const denoJson = await Deno.readTextFile('deno.json');
for (const task of ['hub:scan', 'hub:index:update']) {
  if (denoJson.includes(`"${task}"`)) {
    failures.push(`${task} must not be an active task after Hub removal.`);
  }
}

if (failures.length > 0) {
  console.error('Workflow slimming check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log('Workflow slimming check passed.');
