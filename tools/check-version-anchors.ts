/** Mechanical gate for documentation version anchors.
 *
 * The published/registry package line in the entry docs must equal
 * PACKAGE_VERSION(_TAG) and the active execution target must equal
 * ACTIVE_EXECUTION_VERSION, both from tools/project-constants.ts. The
 * constants are maintained by the release bump (updateProjectConstants), so
 * any drift here means a doc was edited by hand without a bump — or a bump
 * ran without its anchor updates.
 */

import {
  ACTIVE_EXECUTION_VERSION,
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
} from './project-constants.ts';

export interface VersionAnchor {
  path: string;
  snippet: string;
}

/** Head-of-file anchors kept in sync with each file's real anchor text. */
export function versionAnchors(): VersionAnchor[] {
  return [
    {
      path: 'docs/status/STATUS.md',
      snippet: `Repository package line: \`${PACKAGE_VERSION_TAG}\``,
    },
    {
      path: 'docs/status/STATUS.md',
      snippet: `npm registry line: \`${PACKAGE_VERSION_TAG}\``,
    },
    {
      path: 'docs/status/STATUS.md',
      snippet: `Active release target: \`${ACTIVE_EXECUTION_VERSION}\``,
    },
    {
      path: 'README.md',
      snippet: `Published package line: \`${PACKAGE_VERSION}\` (\`${PACKAGE_VERSION_TAG}\`)`,
    },
    {
      path: 'README.zh.md',
      snippet: `已发布包线为 \`${PACKAGE_VERSION}\`（\`${PACKAGE_VERSION_TAG}\`）`,
    },
    {
      path: 'docs/roadmap/ROADMAP.md',
      snippet: `Published package line: \`${PACKAGE_VERSION_TAG}\`.`,
    },
    {
      path: 'docs/roadmap/ROADMAP.md',
      snippet: `Active execution target: \`${ACTIVE_EXECUTION_VERSION}\`.`,
    },
    {
      path: 'docs/governance/PROJECT_WORKFLOW.md',
      snippet: `package line \`${PACKAGE_VERSION_TAG}\``,
    },
  ];
}

/** Pure core: returns one failure per missing anchor, given a file reader. */
export function findVersionAnchorFailures(read: (path: string) => string): string[] {
  const failures: string[] = [];
  for (const anchor of versionAnchors()) {
    let text: string;
    try {
      text = read(anchor.path);
    } catch (error) {
      failures.push(
        `${anchor.path}: cannot read file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      continue;
    }
    if (!text.includes(anchor.snippet)) {
      failures.push(`${anchor.path}: missing version anchor: ${anchor.snippet}`);
    }
  }
  return failures;
}

async function main(): Promise<void> {
  const texts = new Map<string, string>();
  const failures = findVersionAnchorFailures((path) => {
    const cached = texts.get(path);
    if (cached !== undefined) return cached;
    const text = Deno.readTextFileSync(path);
    texts.set(path, text);
    return text;
  });
  if (failures.length > 0) {
    console.error('Version anchor check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    Deno.exit(1);
  }
  console.log(
    `Version anchor check passed (${versionAnchors().length} anchors, ` +
      `package line ${PACKAGE_VERSION_TAG}, active target ${ACTIVE_EXECUTION_VERSION}).`,
  );
}

if (import.meta.main) await main();
