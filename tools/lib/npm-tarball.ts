/**
 * Shared npm tarball naming helpers (#793).
 *
 * The tarball file name mirrors `deno pack --output`: scoped package name with
 * the scope marker stripped, plus the package version. Used by publish-npm.ts
 * (which writes the tarballs) and check-package-artifacts.ts (which reads them).
 */

import type { PackageInfo } from './package-graph.ts';

export function npmTarballName(pkg: PackageInfo): string {
  return `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
}

export function tarballPath(pkg: PackageInfo): string {
  return `${pkg.dir}/${npmTarballName(pkg)}`;
}
