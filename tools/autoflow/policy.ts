export type AutoFlowTier = 'dev' | 'push' | 'ci' | 'release';

export type ChangeLevel = 'patch' | 'minor' | 'major';

export interface GateDefinition {
  name: string;
  command: string[];
  tiers: AutoFlowTier[];
  triggers?: RegExp[];
}

export interface PatchEligibilityInput {
  changedPaths: string[];
  approvedPlanId?: string;
  publicApiChanged?: boolean;
  packageTopologyChanged?: boolean;
  releasePolicyChanged?: boolean;
  runtimeDefaultChanged?: boolean;
  securityAuthDatabaseChanged?: boolean;
  minorMajorRoadmapChanged?: boolean;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  requiredEvidence: string[];
}

export const AUTOFLOW3_POLICY_VERSION = 'autoflow3-v0';
export function isCI(): boolean {
  return Deno.env.get('CI') === 'true';
}

export const GATES: readonly GateDefinition[] = [
  {
    name: 'fmt:check',
    command: ['deno', 'task', 'fmt:check'],
    tiers: ['dev', 'push', 'ci', 'release'],
  },
  {
    name: 'lint',
    command: ['deno', 'task', 'lint'],
    tiers: ['dev', 'push', 'ci', 'release'],
  },
  {
    name: 'typecheck',
    command: ['deno', 'task', 'typecheck'],
    tiers: ['push', 'ci', 'release'],
  },
  {
    name: 'graph:check',
    command: ['deno', 'task', 'graph:check'],
    tiers: ['push', 'ci', 'release'],
  },
  {
    name: 'package-surface:check',
    command: ['deno', 'task', 'package-surface:check'],
    tiers: ['push', 'ci', 'release'],
    triggers: [/^packages\//, /^deno\.json$/, /^tools\/lib\/package-graph\.ts$/],
  },
  {
    name: 'interface:snapshot',
    command: ['deno', 'task', 'interface:snapshot'],
    tiers: ['ci', 'release'],
    triggers: [
      /^packages\//,
      /^docs\/release\/v0\.41\.0-interface-snapshot\.json$/,
      /^tools\/check-public-interface-snapshot\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'export-files:check',
    command: ['deno', 'task', 'export-files:check'],
    tiers: ['push', 'ci', 'release'],
    triggers: [
      /^packages\/[^/]+\/deno\.json$/,
      /^packages\/adapter-vite\/src\/npm-specifier-plugin\.ts$/,
      /^packages\/adapter-vite\/src\/generated-export-files\.ts$/,
      /^tools\/generate-openelement-export-files\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'generate:ui-tokens:check',
    command: ['deno', 'task', 'generate:ui-tokens:check'],
    tiers: ['push', 'ci', 'release'],
    triggers: [
      /^packages\/ui\/src\/open-props-tokens\.(?:css|ts)$/,
      /^tools\/generate-ui-token-module\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'workflow:check-slimming',
    command: ['deno', 'task', 'workflow:check-slimming'],
    tiers: ['push', 'ci', 'release'],
    triggers: [/^\.github\/workflows\//, /^tools\/check-workflow-slimming\.ts$/],
  },
  {
    name: 'repo:hygiene',
    command: ['deno', 'task', 'repo:hygiene'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\//, /^tools\//, /^deno\.json$/, /^README/, /^docs\/current\//],
  },
  {
    name: 'workflow:check',
    command: ['deno', 'task', 'workflow:check'],
    tiers: ['ci', 'release'],
    triggers: [/^docs\//, /^deno\.json$/],
  },
  {
    name: 'docs:check-public',
    command: ['deno', 'task', 'docs:check-public'],
    tiers: ['ci', 'release'],
  },
  {
    name: 'docs:check-current',
    command: ['deno', 'task', 'docs:check-current'],
    tiers: ['ci', 'release'],
    triggers: [/^docs\//, /^README/],
  },
  {
    name: 'docs:check-strategy',
    command: ['deno', 'task', 'docs:check-strategy'],
    tiers: ['ci', 'release'],
    triggers: [/^docs\//, /^README/, /^www\/app\/routes\//],
  },
  {
    name: 'www:check-theme-tokens',
    command: ['deno', 'task', 'www:check-theme-tokens'],
    tiers: ['dev', 'push', 'ci', 'release'],
    triggers: [/^www\/app\//, /^www\/vite\.config\.ts$/, /^packages\/ui\/src\/open-props-tokens/],
  },
  {
    name: 'docs:check-version-anchors',
    command: ['deno', 'task', 'docs:check-version-anchors'],
    tiers: ['ci', 'release'],
    triggers: [
      /^docs\//,
      /^README/,
      /^tools\/project-constants\.ts$/,
      /^tools\/check-version-anchors\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'actions:check-pins',
    command: ['deno', 'task', 'actions:check-pins'],
    tiers: ['ci', 'release'],
    triggers: [/^\.github\/workflows\//, /^tools\/check-action-pins\.ts$/],
  },
  {
    name: 'verify:configs',
    command: ['deno', 'task', 'verify:configs'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\/[^/]+\/deno\.json$/, /^tools\/verify-package-configs\.ts$/],
  },
  {
    name: 'release:evidence:check',
    command: ['deno', 'task', 'release:evidence:check'],
    tiers: ['ci', 'release'],
    triggers: [
      /^docs\/release\//,
      /^tools\/check-release-evidence-consistency\.ts$/,
      /^tools\/lib\/release-evidence-consistency\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'arch:check',
    command: ['deno', 'task', 'arch:check'],
    tiers: ['ci', 'release'],
    triggers: [
      /^packages\//,
      /^tools\//,
      /^\.githooks\//,
      /^\.github\/workflows\//,
      /^deno\.json$/,
      /^deno\.lock$/,
    ],
  },
  {
    name: 'signals:check-protocol-boundary',
    command: ['deno', 'task', 'signals:check-protocol-boundary'],
    tiers: ['ci', 'release'],
    triggers: [
      /^packages\/element\/src\/internal\/(signal|protocol)\//,
      /^tools\/check-signal-protocol-boundary\.ts$/,
    ],
  },
  {
    name: 'type-safety:check',
    command: ['deno', 'task', 'type-safety:check'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\//, /^tools\//, /^www\//, /^deno\.json$/],
  },
  {
    name: 'deno-api:check',
    command: ['deno', 'task', 'deno-api:check'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\/(element|ui|app)\/src\//],
  },
  {
    name: 'text-integrity:check',
    command: ['deno', 'task', 'text-integrity:check'],
    tiers: ['ci', 'release'],
    triggers: [/^README/, /^docs\//, /^packages\//, /^tools\//, /^www\//, /^deno\.json$/],
  },
  {
    name: 'test:coverage:check',
    command: ['deno', 'task', 'test:coverage:check'],
    tiers: ['ci', 'release'],
    triggers: [/^(packages|tools)\//, /^deno\.json$/],
  },
  {
    name: 'build',
    command: ['deno', 'task', 'build'],
    tiers: ['ci', 'release'],
    triggers: [/^(packages|www)\//, /^deno\.json$/],
  },
  {
    // Runs after build: the e2e critical-path suites serve www/dist, which a
    // fresh CI checkout only has once the build gate has produced it.
    name: 'test:critical-paths',
    command: ['deno', 'task', 'test:critical-paths'],
    tiers: ['ci', 'release'],
    triggers: [/^(packages|tools|www\/e2e)\//, /^deno\.json$/],
  },
  {
    name: 'test:e2e',
    command: ['deno', 'task', 'test:e2e'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\//, /^www\//, /^deno\.json$/],
  },
  {
    // Request-time fixture suite (#543): build the fixture, then run its
    // live.spec.ts on Chromium, Firefox and WebKit. The job must have all
    // three browsers installed (see .github/workflows/autoflow-ci.yml and
    // autoflow-release.yml).
    name: 'fixture:request-time:gate',
    command: ['deno', 'task', 'fixture:request-time:gate'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\/adapter-vite\/(src|__fixtures__)\//, /^deno\.json$/],
  },
  {
    // Static-output determinism (#560): the release-tier form of the
    // byte-identical freeze proof. Builds www twice and requires
    // byte-identical output (builtAt-normalized). The full baseline
    // comparison (`deno task check:static-output-freeze --baseline <ref>`)
    // stays a release-evidence tool: content drift between versions makes a
    // fixed-ref byte comparison meaningless as a gate.
    name: 'check:static-output-freeze',
    command: ['deno', 'task', 'check:static-output-freeze', '--self-check'],
    tiers: ['release'],
    triggers: [/^packages\//, /^www\//, /^deno\.json$/],
  },
  {
    name: 'nitro:proof:node',
    command: ['deno', 'task', 'nitro:proof:node'],
    tiers: ['release'],
    triggers: [
      /^packages\/adapter-vite\//,
      /^packages\/app\//,
      /^tools\/nitro-proof\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'nitro:proof:workers',
    command: ['deno', 'task', 'nitro:proof:workers'],
    tiers: ['release'],
    triggers: [
      /^packages\/adapter-vite\//,
      /^packages\/app\//,
      /^tools\/nitro-proof\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'consumer:local',
    command: ['deno', 'task', 'consumer:local'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\/create\//, /^packages\/app\//, /^packages\/adapter-vite\//],
  },
  {
    name: 'consumer:packaged',
    command: ['deno', 'task', 'consumer:packaged'],
    tiers: ['ci', 'release'],
    triggers: [
      /^packages\/create\//,
      /^packages\/app\//,
      /^packages\/adapter-vite\//,
      /^tools\/consumer-local\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'consumer:element-smoke',
    command: ['deno', 'task', 'consumer:element-smoke'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\/element\//, /^tools\/consumer-smoke\.ts$/, /^deno\.json$/],
  },
  {
    name: 'third-party-wc:smoke',
    command: ['deno', 'task', 'third-party-wc:smoke'],
    tiers: ['ci', 'release'],
    triggers: [
      /^packages\//,
      /^tools\/third-party-wc-smoke\.ts$/,
      /^docs\/integrations\//,
      /^deno\.json$/,
    ],
  },
  {
    name: 'examples:check',
    command: ['deno', 'task', 'examples:check'],
    tiers: ['ci', 'release'],
    triggers: [/^examples\//, /^deno\.json$/],
  },
  {
    name: 'package-artifacts:check',
    command: ['deno', 'task', 'package-artifacts:check'],
    tiers: ['ci', 'release'],
    triggers: [
      /^packages\//,
      /^deno\.json$/,
      /^tools\/check-package-artifacts\.ts$/,
      /^tools\/publish-npm\.ts$/,
      /^tools\/lib\/package-graph\.ts$/,
    ],
  },
  {
    name: 'pack:dry-run',
    command: ['deno', 'task', 'pack:dry-run'],
    tiers: ['release'],
    triggers: [
      /^packages\//,
      /^deno\.json$/,
      /^tools\/publish-npm\.ts$/,
      /^tools\/lib\/package-graph\.ts$/,
    ],
  },
  {
    name: 'publish:npm:dry-run',
    command: ['deno', 'task', 'publish:npm:dry-run'],
    tiers: ['release'],
    triggers: [
      /^packages\//,
      /^deno\.json$/,
      /^tools\/publish-npm\.ts$/,
      /^tools\/lib\/package-graph\.ts$/,
    ],
  },
];

export function selectGates(tier: AutoFlowTier, changedPaths: string[]): GateDefinition[] {
  const selected = GATES.filter((gate) => {
    if (!gate.tiers.includes(tier)) return false;
    if (!gate.triggers || gate.triggers.length === 0) return true;
    if (tier === 'ci' || tier === 'release') return true;
    return changedPaths.some((path) => gate.triggers!.some((pattern) => pattern.test(path)));
  });

  // OPEN_ELEMENT_E2E_OFFLINE=1 is a dev-only escape hatch. CI and release tiers
  // never skip E2E; the override requires explicit opt-in per invocation and logs
  // a warning that the gate is being skipped.
  if (
    Deno.env.get('OPEN_ELEMENT_E2E_OFFLINE') === '1'
  ) {
    if (tier === 'ci' || tier === 'release') {
      console.warn(
        '[autoflow] OPEN_ELEMENT_E2E_OFFLINE is not honoured in CI/release tiers; E2E will run.',
      );
    } else {
      return selected.map((gate) => {
        if (gate.name !== 'test:e2e') return gate;
        return {
          ...gate,
          command: [
            'deno',
            'eval',
            "console.warn('[test:e2e] OPEN_ELEMENT_E2E_OFFLINE=1; skipping E2E (dev-only escape)'); Deno.exit(77)",
          ],
        };
      });
    }
  }

  return selected;
}

export function evaluatePatchEligibility(input: PatchEligibilityInput): PolicyDecision {
  const requiredEvidence = ['release-state:auto-classification'];

  const blockers: string[] = [];
  if (
    input.publicApiChanged ||
    input.changedPaths.some((path) => /^packages\/[^/]+\/src\//.test(path))
  ) {
    blockers.push('public API impact must be reviewed unless explicitly classified as internal');
  }
  if (
    input.packageTopologyChanged ||
    input.changedPaths.some((path) =>
      /^packages\/[^/]+\/deno\.json$/.test(path) || path === 'deno.json' ||
      path === 'tools/lib/package-graph.ts'
    )
  ) {
    blockers.push('package topology or release graph changed');
  }
  if (
    input.releasePolicyChanged ||
    input.changedPaths.some((path) => path.startsWith('docs/governance/'))
  ) {
    blockers.push('release policy or governance changed');
  }
  if (input.runtimeDefaultChanged) blockers.push('runtime or default engine changed');
  if (input.securityAuthDatabaseChanged) {
    blockers.push('security, auth, or database ownership changed');
  }
  if (
    input.minorMajorRoadmapChanged ||
    input.changedPaths.some((path) =>
      path === 'docs/roadmap/ROADMAP.md' || path.startsWith('docs/adr/') ||
      path === 'docs/current/VERSION_PLAN.md'
    )
  ) {
    blockers.push('minor/major roadmap or ADR scope changed');
  }

  if (blockers.length > 0) {
    return {
      allowed: false,
      reason: `requires human review: ${blockers.join('; ')}`,
      requiredEvidence: ['ADR or approved version plan'],
    };
  }

  return {
    allowed: true,
    reason: 'patch automation allowed for bounded mechanical change',
    requiredEvidence,
  };
}

export function evaluateVersionAuthority(
  level: ChangeLevel,
  approvedPlanId?: string,
): PolicyDecision {
  if (level === 'patch') {
    return {
      allowed: true,
      reason: 'patch automation may proceed after patch eligibility and gates pass',
      requiredEvidence: ['release-state:auto-classification'],
    };
  }

  if (approvedPlanId) {
    return {
      allowed: true,
      reason: `${level} execution allowed with approved plan ${approvedPlanId}`,
      requiredEvidence: ['ADR', 'approved version plan', `approval:${approvedPlanId}`],
    };
  }

  return {
    allowed: false,
    reason: `${level} scope cannot be decided by AutoFlow`,
    requiredEvidence: ['ADR', 'approved version plan'],
  };
}
