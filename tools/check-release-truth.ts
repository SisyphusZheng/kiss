import {
  ACTIVE_EXECUTION_VERSION,
  LATEST_LANDED_TRAIN,
  NEXT_EXECUTION_VERSION,
  PACKAGE_VERSION,
} from './project-constants.ts';

export interface ReleaseState {
  schemaVersion: number;
  sourceVersion: string;
  publishedVersion: string;
  latestLandedTrain: string;
  activeTarget: string;
  nextPlannedTrain: string;
  maturity: 'alpha' | 'beta' | 'stable';
}

export function findReleaseTruthFailures(
  state: ReleaseState,
  read: (path: string) => string,
): string[] {
  const failures: string[] = [];
  const expected = {
    schemaVersion: 1,
    sourceVersion: PACKAGE_VERSION,
    publishedVersion: PACKAGE_VERSION,
    latestLandedTrain: LATEST_LANDED_TRAIN,
    activeTarget: ACTIVE_EXECUTION_VERSION,
    nextPlannedTrain: NEXT_EXECUTION_VERSION,
    maturity: 'stable',
  } as const;
  for (const [key, value] of Object.entries(expected)) {
    if (state[key as keyof ReleaseState] !== value) {
      failures.push(`release state ${key} != ${value}`);
    }
  }
  const anchors: Array<[string, string]> = [
    ['README.md', `Source package line: \`${state.sourceVersion}\``],
    ['README.md', `npm registry line: \`v${state.publishedVersion}\``],
    ['README.md', `published as stable \`${state.publishedVersion}\``],
    ['README.zh.md', `源码包行为 \`${state.sourceVersion}\``],
    ['README.zh.md', `npm registry 行为 \`v${state.publishedVersion}\``],
    ['README.zh.md', `stable \`${state.publishedVersion}\` 发布`],
    ['docs/status/STATUS.md', `Active release target: \`${state.activeTarget}\``],
    ['docs/status/STATUS.md', `stable at\n\`${state.publishedVersion}\``],
    ['docs/roadmap/ROADMAP.md', `Active execution target: \`${state.activeTarget}\``],
    [
      'docs/roadmap/ROADMAP.md',
      `\`${state.publishedVersion}\` is both the current source package line`,
    ],
    ['docs/current/VERSION_PLAN.md', `Active release target: \`${state.activeTarget}\``],
    ['examples/supabase-cloudflare-starter/deno.json', `"version": "${state.sourceVersion}"`],
  ];
  for (const [path, anchor] of anchors) {
    let text: string;
    try {
      text = read(path);
    } catch {
      failures.push(`${path}: missing release-truth scan target`);
      continue;
    }
    if (!text.includes(anchor)) failures.push(`${path}: missing release anchor ${anchor}`);
  }
  let roadmap = '';
  try {
    roadmap = read('docs/roadmap/ROADMAP.md');
  } catch {
    return failures;
  }
  const row = roadmap.split('\n').find((line) => line.includes('| `0.43.0`')) ?? '';
  for (const deferred of ['streaming SSR', 'validateAction', 'cross-runtime start CLI']) {
    if (row.includes(deferred)) {
      failures.push(`0.43 shipped row contains deferred capability: ${deferred}`);
    }
  }
  return failures;
}

if (import.meta.main) {
  const state = JSON.parse(
    await Deno.readTextFile('docs/release/release-state.json'),
  ) as ReleaseState;
  const failures = findReleaseTruthFailures(state, Deno.readTextFileSync);
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('Release truth check passed.');
}
