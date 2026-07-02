import { ACTIVE_EXECUTION_VERSION, PACKAGE_VERSION_TAG } from './project-constants.ts';

type Failure = {
  file: string;
  message: string;
};

const currentPublicDocs = [
  'README.md',
  'README.zh.md',
  'docs/governance/PROJECT_WORKFLOW.md',
  'docs/current/VERSION_PLAN.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
];

const readmeDocs = ['README.md', 'README.zh.md'];
const productDoctrinePatterns = [
  'openElement = Web Components Fullstack Framework + Basic Element',
  'supporting packages = Protocols + UI + official stack adapters',
];

const mojibakePatterns: RegExp[] = [
  /\uFFFD/,
  new RegExp('\\u7BA0'),
  new RegExp('\\u9286'),
  new RegExp('\\u9225'),
  new RegExp('\\u9422'),
  new RegExp('\\u8930'),
  /\?\?\?/,
];

const staleCurrentClaims: RegExp[] = [
  /v0\.37\.6 package\s+line current/i,
  /active execution target is\s+v0\.38\.0/i,
  /v0\.37\.6 is the current workspace package line/i,
  /All 20 workspace packages are currently aligned together at\s+\*\*v0\.37\.6\*\*/i,
  /活动执行目标是\s+v0\.38\.0/i,
  /JSR publish .*best-effort/i,
  /JSR publish .*telemetry/i,
  /dual npm\/JSR publishing/i,
  /to JSR as a secondary channel/i,
  /not (?:a )?(?:version-)?exit gate/i,
  /do not block version\s+exit/i,
  /distribution telemetry/i,
  /Vue adapter proof/i,
  /Vue is .*heavy-framework island/i,
  /Vue 是.*heavy-framework island/i,
];

const failures: Failure[] = [];

async function read(file: string): Promise<string> {
  try {
    return await Deno.readTextFile(file);
  } catch (error) {
    failures.push({
      file,
      message: `cannot read file: ${error instanceof Error ? error.message : String(error)}`,
    });
    return '';
  }
}

for (const file of currentPublicDocs) {
  const text = await read(file);
  if (!text) continue;

  if (!text.includes(PACKAGE_VERSION_TAG)) {
    failures.push({ file, message: `missing package version tag ${PACKAGE_VERSION_TAG}` });
  }

  if (!text.includes(ACTIVE_EXECUTION_VERSION)) {
    failures.push({
      file,
      message: `missing active execution version ${ACTIVE_EXECUTION_VERSION}`,
    });
  }

  for (const pattern of staleCurrentClaims) {
    const match = text.match(pattern);
    if (match) {
      failures.push({ file, message: `stale current-line claim: ${match[0]}` });
    }
  }
}

for (const file of readmeDocs) {
  const text = await read(file);
  if (!text) continue;

  for (const doctrine of productDoctrinePatterns) {
    if (!text.includes(doctrine)) {
      failures.push({ file, message: `missing two-product doctrine formula: ${doctrine}` });
    }
  }

  for (const pattern of mojibakePatterns) {
    const match = text.match(pattern);
    if (match) {
      failures.push({ file, message: `mojibake/replacement text matched: ${match[0]}` });
    }
  }
}

if (failures.length > 0) {
  console.error('Public docs integrity check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`);
  }
  Deno.exit(1);
}

console.log(
  `Public docs integrity check passed (${currentPublicDocs.length} docs, package ${PACKAGE_VERSION_TAG}, active ${ACTIVE_EXECUTION_VERSION}).`,
);
