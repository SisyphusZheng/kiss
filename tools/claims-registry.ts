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
 * docs:truth `claims` check fails when a claim's target disappears, with the
 * message shape required by #893:
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
];

/**
 * Resolve a claim against its target file. Returns the failure message, or
 * null when the claim holds. Missing files are failures, not crashes, so a
 * deleted claim comment or target always trips the gate (claims must be
 * retired from the registry explicitly).
 */
export function checkClaim(claim: CodeClaim): string | null {
  let target: string;
  try {
    if (!Deno.statSync(claim.claimFile).isFile) {
      return `claim file missing: ${claim.claimFile}`;
    }
    target = Deno.readTextFileSync(claim.targetFile);
  } catch {
    return `target file missing: ${claim.targetFile} (claim ${claim.claimFile}:${claim.claimLine})`;
  }
  if (!new RegExp(claim.pattern).test(target)) {
    return `claim in ${claim.claimFile}:${claim.claimLine} not satisfied by code in ${claim.targetFile}`;
  }
  return null;
}
