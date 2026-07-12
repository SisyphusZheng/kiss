type Failure = {
  file: string;
  message: string;
};

import { walkSync } from '@std/fs/walk';

const failures: Failure[] = [];
const sourceRoots = ['packages/element/src'];
const protectedPackageConfigs = ['packages/element/deno.json'];
const forbiddenRequiredDeps = ['@preact/signals-core', '@preact/signals'];

for (const root of sourceRoots) {
  for (const entry of walkSync(root, { includeDirs: false })) {
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.path.includes('/internal/signal/')) continue;
    const text = await Deno.readTextFile(entry.path);
    for (const dep of forbiddenRequiredDeps) {
      if (text.includes(dep)) {
        failures.push({
          file: entry.path,
          message: `${dep} must not be imported directly outside Element's internal signal engine`,
        });
      }
    }
  }
}

for (const file of protectedPackageConfigs) {
  const text = await Deno.readTextFile(file);
  for (const dep of forbiddenRequiredDeps) {
    if (text.includes(dep)) {
      failures.push({
        file,
        message: `${dep} must not be a required package dependency of @openelement/element`,
      });
    }
  }
}

if (failures.length > 0) {
  console.error('Signal boundary check failed:');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`);
  }
  Deno.exit(1);
}

console.log('Signal boundary check passed.');
