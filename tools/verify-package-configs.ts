/**
 * Verify that all package deno.json files follow the standard configuration.
 *
 * Usage:
 *   deno run --allow-read tools/verify-package-configs.ts
 *   deno run --allow-read tools/verify-package-configs.ts --fix
 */

import { join } from 'node:path';
import { getExpectedConfig, isConfigStandard } from './config-templates.ts';

interface PackageConfig {
  name: string;
  version: string;
  exports?: Record<string, string>;
  imports?: Record<string, string>;
  publish?: { include: string[]; exclude?: string[] };
  include?: string[];
  exclude?: string[];
  tasks?: Record<string, string>;
  lint?: Record<string, unknown>;
}

const PACKAGES = [
  'core',
  'protocol',
  'element',
  'signal',
  'ui',
  'router',
  'adapter-vite',
  'content',
  'ssg',
  'app',
  'create',
];

async function verifyPackageConfigs(fix = false): Promise<void> {
  console.log('🔍 Verifying package configurations...\n');

  let totalIssues = 0;
  const issues: { pkg: string; mismatches: string[] }[] = [];

  for (const pkg of PACKAGES) {
    const denoJsonPath = join('packages', pkg, 'deno.json');
    const content = await Deno.readTextFile(denoJsonPath);
    const config: PackageConfig = JSON.parse(content);
    const packageName = `@openelement/${pkg}`;

    const result = isConfigStandard(packageName, config);

    if (!result.valid) {
      totalIssues += result.mismatches.length;
      issues.push({ pkg: packageName, mismatches: result.mismatches });
      console.log(`❌ ${packageName}`);
      for (const mismatch of result.mismatches) {
        console.log(`   - ${mismatch}`);
      }
    } else {
      console.log(`✅ ${packageName}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  if (totalIssues === 0) {
    console.log('✅ All package configurations are standard!');
  } else {
    console.log(`❌ Found ${totalIssues} configuration issues in ${issues.length} packages`);

    if (fix) {
      console.log('\n🔧 Attempting to fix configurations...\n');
      await fixPackageConfigs(issues);
    } else {
      console.log(
        '\n💡 Run with --fix flag to automatically fix configurations:',
      );
      console.log('   deno run --allow-read --allow-write tools/verify-package-configs.ts --fix');
    }
  }
}

async function fixPackageConfigs(
  issues: { pkg: string; mismatches: string[] }[],
): Promise<void> {
  for (const issue of issues) {
    const pkg = issue.pkg.replace('@openelement/', '');
    const denoJsonPath = join('packages', pkg, 'deno.json');
    const content = await Deno.readTextFile(denoJsonPath);
    const config: PackageConfig = JSON.parse(content);

    const expected = getExpectedConfig(issue.pkg);

    // Apply fixes
    if (expected.publish) {
      config.publish = expected.publish;
    }
    if (expected.include) {
      config.include = expected.include;
    }
    if (expected.exclude) {
      config.exclude = expected.exclude;
    }
    if (expected.tasks) {
      config.tasks = expected.tasks;
    }
    if (expected.lint) {
      config.lint = expected.lint;
    }

    // Write back
    await Deno.writeTextFile(
      denoJsonPath,
      JSON.stringify(config, null, 2) + '\n',
    );
    console.log(`✅ Fixed ${issue.pkg}`);
  }

  console.log('\n✅ All configurations fixed!');
}

// Main
const fix = Deno.args.includes('--fix');
await verifyPackageConfigs(fix);
