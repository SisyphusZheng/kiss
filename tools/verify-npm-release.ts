#!/usr/bin/env -S deno run --allow-run

const version = Deno.args[0];
if (!/^\d+\.\d+\.\d+-alpha\.\d+$/u.test(version ?? '')) {
  throw new Error('Usage: verify-npm-release.ts <x.y.z-alpha.n>');
}

const packages = ['element', 'app', 'adapter-vite', 'ui', 'create'];

async function npmView(specifier: string, field: string): Promise<string> {
  const output = await new Deno.Command('npm', {
    args: ['view', specifier, field, '--json'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) throw new Error(`npm view ${specifier} ${field} failed: ${stderr}`);
  const value = JSON.parse(new TextDecoder().decode(output.stdout)) as unknown;
  if (typeof value !== 'string') throw new Error(`Unexpected npm value for ${specifier} ${field}`);
  return value;
}

for (const name of packages) {
  const packageName = `@openelement/${name}`;
  const published = await npmView(`${packageName}@${version}`, 'version');
  const alpha = await npmView(packageName, 'dist-tags.alpha');
  if (published !== version || alpha !== version) {
    throw new Error(`${packageName}: version=${published}, alpha=${alpha}, expected=${version}`);
  }
  console.log(`${packageName}@${version}: alpha dist-tag verified`);
}
