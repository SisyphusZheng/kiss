/**
 * Version-anchor bumping for the release flow: the mechanical rewrite of
 * project-constants and every documented version anchor when the package line
 * advances. Kept apart from release.ts so the plan builder can call into the
 * bump steps without an import cycle; `releaseTag` lives here as the neutral
 * shared primitive.
 */

import {
  ACTIVE_EXECUTION_VERSION,
  LATEST_LANDED_TRAIN,
  NEXT_EXECUTION_VERSION,
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
  PREVIOUS_PACKAGE_VERSION_TAG,
} from '../project-constants.ts';

export function releaseTag(version: string): string {
  return `v${version}`;
}

export interface PublishedReleaseState {
  schemaVersion: number;
  sourceVersion: string;
  publishedVersion: string;
  latestLandedTrain: string;
  activeTarget: string;
  nextPlannedTrain: string;
  maturity: 'alpha' | 'beta' | 'stable';
}

/**
 * Advance the durable source/registry truth only after publication completes.
 * Prepare intentionally leaves publishedVersion on the prior line; finalize is
 * the first point where npm, the immutable tag and the GitHub release are all
 * proven, so it owns this transition.
 */
export function advancePublishedReleaseStateText(text: string, version: string): string {
  const state = JSON.parse(text) as PublishedReleaseState;
  const prerelease = version.match(/-(alpha|beta)(?:\.|$)/u)?.[1];
  return `${
    JSON.stringify(
      {
        ...state,
        schemaVersion: 1,
        sourceVersion: version,
        publishedVersion: version,
        latestLandedTrain: releaseTag(version),
        activeTarget: releaseTag(version),
        maturity: prerelease === 'alpha' || prerelease === 'beta' ? prerelease : 'stable',
      } satisfies PublishedReleaseState,
      null,
      2,
    )
  }\n`;
}

export async function updatePublishedReleaseState(version: string): Promise<void> {
  const path = 'docs/release/release-state.json';
  const text = await Deno.readTextFile(path);
  await Deno.writeTextFile(path, advancePublishedReleaseStateText(text, version));
}

export function nextPrereleaseTag(version: string): string {
  const match = version.match(/^(\d+\.\d+\.\d+)-([a-zA-Z]+)\.(\d+)$/u);
  if (!match) return releaseTag(version);
  const [, base, name, number] = match;
  return `v${base}-${name}.${Number(number) + 1}`;
}

/**
 * Apply a version bump to the project-constants source text. Returns
 * `undefined` when the file is already at the target (idempotent re-run:
 * PREVIOUS_PACKAGE_VERSION must keep recording the true previous line).
 *
 * ACTIVE_EXECUTION_VERSION is maintained mechanically: the active execution
 * target is the version the active plan is delivering, so after bumping the
 * package line to X it equals X. It only advances past X when a new version
 * plan is written, which is a deliberate human act — setting it to the patch
 * successor here left every post-bump document anchor failing the gates.
 */
export function bumpProjectConstantsText(text: string, version: string): string | undefined {
  const m = text.match(/PACKAGE_VERSION = '([^']+)'/u);
  const current = m ? m[1] : version;
  if (current === version) return undefined;
  let updated = text.replace(/PACKAGE_VERSION = '[^']+'/u, `PACKAGE_VERSION = '${version}'`);
  // Preserve the previous line for historical diagnostics. Anchor replacement
  // uses the module-loaded PACKAGE_VERSION so it always matches the source.
  updated = updated.replace(
    /PREVIOUS_PACKAGE_VERSION = '[^']+'/u,
    `PREVIOUS_PACKAGE_VERSION = '${current}'`,
  );
  updated = updated.replace(
    /ACTIVE_EXECUTION_VERSION = '[^']+'/u,
    `ACTIVE_EXECUTION_VERSION = '${releaseTag(version)}'`,
  );
  updated = updated.replace(
    /LATEST_LANDED_TRAIN = '[^']+'/u,
    `LATEST_LANDED_TRAIN = '${releaseTag(version)}'`,
  );
  const next = nextPrereleaseTag(version);
  if (next !== releaseTag(version)) {
    updated = updated.replace(
      /NEXT_EXECUTION_VERSION = '[^']+'/u,
      `NEXT_EXECUTION_VERSION = '${next}'`,
    );
  }
  return updated;
}

export async function updateProjectConstants(version: string): Promise<void> {
  const path = 'tools/project-constants.ts';
  const text = await Deno.readTextFile(path);
  const updated = bumpProjectConstantsText(text, version);
  if (updated === undefined) {
    // Already at target version; keep reruns idempotent but make the no-op visible.
    // release can be re-run or dispatched after the bump is already merged.
    console.warn(`[release] ${path}: version anchor already equals ${version}; no change made.`);
    return;
  }
  await Deno.writeTextFile(path, updated);
}

/**
 * Extract the theme of the www roadmap timeline entry for a version tag.
 * The entry keeps `version` and `theme` on adjacent lines; anything else
 * means the file shape changed and the release line-prose gate needs an
 * update too, so no match is a loud undefined for the bump side to warn on.
 */
export function roadmapEntryTheme(text: string, versionTag: string): string | undefined {
  const escaped = versionTag.replaceAll('.', '\\.');
  return text.match(new RegExp(`version:\\s*'${escaped}',\\s*theme:\\s*'([^']+)'`, 'u'))?.[1];
}

/**
 * The theme a roadmap version-anchor bump supersedes, if any. Only a real
 * version change (from tag ≠ to tag) supersedes a theme: an idempotent
 * re-run after the bump finds from === to, and re-recording the
 * already-written new theme would make the line-prose gate reject correct
 * prose (the 0.42.0-alpha.1 resume loop).
 */
export function supersededThemeForBump(
  text: string,
  from: string,
  to: string,
): string | undefined {
  const oldTag = from.match(/version: '([^']+)'/u)?.[1];
  const newTag = to.match(/version: '([^']+)'/u)?.[1];
  if (!oldTag || oldTag === newTag) return undefined;
  return roadmapEntryTheme(text, oldTag);
}

/**
 * Record the superseded current-line theme into the project-constants
 * source text. Returns `undefined` when already recorded (idempotent).
 */
export function bumpPreviousReleaseThemeText(text: string, theme: string): string | undefined {
  // deno fmt wraps the long single-line form, leaving a newline between `=`
  // and the quote; accept both so a wrapped anchor does not abort the release.
  const m = text.match(/PREVIOUS_RELEASE_THEME =\s*'([^']+)'/u);
  if (!m) throw new Error('tools/project-constants.ts: PREVIOUS_RELEASE_THEME anchor missing.');
  if (m[1] === theme) return undefined;
  return text.replace(
    /PREVIOUS_RELEASE_THEME =\s*'[^']+'/u,
    `PREVIOUS_RELEASE_THEME = '${theme}'`,
  );
}

export function buildVersionAnchorReplacements(
  version: string,
): Array<[string, string, string]> {
  const tag = releaseTag(version);
  // The module is loaded before updateProjectConstants() writes the target.
  // PACKAGE_VERSION is therefore the actual source line being replaced.
  const pv = PACKAGE_VERSION;
  const pvTag = PACKAGE_VERSION_TAG;
  // Placeholders keep these entries as plain single-quoted strings (the
  // previous line is a single source of truth via PREVIOUS_*). Resolved below.
  // Entries are kept in sync with the real anchor text in each target file.
  // README.md wraps `**<pv>** (<pvTag>)` across a line break, so that anchor
  // carries an embedded newline. Anchors that no longer exist in a file (e.g.
  // the legacy "removed the legacy" line) are intentionally omitted so the
  // bump never throws on documentation drift. Currency claims that are not
  // head anchors (README/Roadmap "published as" lines, the workflow
  // implementation anchor) are listed here too: the bump must maintain every
  // line the version-anchor and strategic-docs gates enforce, or the gates
  // fail on the release's own post-bump gate run.
  const raw: Array<[string, string, string]> = [
    ['README.md', '`$PV` (`$PVT`', '`$VER` (`$TAG`'],
    [
      'README.md',
      'convergence is published as `$PV`',
      'convergence is published as `$VER`',
    ],
    // Registry-line anchors (#754): the registry line may name the current
    // source tag ($PVT) or, during the post-bump lag, the previous tag
    // ($PREV_PVT) — check-version-anchors accepts both. Cover both from-forms
    // so the bump advances the registry line mechanically in either state;
    // updateCurrentVersionAnchors skips the from-form that is absent.
    [
      'README.md',
      'npm registry line: `$PVT`',
      'npm registry line: `$TAG`',
    ],
    [
      'README.md',
      'npm registry line: `$PREV_PVT`',
      'npm registry line: `$TAG`',
    ],
    [
      'README.zh.md',
      '源码包行为 `$PV`（`$PVT`）',
      '源码包行为 `$VER`（`$TAG`）',
    ],
    [
      'README.zh.md',
      'npm registry 行为 `$PVT`',
      'npm registry 行为 `$TAG`',
    ],
    [
      'README.zh.md',
      'npm registry 行为 `$PREV_PVT`',
      'npm registry 行为 `$TAG`',
    ],
    [
      'README.zh.md',
      '五包收敛已作为 `$PV` 发布',
      '五包收敛已作为 `$VER` 发布',
    ],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'package line `$PVT`',
      'package line `$TAG`',
    ],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'npm registry line `$PVT`',
      'npm registry line `$TAG`',
    ],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'npm registry line `$PREV_PVT`',
      'npm registry line `$TAG`',
    ],
    [
      'docs/governance/PROJECT_WORKFLOW.md',
      'implementation anchor `$PVT`',
      'implementation anchor `$TAG`',
    ],
    [
      'docs/current/VERSION_PLAN.md',
      'Current source package line: `$PVT`',
      'Current source package line: `$TAG`',
    ],
    [
      'docs/current/VERSION_PLAN.md',
      'Current npm registry line: `$PVT`',
      'Current npm registry line: `$TAG`',
    ],
    [
      'docs/current/VERSION_PLAN.md',
      'Current npm registry line: `$PREV_PVT`',
      'Current npm registry line: `$TAG`',
    ],
    [
      'docs/current/VERSION_PLAN.md',
      'Latest landed train: `$LATEST`',
      'Latest landed train: `$TAG`',
    ],
    [
      'docs/current/VERSION_PLAN.md',
      'Next planned train: `$NEXT_CURRENT`',
      'Next planned train: `$NEXT_TARGET`',
    ],
    // Interop example version anchor (check-version-anchors governs it with
    // the registry-style lag allowance): cover both the source-line form and
    // the lagging npm-published form so the bump advances it mechanically.
    [
      'examples/open-element-in-fresh/README.md',
      'current framework source line (`$PV`)',
      'current framework source line (`$VER`)',
    ],
    [
      'examples/open-element-in-fresh/README.md',
      'current framework source line (`$PREV_PV`)',
      'current framework source line (`$VER`)',
    ],
    [
      'www/app/data/version.ts',
      "export const OPENELEMENT_VERSION = '$PVT';",
      "export const OPENELEMENT_VERSION = '$TAG';",
    ],
    [
      'www/app/data/version.ts',
      "export const PUBLISHED_PACKAGE_VERSION = '$PVT';",
      "export const PUBLISHED_PACKAGE_VERSION = '$TAG';",
    ],
    [
      'www/app/data/version.ts',
      "export const PUBLISHED_PACKAGE_VERSION = '$PREV_PVT';",
      "export const PUBLISHED_PACKAGE_VERSION = '$TAG';",
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'Source package line: `$PVT`',
      'Source package line: `$TAG`',
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'npm registry line: `$PVT`',
      'npm registry line: `$TAG`',
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'npm registry line: `$PREV_PVT`',
      'npm registry line: `$TAG`',
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'Latest landed train: `$LATEST`.',
      'Latest landed train: `$TAG`.',
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'Next planned train: `$NEXT_CURRENT`.',
      'Next planned train: `$NEXT_TARGET`.',
    ],
    [
      'docs/roadmap/ROADMAP.md',
      '`$PV` is the published package line',
      '`$VER` is the published package line',
    ],
    [
      'docs/status/STATUS.md',
      'Repository package line: `$PVT`',
      'Repository package line: `$TAG`',
    ],
    [
      'docs/status/STATUS.md',
      'npm registry line: `$PVT`',
      'npm registry line: `$TAG`',
    ],
    [
      'docs/status/STATUS.md',
      'npm registry line: `$PREV_PVT`',
      'npm registry line: `$TAG`',
    ],
    [
      'docs/status/STATUS.md',
      'Latest landed train: `$LATEST`',
      'Latest landed train: `$TAG`',
    ],
    [
      'docs/status/STATUS.md',
      'Next planned train: `$NEXT_CURRENT`',
      'Next planned train: `$NEXT_TARGET`',
    ],
    [
      'docs/status/STATUS.md',
      'Active release target: `$ACTIVE`',
      'Active release target: `$TAG`',
    ],
    [
      'docs/current/VERSION_PLAN.md',
      'Active release target: `$ACTIVE`',
      'Active release target: `$TAG`',
    ],
    [
      'docs/roadmap/ROADMAP.md',
      'Active execution target: `$ACTIVE`.',
      'Active execution target: `$TAG`.',
    ],
    [
      'www/app/routes/roadmap.tsx',
      "version: '$PVT'",
      "version: '$TAG'",
    ],
    [
      'www/app/routes/roadmap.tsx',
      "phase.version === '$PVT'",
      "phase.version === '$TAG'",
    ],
  ];
  // A stable release advances both the generic registry line and the stable
  // dist-tag line. Prereleases must leave the stable line untouched.
  if (!version.includes('-')) {
    raw.push(
      [
        'www/app/data/version.ts',
        "export const PUBLISHED_STABLE_VERSION = '$PVT';",
        "export const PUBLISHED_STABLE_VERSION = '$TAG';",
      ],
      [
        'www/app/data/version.ts',
        "export const PUBLISHED_STABLE_VERSION = '$PREV_PVT';",
        "export const PUBLISHED_STABLE_VERSION = '$TAG';",
      ],
    );
  }
  const resolve = (s: string): string =>
    s
      .replaceAll('$PREV_PVT', PREVIOUS_PACKAGE_VERSION_TAG)
      .replaceAll('$PREV_PV', PREVIOUS_PACKAGE_VERSION)
      .replaceAll('$NEXT_CURRENT', NEXT_EXECUTION_VERSION)
      // For a stable target nextPrereleaseTag returns the release tag itself;
      // the train after a stable cut is a deliberate human decision recorded
      // in NEXT_EXECUTION_VERSION, so the bump must not rewrite the docs'
      // next-train anchor to the just-cut stable (the 0.43.0 prepare clobbered
      // v0.44.0-alpha.1 back to v0.43.0 and failed the anchor gate).
      .replaceAll(
        '$NEXT_TARGET',
        nextPrereleaseTag(version) === tag ? NEXT_EXECUTION_VERSION : nextPrereleaseTag(version),
      )
      .replaceAll('$LATEST', LATEST_LANDED_TRAIN)
      .replaceAll('$ACTIVE', ACTIVE_EXECUTION_VERSION)
      .replaceAll('$PVT', pvTag)
      .replaceAll('$PV', pv)
      .replaceAll('$TAG', tag)
      .replaceAll('$VER', version);
  return raw.map(([path, from, to]) => [path, resolve(from), resolve(to)]);
}

export async function updateCurrentVersionAnchors(version: string): Promise<void> {
  const replacements = buildVersionAnchorReplacements(version);

  for (const [path, from, to] of replacements) {
    const text = await Deno.readTextFile(path);
    if (text.includes(from)) {
      // Replace the first occurrence only: it is the head-zone declaration the
      // gates enforce. Later occurrences are historical quotes (release notes,
      // roadmap tables) that must keep the old version string.
      if (path === 'www/app/routes/roadmap.tsx' && from.startsWith('version: ')) {
        // The bump rewrites the current-line entry's version but cannot
        // invent the new release's theme. Record the superseded theme so
        // check-www-current-truth fails until a human writes the new one
        // (the 0.41.1 bump shipped alpha.19's theme under the v0.41.1 entry).
        const supersededTheme = supersededThemeForBump(text, from, to);
        if (supersededTheme) {
          const constantsPath = 'tools/project-constants.ts';
          const constants = await Deno.readTextFile(constantsPath);
          const bumped = bumpPreviousReleaseThemeText(constants, supersededTheme);
          if (bumped !== undefined) await Deno.writeTextFile(constantsPath, bumped);
        }
      }
      await Deno.writeTextFile(path, text.replace(from, to));
      continue;
    }
    if (text.includes(to)) {
      // Already at target - skip. Note there is deliberately no looser
      // "file mentions the version anywhere" skip: that heuristic let a head
      // anchor stay stale whenever the new version appeared elsewhere in the
      // file (e.g. a release-notes link), which is exactly the drift the
      // stale-anchor gate now rejects.
      continue;
    }
    // Anchor drifted (doc no longer carries the expected from-string). Rather
    // than abort the whole release, skip with a warning so a release is never
    // blocked by stale documentation references.
    console.warn(
      `updateCurrentVersionAnchors: ${path} does not contain expected anchor ` +
        `"${from}"; skipping (version bump continues).`,
    );
  }
}
