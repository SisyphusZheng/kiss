import {
  ACTIVE_INTERNAL_CHECKPOINT,
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
} from './project-constants.ts';
import { staleClaimsAlternation } from './check-version-anchors.ts';
import { STALE_HISTORY_CLAIM_PATTERNS } from './lib/stale-claims.ts';
import { formatError } from '@openelement/element';

export type Check = {
  name: string;
  files: string[];
  required?: string[];
  forbidden?: RegExp[];
  accept?: (text: string, file: string) => boolean;
};

export type Failure = {
  check: string;
  file: string;
  message: string;
};

const publicDocs = [
  'README.md',
  'README.zh.md',
  'docs/current/VERSION_PLAN.md',
  'docs/current/PACKAGE_SURFACE.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'docs/archive/README.md',
  'www/app/data/version.ts',
  'www/app/routes/index/index.tsx',
  'www/app/routes/roadmap.tsx',
  'www/app/routes/guide/getting-started.tsx',
  'www/app/routes/architecture/architecture.tsx',
  'www/app/routes/architecture/comparison.tsx',
  'www/app/routes/architecture/dsd.tsx',
  'www/app/routes/architecture/islands.tsx',
  'www/app/routes/apilist.tsx',
];

const currentDocs = [
  'README.md',
  'README.zh.md',
  'docs/governance/PROJECT_WORKFLOW.md',
  'docs/current/VERSION_PLAN.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'www/app/routes/index/index.tsx',
  'www/app/routes/roadmap.tsx',
  // Guide/architecture routes are thin ArticlePage shells since the ADR-0136
  // content pilot; the version anchor lives in the markdown body, which
  // substitutes {{OPENELEMENT_VERSION}} at render time.
  'www/content/guide/getting-started.md',
  'www/app/routes/apilist.tsx',
  'www/content/architecture/architecture.md',
];

/**
 * Currency claims ("the convergence is published as X", "completed
 * implementation anchor X") must name the current package line. The stale
 * side is parameterized from project-constants (PREVIOUS_PACKAGE_VERSION plus
 * the enumerable pre-release history) instead of naming a hardcoded alpha, so
 * the gate keeps rejecting last-release claims after every bump. The trailing
 * `(?![\d.])` keeps `0.41.0-alpha.1` from matching inside `0.41.0-alpha.17`.
 * Historical mentions without a currency claim (roadmap tables, release
 * notes) never match these patterns.
 *
 * Body-drift heuristics (issue #482): governance doc bodies contradicting
 * their own headers once survived because only the header zone was gated. A
 * "current published/verified line|baseline" phrase co-occurring with a
 * superseded package line, or an "Alpha.N is the current ..." sentence naming
 * an alpha other than the current one, now fails here.
 */
export function staleCurrencyClaimPatterns(): RegExp[] {
  const stale = staleClaimsAlternation();
  const currentAlpha = PACKAGE_VERSION.match(/-alpha\.(\d+)$/u)?.[1] ?? '0';
  return [
    new RegExp(`five-package convergence is published as\\s+\`?(?:${stale})(?![\\d.])`, 'i'),
    new RegExp(`五包收敛已作为\\s+\`?(?:${stale})(?![\\d.])`, 'i'),
    new RegExp(`completed\\s+implementation anchor\\s+\`?(?:${stale})(?![\\d.])`, 'i'),
    new RegExp(`current (?:published|verified)[^\\n]*(?:${stale})(?![\\d.])`, 'i'),
    new RegExp(`(?:${stale})(?![\\d.]) is the (?:published|current)[^\\n]*line`, 'i'),
    new RegExp(`Alpha\\.(?!${currentAlpha}\\b)\\d+ is the current`, 'i'),
  ];
}

export function strategicChecks(): Check[] {
  return [
    {
      name: 'current product-position anchors',
      files: ['docs/current/VERSION_PLAN.md', 'docs/roadmap/ROADMAP.md'],
      required: ['OpenElement = Web Components-native fullstack application framework'],
    },
    {
      name: `${PACKAGE_VERSION_TAG} is the current maturity line`,
      files: [
        'README.md',
        'README.zh.md',
        'docs/current/VERSION_PLAN.md',
        'docs/roadmap/ROADMAP.md',
        'docs/status/STATUS.md',
        'www/app/routes/roadmap.tsx',
      ],
      required: [PACKAGE_VERSION_TAG],
      accept: (text) => text.includes(PACKAGE_VERSION_TAG) || text.includes(PACKAGE_VERSION),
    },
    {
      name: `${PACKAGE_VERSION_TAG} is the current package line`,
      files: currentDocs,
      required: [PACKAGE_VERSION_TAG],
      accept: (text: string, file: string) =>
        text.includes(PACKAGE_VERSION_TAG) ||
        // .tsx routes reference the version symbol; content markdown carries
        // the {{OPENELEMENT_VERSION}} placeholder (substituted at render).
        ((file.endsWith('.tsx') || file.endsWith('.md')) &&
          (text.includes('OPENELEMENT_VERSION') ||
            text.includes('PUBLISHED_PACKAGE_VERSION'))),
    },
    {
      name: `${ACTIVE_INTERNAL_CHECKPOINT} is the active internal checkpoint`,
      files: ['docs/current/VERSION_PLAN.md'],
      required: [ACTIVE_INTERNAL_CHECKPOINT],
    },
    {
      name: 'v1.0 is the stable product target',
      files: [
        'README.md',
        'README.zh.md',
        'docs/roadmap/ROADMAP.md',
        'docs/status/STATUS.md',
        'www/app/routes/roadmap.tsx',
      ],
      required: ['1.0.0'],
    },
    {
      name: 'stale version and stale roadmap claims are absent',
      files: publicDocs,
      forbidden: [
        /Current version\s+<code>v0\.18\.0/i,
        /v0\.19\.0<\/strong><span>latest/i,
        /Current Version:\s*0\.19/i,
        /planned for v0\.20/i,
        /v0\.20\.0<\/strong><span>project line/i,
        /v0\.20\.0 Ocean-Island Architecture/i,
        /计划在 v0\.20/,
        /Gate currently passes at threshold Infinity/i,
        /681<\/strong><span>tests/i,
        /v0\.37\.0\s*\|\s*Server\/Data\/UI Product Closure/i,
        ...STALE_HISTORY_CLAIM_PATTERNS,
        /JSR package visibility and post-publish JSR consumer smoke do not block version\s+exit/i,
        /dual npm\/JSR publishing/i,
        /Web Components Fullstack Framework \+ Basic Element/i,
        /supporting packages = Protocols \+ UI/i,
        /11-package graph/i,
        /11 packages expose/i,
        ...staleCurrencyClaimPatterns(),
      ],
    },
    {
      name: 'deferred framework work is not described as shipped',
      files: publicDocs,
      forbidden: [
        /request-time SSR\s+(is|are)\s+(shipped|stable|implemented)/i,
        /(Hydration strategies|Hydration strategy support)\s+(is|are)\s+(shipped|stable|implemented)/i,
        /Registry Hub\s+(is|as)\s+a mature marketplace/i,
        /Registry Hub.*成熟市场/,
      ],
    },
  ];
}

/** Pure core: evaluate every check against a file reader. */
export function findStrategicDocFailures(read: (path: string) => string): Failure[] {
  const failures: Failure[] = [];

  for (const check of strategicChecks()) {
    for (const file of check.files) {
      let text: string;
      try {
        text = read(file);
      } catch (error) {
        failures.push({
          check: check.name,
          file,
          message: `cannot read file: ${formatError(error)}`,
        });
        continue;
      }

      for (const required of check.required ?? []) {
        const hasAnchor = check.accept ? check.accept(text, file) : text.includes(required);
        if (!hasAnchor) {
          failures.push({
            check: check.name,
            file,
            message: `missing required anchor: ${required}`,
          });
        }
      }

      for (const pattern of check.forbidden ?? []) {
        const match = text.match(pattern);
        if (match) {
          failures.push({
            check: check.name,
            file,
            message: `forbidden claim matched: ${match[0]}`,
          });
        }
      }
    }
  }

  return failures;
}
