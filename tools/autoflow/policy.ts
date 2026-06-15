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
export const V040_CLEANUP_TRAIN_APPROVAL_ID = 'ADR-0105/v0.40.x-cleanup-train';

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
    triggers: [/^packages\/core\//, /^packages\/protocol\//, /^packages\/signal\//],
  },
  {
    name: 'type-safety:check',
    command: ['deno', 'task', 'type-safety:check'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\//, /^tools\//, /^www\//, /^deno\.json$/],
  },
  {
    name: 'text-integrity:check',
    command: ['deno', 'task', 'text-integrity:check'],
    tiers: ['ci', 'release'],
    triggers: [/^README/, /^docs\//, /^packages\//, /^tools\//, /^www\//, /^deno\.json$/],
  },
  {
    name: 'test',
    command: ['deno', 'task', 'test'],
    tiers: ['ci', 'release'],
    triggers: [/^(packages|tools)\//, /^deno\.json$/],
  },
  {
    name: 'test:coverage:check',
    command: ['deno', 'task', 'test:coverage:check'],
    tiers: ['ci', 'release'],
    triggers: [/^(packages|tools)\//, /^deno\.json$/],
  },
  {
    name: 'test:e2e',
    command: ['deno', 'task', 'test:e2e'],
    tiers: ['ci', 'release'],
    triggers: [/^packages\//, /^www\//, /^deno\.json$/],
  },
  {
    name: 'build',
    command: ['deno', 'task', 'build'],
    tiers: ['ci', 'release'],
    triggers: [/^(packages|www)\//, /^deno\.json$/],
  },
  {
    name: 'nitro:proof:node',
    command: ['deno', 'task', 'nitro:proof:node'],
    tiers: ['release'],
    triggers: [
      /^packages\/adapter-vite\//,
      /^packages\/app\//,
      /^packages\/ssg\//,
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
      /^packages\/ssg\//,
      /^tools\/nitro-proof\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'consumer:local',
    command: ['deno', 'task', 'consumer:local'],
    tiers: ['release'],
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
      /^packages\/content\//,
      /^packages\/signal\//,
      /^packages\/ssg\//,
      /^tools\/consumer-local\.ts$/,
      /^deno\.json$/,
    ],
  },
  {
    name: 'consumer:core-smoke',
    command: ['deno', 'task', 'consumer:core-smoke'],
    tiers: ['release'],
    triggers: [/^packages\/core\//, /^tools\/consumer-smoke\.ts$/, /^deno\.json$/],
  },
  {
    name: 'publish:dry-run',
    command: ['deno', 'task', 'publish:dry-run'],
    tiers: ['release'],
    triggers: [
      /^packages\//,
      /^deno\.json$/,
      /^tools\/run-package-graph-task\.ts$/,
      /^tools\/lib\/package-graph\.ts$/,
    ],
  },
  {
    name: 'deploy:pages',
    command: ['deno', 'run', '-A', 'tools/deploy-pages.ts'],
    tiers: ['release'],
    triggers: [/^www\//, /^packages\//, /^tools\/deploy-pages\.ts$/],
  },
  {
    name: 'smoke:deploy',
    command: ['deno', 'run', '-A', 'tools/smoke-deploy.ts'],
    tiers: ['release'],
    triggers: [/^www\//, /^packages\//, /^tools\/smoke-deploy\.ts$/],
  },
];

export function selectGates(tier: AutoFlowTier, changedPaths: string[]): GateDefinition[] {
  return GATES.filter((gate) => {
    if (!gate.tiers.includes(tier)) return false;
    if (!gate.triggers || gate.triggers.length === 0) return true;
    if (tier === 'ci' || tier === 'release') return true;
    return changedPaths.some((path) => gate.triggers!.some((pattern) => pattern.test(path)));
  });
}

export function evaluatePatchEligibility(input: PatchEligibilityInput): PolicyDecision {
  const requiredEvidence = ['release-state:auto-classification'];

  if (isV040CleanupTrainChange(input.changedPaths) && !input.approvedPlanId) {
    return {
      allowed: false,
      reason:
        'v0.40.x cleanup train changes are manually approved breaking patches and require an approved plan id',
      requiredEvidence: ['ADR-0105', 'approved version plan', 'approval id'],
    };
  }

  if (
    isV040CleanupTrainChange(input.changedPaths) &&
    input.approvedPlanId === V040_CLEANUP_TRAIN_APPROVAL_ID
  ) {
    return {
      allowed: true,
      reason: `v0.40.x cleanup train allowed with approved plan ${input.approvedPlanId}`,
      requiredEvidence: [
        'ADR-0105',
        'docs/current/VERSION_PLAN.md',
        `approval:${input.approvedPlanId}`,
      ],
    };
  }

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

export function isV040CleanupTrainChange(changedPaths: string[]): boolean {
  return changedPaths.some((path) =>
    path === 'deno.json' ||
    path === 'deno.lock' ||
    path === 'tools/lib/package-graph.ts' ||
    path === 'tools/project-constants.ts' ||
    path === 'tools/check-package-surface.ts' ||
    path.startsWith('packages/') ||
    path.startsWith('docs/adr/ADR-0105') ||
    path === 'docs/current/VERSION_PLAN.md'
  );
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
