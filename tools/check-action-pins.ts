/** Enforce immutable SHA pins for every third-party GitHub Action. */

const workflowRoots = ['.github/workflows', '.github/actions'];
const shaPattern = /@[0-9a-f]{40}(?:\s|$)/i;
const usesPattern = /^\s*-?\s*uses:\s*([^\s#]+)(?:\s|#|$)/gm;
const failures: string[] = [];

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory) files.push(...await walk(path));
    if (entry.isFile && /\.ya?ml$/.test(entry.name)) files.push(path);
  }
  return files;
}

for (const root of workflowRoots) {
  for (const file of await walk(root)) {
    const source = await Deno.readTextFile(file);
    for (const match of source.matchAll(usesPattern)) {
      const action = match[1];
      if (action.startsWith('./') || action.startsWith('docker://')) continue;
      if (!shaPattern.test(action)) {
        failures.push(`${file}: ${action} is not pinned to a full commit SHA`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Action pin check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log('Action pin check passed.');
