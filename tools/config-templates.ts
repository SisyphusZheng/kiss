/**
 * Configuration templates for standardizing deno.json across workspace packages.
 * Provides default configurations and exception handling.
 */

export interface PackageConfig {
  name: string;
  version: string;
  exports?: Record<string, string>;
  imports?: Record<string, string>;
  publish?: PublishConfig;
  include?: string[];
  exclude?: string[];
  tasks?: Record<string, string>;
  lint?: Record<string, unknown>;
}

export interface PublishConfig {
  include: string[];
  exclude?: string[];
}

// Standard configurations
export const STANDARD_CONFIGS = {
  publish: {
    include: ['src/**', 'deno.json', 'README.md', 'LICENSE'],
  },
  include: ['src'],
  exclude: ['node_modules', 'dist'],
  tasks: {
    build: 'deno check src/index.ts',
  },
};

// Package-specific exceptions
export const CONFIG_EXCEPTIONS: Record<string, Partial<PackageConfig>> = {
  '@openelement/create': {
    publish: {
      include: ['cli.ts', 'deno.json', 'README.md', 'LICENSE'],
    },
    tasks: {
      run: 'deno run -A cli.ts',
    },
  },
  '@openelement/core': {
    tasks: {
      build: 'deno check src/index.ts',
      lint: 'deno lint src/ __tests__/',
      typecheck: 'deno check src/index.ts',
      test: 'deno test --allow-read --allow-write --allow-env --allow-net --allow-run __tests__/',
      'test:ci':
        'deno test --allow-read --allow-write --allow-env --allow-net --allow-run --coverage --junit-path=test-results.xml __tests__/',
    },
  },
  '@openelement/adapter-vite': {
    tasks: {
      build: 'deno check src/',
      test: 'deno test --allow-read --allow-write --allow-env --allow-net __tests__/',
    },
  },
  '@openelement/app': {
    tasks: {
      build: 'deno check src/',
    },
  },
  '@openelement/router': {
    tasks: {
      build: 'deno check src/',
    },
  },
  '@openelement/signal': {
    lint: {
      rules: {
        exclude: ['no-explicit-any'],
      },
    },
  },
  '@openelement/ssg': {
    tasks: {
      build: 'deno check src/index.ts',
      test: 'deno test --allow-read --allow-write --allow-env --allow-net __tests__/',
    },
  },
  '@openelement/ui': {
    publish: {
      include: ['src/**', 'deno.json', 'README.md', 'LICENSE'],
      exclude: ['!src/generated-manifest.json'],
    },
  },
};

/**
 * Get the expected configuration for a package
 */
export function getExpectedConfig(packageName: string): Partial<PackageConfig> {
  const exception = CONFIG_EXCEPTIONS[packageName];
  if (exception) {
    return {
      publish: exception.publish || STANDARD_CONFIGS.publish,
      include: exception.include || STANDARD_CONFIGS.include,
      exclude: exception.exclude || STANDARD_CONFIGS.exclude,
      tasks: exception.tasks || STANDARD_CONFIGS.tasks,
      lint: exception.lint,
    };
  }

  return {
    publish: STANDARD_CONFIGS.publish,
    include: STANDARD_CONFIGS.include,
    exclude: STANDARD_CONFIGS.exclude,
    tasks: STANDARD_CONFIGS.tasks,
  };
}

/**
 * Check if a configuration matches the expected standard
 */
export function isConfigStandard(
  packageName: string,
  config: PackageConfig,
): { valid: boolean; mismatches: string[] } {
  const expected = getExpectedConfig(packageName);
  const mismatches: string[] = [];

  // Check publish config
  if (expected.publish) {
    if (!config.publish) {
      mismatches.push('missing publish config');
    } else if (
      JSON.stringify(config.publish.include) !==
        JSON.stringify(expected.publish.include)
    ) {
      mismatches.push(
        `publish.include mismatch: ${JSON.stringify(config.publish.include)} vs ${
          JSON.stringify(expected.publish.include)
        }`,
      );
    } else if (
      JSON.stringify(config.publish.exclude) !==
        JSON.stringify(expected.publish.exclude)
    ) {
      mismatches.push(
        `publish.exclude mismatch: ${JSON.stringify(config.publish.exclude)} vs ${
          JSON.stringify(expected.publish.exclude)
        }`,
      );
    }
  }

  // Check include config
  if (expected.include) {
    if (!config.include) {
      mismatches.push('missing include config');
    } else if (JSON.stringify(config.include) !== JSON.stringify(expected.include)) {
      mismatches.push(
        `include mismatch: ${JSON.stringify(config.include)} vs ${
          JSON.stringify(expected.include)
        }`,
      );
    }
  }

  // Check exclude config
  if (expected.exclude) {
    if (!config.exclude) {
      mismatches.push('missing exclude config');
    } else if (JSON.stringify(config.exclude) !== JSON.stringify(expected.exclude)) {
      mismatches.push(
        `exclude mismatch: ${JSON.stringify(config.exclude)} vs ${
          JSON.stringify(expected.exclude)
        }`,
      );
    }
  }

  // Check tasks config
  if (expected.tasks) {
    if (!config.tasks) {
      mismatches.push('missing tasks config');
    } else {
      for (const [key, value] of Object.entries(expected.tasks)) {
        if (config.tasks[key] !== value) {
          mismatches.push(
            `tasks.${key} mismatch: ${config.tasks[key]} vs ${value}`,
          );
        }
      }
    }
  }

  return {
    valid: mismatches.length === 0,
    mismatches,
  };
}

/**
 * Validate all workspace package configs against the standard template.
 * Returns list of non-compliant packages with their mismatches.
 */
export async function validateAllPackageConfigs(
  packagesDir: string,
): Promise<{ packageName: string; mismatches: string[] }[]> {
  const failures: { packageName: string; mismatches: string[] }[] = [];

  for await (const entry of Deno.readDir(packagesDir)) {
    if (!entry.isDirectory) continue;

    const denoJsonPath = `${packagesDir}/${entry.name}/deno.json`;
    try {
      const text = await Deno.readTextFile(denoJsonPath);
      const config = JSON.parse(text) as PackageConfig;
      const result = isConfigStandard(config.name, config);
      if (!result.valid) {
        failures.push({ packageName: config.name, mismatches: result.mismatches });
      }
    } catch {
      // Skip packages without deno.json or unreadable configs
      continue;
    }
  }

  return failures;
}
