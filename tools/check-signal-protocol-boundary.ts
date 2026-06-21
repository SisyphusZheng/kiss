type Failure = {
  file: string;
  message: string;
};

const failures: Failure[] = [];
const sourceRoots = ['packages/core/src', 'packages/element/src'];
const protectedPackageConfigs = [
  'packages/core/deno.json',
  'packages/element/deno.json',
];
const forbiddenRequiredDeps = ['@preact/signals-core', '@preact/signals'];

async function walk(dir: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      files.push(...await walk(path));
    } else if (entry.isFile && path.endsWith('.ts')) {
      files.push(path);
    }
  }
  return files;
}

for (const root of sourceRoots) {
  for (const file of await walk(root)) {
    const text = await Deno.readTextFile(file);
    for (const dep of forbiddenRequiredDeps) {
      if (text.includes(dep)) {
        failures.push({
          file,
          message:
            `${dep} must not be required by core or elements; ADR-0104 only allows candidates behind SignalEngine`,
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
        message:
          `${dep} must not be a required dependency of @openelement/core or @openelement/element`,
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
