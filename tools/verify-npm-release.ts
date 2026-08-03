#!/usr/bin/env -S deno run --allow-run

import { npmView, verifyNpmRelease } from './lib/npm-release-verifier.ts';
import { RETAINED_PACKAGE_NAMES } from './project-constants.ts';

if (import.meta.main) {
  const version = Deno.args[0];
  if (!version) {
    throw new Error('Usage: verify-npm-release.ts <x.y.z-alpha|beta|rc.n>');
  }
  await verifyNpmRelease({
    version,
    packages: RETAINED_PACKAGE_NAMES.map((name) => name.slice('@openelement/'.length)),
    query: npmView,
    log: console.log,
  });
}
