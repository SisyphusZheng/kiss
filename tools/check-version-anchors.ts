/** Mechanical gate for documentation version anchors.
 *
 * The source package line in the entry docs must equal PACKAGE_VERSION(_TAG)
 * and the active execution target must equal ACTIVE_EXECUTION_VERSION, both
 * from tools/project-constants.ts. Published/registry claims use the STATUS
 * dual-line form: a source line anchor plus an npm registry line anchor that
 * may name PACKAGE_VERSION_TAG or, during the post-bump lag,
 * PREVIOUS_PACKAGE_VERSION_TAG (the registry publishes at release time, not
 * at bump time). The constants are maintained by the release bump
 * (updateProjectConstants), so any drift here means a doc was edited by hand
 * without a bump — or a bump ran without its anchor updates.
 *
 * The gate has two directions:
 * 1. findVersionAnchorFailures asserts the current anchors are present.
 * 2. findStaleAnchorFailures asserts the head anchor zone of each governed
 *    doc does NOT name a superseded package line (PREVIOUS_PACKAGE_VERSION
 *    and the enumerable pre-release history before it). A bump that forgets
 *    a head anchor leaves the zone stale and fails here, instead of shipping
 *    a red main CI after the release.
 */

import {
  ACTIVE_EXECUTION_VERSION,
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION_TAG,
  stalePackageVersionClaims,
} from './project-constants.ts';
import { escapeRegExp } from './lib/text.ts';

export interface VersionAnchor {
  path: string;
  snippet: string;
  /**
   * Alternative accepted values for this anchor (e.g. the npm registry line
   * may legitimately name PREVIOUS_PACKAGE_VERSION_TAG while the source line
   * has already bumped — the registry publishes at release time, not at bump
   * time). When alternatives are present, findStaleAnchorFailures exempts
   * the named value from the stale-claim check: it is a factual statement
   * about the registry, not a stale claim about the source line.
   */
  alternatives?: string[];
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
      // The registry publishes at release time, one alpha after the source bump.
      alternatives: [`npm registry line: \`${PREVIOUS_PACKAGE_VERSION_TAG}\``],
    },
    {
      path: 'docs/status/STATUS.md',
      snippet: `Active release target: \`${ACTIVE_EXECUTION_VERSION}\``,
    },
    {
      path: 'README.md',
      snippet: `Source package line: \`${PACKAGE_VERSION}\` (\`${PACKAGE_VERSION_TAG}\`)`,
    },
    {
      path: 'README.md',
      snippet: `npm registry line: \`${PACKAGE_VERSION_TAG}\``,
      // The registry publishes at release time, one alpha after the source bump.
      alternatives: [`npm registry line: \`${PREVIOUS_PACKAGE_VERSION_TAG}\``],
    },
    {
      path: 'README.zh.md',
      snippet: `已发布包线为 \`${PACKAGE_VERSION}\`（\`${PACKAGE_VERSION_TAG}\`）`,
    },
    {
      path: 'docs/roadmap/ROADMAP.md',
      snippet: `Source package line: \`${PACKAGE_VERSION_TAG}\`.`,
    },
    {
      path: 'docs/roadmap/ROADMAP.md',
      snippet: `npm registry line: \`${PACKAGE_VERSION_TAG}\``,
      // The registry publishes at release time, one alpha after the source bump.
      alternatives: [`npm registry line: \`${PREVIOUS_PACKAGE_VERSION_TAG}\``],
    },
    {
      path: 'docs/roadmap/ROADMAP.md',
      snippet: `Active execution target: \`${ACTIVE_EXECUTION_VERSION}\`.`,
    },
    {
      path: 'docs/governance/PROJECT_WORKFLOW.md',
      snippet: `package line \`${PACKAGE_VERSION_TAG}\``,
    },
    {
      path: 'docs/governance/PROJECT_WORKFLOW.md',
      snippet: `npm registry line \`${PACKAGE_VERSION_TAG}\``,
      // The registry publishes at release time, one alpha after the source bump.
      alternatives: [`npm registry line \`${PREVIOUS_PACKAGE_VERSION_TAG}\``],
    },
    {
      path: 'docs/current/VERSION_PLAN.md',
      snippet: `Current source package line: \`${PACKAGE_VERSION_TAG}\``,
    },
    {
      path: 'docs/current/VERSION_PLAN.md',
      snippet: `Current npm registry line: \`${PACKAGE_VERSION_TAG}\``,
      // The registry publishes at release time, one alpha after the source bump.
      alternatives: [`Current npm registry line: \`${PREVIOUS_PACKAGE_VERSION_TAG}\``],
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
    const accepted = [anchor.snippet, ...(anchor.alternatives ?? [])];
    if (!accepted.some((snippet) => text.includes(snippet))) {
      failures.push(
        `${anchor.path}: missing version anchor: ${anchor.snippet}` +
          (anchor.alternatives?.length ? ` (or its lagged form)` : ''),
      );
    }
  }
  return failures;
}

/**
 * Stale claims as a single regex alternation, longest first so the tag form
 * wins over the raw form at the same position. Callers must add numeric
 * boundaries when embedding it: `0.41.0-alpha.1` is a prefix of
 * `0.41.0-alpha.17`, so an unguarded stale short tag would match inside a
 * newer longer one.
 */
export function staleClaimsAlternation(): string {
  return stalePackageVersionClaims()
    .map((claim) => escapeRegExp(claim))
    .sort((a, b) => b.length - a.length)
    .join('|');
}

/**
 * Head anchor zone of a governed doc: from the start of the file through the
 * end of its LAST head anchor. Everything in that span is the document's
 * declaration zone and must never name a superseded package line; everything
 * after it — release notes, roadmap history tables, forward-version tables,
 * CHANGELOG entries — is historical and may. Anchors that are missing
 * entirely are reported by findVersionAnchorFailures and simply do not extend
 * the zone here.
 */
export function headAnchorZone(text: string, snippets: string[]): string {
  let end = 0;
  for (const snippet of snippets) {
    const index = text.indexOf(snippet);
    if (index !== -1) end = Math.max(end, index + snippet.length);
  }
  return text.slice(0, end);
}

/** Pure core: one failure per stale version claim found in a head anchor zone. */
export function findStaleAnchorFailures(read: (path: string) => string): string[] {
  const pattern = new RegExp(`(?<![\\d.])(?:${staleClaimsAlternation()})(?![\\d.])`, 'gu');
  const byPath = new Map<string, string[]>();
  for (const anchor of versionAnchors()) {
    const snippets = byPath.get(anchor.path) ?? [];
    snippets.push(anchor.snippet);
    byPath.set(anchor.path, snippets);
  }
  const failures: string[] = [];
  for (const [path, snippets] of byPath) {
    let text: string;
    try {
      text = read(path);
    } catch {
      // Unreadable files are reported by findVersionAnchorFailures.
      continue;
    }
    const zone = headAnchorZone(text, snippets);
    // Exempt accepted registry-lag anchors: the version they name is a
    // factual statement about the published line, not a stale source claim.
    const exempted = new Set<string>();
    for (const anchor of versionAnchors()) {
      if (anchor.path !== path) continue;
      for (const accepted of [anchor.snippet, ...(anchor.alternatives ?? [])]) {
        const index = zone.indexOf(accepted);
        if (index === -1) continue;
        for (const claim of accepted.matchAll(pattern)) exempted.add(claim[0]);
      }
    }
    const stale = new Set<string>();
    for (const match of zone.matchAll(pattern)) {
      if (!exempted.has(match[0])) stale.add(match[0]);
    }
    for (const claim of [...stale].sort()) {
      failures.push(`${path}: stale version claim in head anchor zone: ${claim}`);
    }
  }
  return failures;
}

function main(): void {
  const texts = new Map<string, string>();
  const read = (path: string): string => {
    const cached = texts.get(path);
    if (cached !== undefined) return cached;
    const text = Deno.readTextFileSync(path);
    texts.set(path, text);
    return text;
  };
  const failures = [...findVersionAnchorFailures(read), ...findStaleAnchorFailures(read)];
  if (failures.length > 0) {
    console.error('Version anchor check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    Deno.exit(1);
  }
  console.log(
    `Version anchor check passed (${versionAnchors().length} anchors, ` +
      `${stalePackageVersionClaims().length} stale claims rejected, ` +
      `package line ${PACKAGE_VERSION_TAG}, active target ${ACTIVE_EXECUTION_VERSION}).`,
  );
}

if (import.meta.main) main();
