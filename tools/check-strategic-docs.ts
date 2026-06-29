import { ACTIVE_VERSION, PACKAGE_VERSION_TAG } from './project-constants.ts';

type Check = {
  name: string;
  files: string[];
  required?: string[];
  forbidden?: RegExp[];
};

type Failure = {
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
  'docs/release/v0.40.0-product-line-cleanup.md',
  'www/app/data/version.ts',
  'www/app/routes/index/index.tsx',
  'www/app/routes/roadmap.tsx',
  'www/app/routes/guide/getting-started.tsx',
  'www/app/routes/architecture/architecture.tsx',
  'www/app/routes/architecture/comparison.tsx',
  'www/app/routes/architecture/dsd.tsx',
  'www/app/routes/architecture/islands.tsx',
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
  'www/app/routes/guide/getting-started.tsx',
];

const checks: Check[] = [
  {
    name: 'current product-position anchors',
    files: ['docs/current/VERSION_PLAN.md', 'docs/roadmap/ROADMAP.md'],
    required: ['openElement = Web Components Fullstack Framework + Basic Element'],
  },
  {
    name: `${PACKAGE_VERSION_TAG} is the current package line`,
    files: currentDocs,
    required: [PACKAGE_VERSION_TAG],
  },
  {
    name: `${ACTIVE_VERSION} is the active execution line`,
    files: currentDocs,
    required: [ACTIVE_VERSION],
  },
  {
    name: 'v1.0 is the stable engine target',
    files: [
      'README.md',
      'README.zh.md',
      'docs/roadmap/ROADMAP.md',
      'docs/status/STATUS.md',
      'www/app/routes/roadmap.tsx',
    ],
    required: ['v1.0'],
  },
  {
    name: 'v0.37 roadmap is split into a validation train',
    files: [
      'docs/roadmap/ROADMAP.md',
      'docs/status/STATUS.md',
      'www/app/routes/roadmap.tsx',
    ],
    required: ['v0.37.6'],
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
      /v0\.37\.6 package\s+line current/i,
      /active execution target is\s+v0\.38\.0/i,
      /JSR publish is a best-effort distribution step/i,
      /JSR package visibility and post-publish JSR consumer smoke do not block version\s+exit/i,
      /Vue adapter proof/i,
      /Vue is .*heavy-framework island/i,
      /Vue 是.*heavy-framework island/i,
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

const failures: Failure[] = [];

for (const check of checks) {
  for (const file of check.files) {
    let text: string;
    try {
      text = await Deno.readTextFile(file);
    } catch (error) {
      failures.push({
        check: check.name,
        file,
        message: `cannot read file: ${error instanceof Error ? error.message : String(error)}`,
      });
      continue;
    }

    for (const required of check.required ?? []) {
      if (!text.includes(required)) {
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

if (failures.length > 0) {
  console.error('Strategic docs check failed:');
  for (const failure of failures) {
    console.error(`- [${failure.check}] ${failure.file}: ${failure.message}`);
  }
  Deno.exit(1);
}

console.log(`Strategic docs check passed (${checks.length} checks, ${publicDocs.length} files).`);
