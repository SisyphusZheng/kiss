#!/usr/bin/env -S deno run --allow-run

import { NpmViewError, verifyNpmRelease } from './lib/npm-release-verifier.ts';

async function npmView(specifier: string, field: string): Promise<string> {
  const output = await new Deno.Command('npm', {
    args: ['view', specifier, field, '--json'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    const retryable = !/\b(?:E401|E403)\b/u.test(stderr);
    throw new NpmViewError(`npm view ${specifier} ${field} failed: ${stderr.trim()}`, retryable);
  }
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(output.stdout)) as unknown;
  } catch (error) {
    throw new NpmViewError(`Invalid npm JSON for ${specifier} ${field}: ${error}`, false);
  }
  if (typeof value !== 'string') {
    throw new NpmViewError(`Unexpected npm value for ${specifier} ${field}`, false);
  }
  return value;
}

if (import.meta.main) {
  const version = Deno.args[0];
  if (!version) {
    throw new Error('Usage: verify-npm-release.ts <x.y.z-alpha|beta|rc.n>');
  }
  await verifyNpmRelease({
    version,
    packages: ['element', 'app', 'adapter-vite', 'ui', 'create'],
    query: npmView,
    log: console.log,
  });
}
