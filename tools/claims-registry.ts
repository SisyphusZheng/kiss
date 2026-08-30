/**
 * claims-registry.ts - Code/claim alignment registry (#893).
 *
 * The docs:truth gate historically validated text patterns only, which let
 * #889 ship: a comment in ssr-polyfills.ts claimed the dev SSR entry imports
 * the polyfill first, but plugin.ts did not prepend the import. The gate had
 * no way to notice.
 *
 * This registry is the minimal mechanism: every entry pairs a comment-claim
 * (file + line) with a regex that must still match in a target file. The
 * docs:truth `claims` check fails when the claim comment or its target
 * disappears, with the message shape required by #893:
 *
 *   claim in {claimFile}:{claimLine} not satisfied by code in {targetFile}
 *
 * Keep the registry data-driven: adding a claim is one entry, no new code.
 *
 * @module ./claims-registry.ts
 */

export type CodeClaim = {
  /** Stable identifier, referenced in commit messages and gate output. */
  id: string;
  /** File containing the comment that makes the claim. */
  claimFile: string;
  /** Line range of the claim in claimFile, for the failure message. */
  claimLine: string;
  /** Human-readable statement of what the code must do. */
  description: string;
  /** File whose content must satisfy the claim. */
  targetFile: string;
  /** Regex (string form) that must match somewhere in targetFile. */
  pattern: string;
};

export const CODE_CLAIMS: CodeClaim[] = [
  {
    id: 'adr-0044-dev-polyfill-first-import',
    claimFile: 'packages/adapter-vite/src/internal/ssg/ssr-polyfills.ts',
    claimLine: '33-36',
    description:
      'In dev, the virtual SSR entry must import the customElements polyfill as its first module (ADR-0044), so route modules that call customElements.define() at top level do not crash (regression #889).',
    targetFile: 'packages/adapter-vite/src/plugin.ts',
    pattern: "import '\\$\\{VIRTUAL_POLYFILL_ID\\}';",
  },
  {
    id: 'adr-0126-colon-smuggling',
    claimFile: 'docs/adr/ADR-0126-sanitize-html-allow-list.md',
    claimLine: '61-75',
    description:
      'isSafeUrl must conceptually decode the &colon; named entity (case-insensitive) so colon-free input cannot smuggle an executable scheme (audit #911).',
    targetFile: 'packages/element/src/sanitize.ts',
    pattern: 'replace\\(/&colon;/gi',
  },
];

/**
 * The anchor is the claim comment itself: the claimLine window of claimFile
 * must still cover comment lines (source files) or prose (docs). Deleting
 * the comment shifts real code into the window and trips the gate.
 */
function claimAnchorPresent(claim: CodeClaim, claimSource: string): boolean {
  const match = claim.claimLine.match(/^(\d+)(?:-(\d+))?$/);
  if (!match) return false;
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  const lines = claimSource.split('\n');
  if (start < 1 || end > lines.length) return false;
  const window = lines.slice(start - 1, end);
  const isSource = /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(claim.claimFile);
  return window.some((line) => isSource ? /\/\/|\/\*|^\s*\*/.test(line) : line.trim() !== '');
}

/**
 * Resolve a claim against its target file. Returns the failure message, or
 * null when the claim holds. Missing files and a deleted claim comment are
 * failures, not crashes, so a deleted claim comment or target always trips
 * the gate (claims must be retired from the registry explicitly).
 */
export function checkClaim(claim: CodeClaim): string | null {
  let claimSource: string;
  let target: string;
  try {
    claimSource = Deno.readTextFileSync(claim.claimFile);
  } catch {
    return `claim file missing: ${claim.claimFile}`;
  }
  if (!claimAnchorPresent(claim, claimSource)) {
    return `claim comment missing: ${claim.claimFile}:${claim.claimLine} (claim ${claim.id})`;
  }
  try {
    target = Deno.readTextFileSync(claim.targetFile);
  } catch {
    return `target file missing: ${claim.targetFile} (claim ${claim.claimFile}:${claim.claimLine})`;
  }
  if (!new RegExp(claim.pattern).test(target)) {
    return `claim in ${claim.claimFile}:${claim.claimLine} not satisfied by code in ${claim.targetFile}`;
  }
  return null;
}
