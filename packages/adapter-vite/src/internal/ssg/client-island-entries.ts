/**
 * client-island-entries.ts — build the ClientIslandEntry list for the island
 * client entry.
 *
 * Single source of truth (#951) shared by the production client build
 * (cli/build-client.ts) and the dev island client plugin
 * (dev-island-client.ts): both feed generateClientEntry() and must resolve
 * module paths, hydration strategies and ssr/dsd coercion identically.
 */

import { resolve } from 'node:path';

import type { HydrationStrategy } from '../protocol/framework.ts';
import type { ClientIslandEntry, IslandDecl } from '../protocol/ssg.ts';

import { fsPathToModuleSpecifier } from './module-specifier.ts';
import { resolveIslandHydrate, resolveIslandSsrDsd } from './island-scanner.ts';

export function buildClientIslandEntries(options: {
  root: string;
  islandsDir: string;
  islandTagNames: string[];
  /** Relative file paths for local islands (preserves subdirectory structure). */
  islandFiles: string[];
  /** Local island metadata indexed by tag name. */
  islandMeta: Record<string, Partial<IslandDecl>>;
  packageIslandDecls: IslandDecl[];
  upgradeStrategy?: HydrationStrategy;
}): ClientIslandEntry[] {
  const {
    root,
    islandsDir,
    islandTagNames,
    islandFiles,
    islandMeta,
    packageIslandDecls,
    upgradeStrategy,
  } = options;

  return [
    ...islandTagNames.map((tagName: string, i: number) => {
      const meta = islandMeta[tagName];
      return {
        tagName,
        // #460: resolve() emits drive-letter backslash paths on Windows; convert
        // to a Vite-resolvable specifier (root-relative or /@fs/).
        modulePath: fsPathToModuleSpecifier(
          resolve(
            root,
            islandFiles[i] ? `${islandsDir}/${islandFiles[i]}` : `${islandsDir}/${tagName}.ts`,
          ),
          root,
        ),
        isPackage: false,
        strategy: resolveIslandHydrate(meta?.hydrate, upgradeStrategy),
        ...resolveIslandSsrDsd(meta ?? {}),
        reason: meta?.reason,
      };
    }),
    ...packageIslandDecls.map(
      (island) => ({
        tagName: island.tagName,
        modulePath: island.modulePath,
        isPackage: true,
        // #638: forward the named export so the client factory reads
        // mod[exportName] (UI package chunks dropped `export default`).
        exportName: island.exportName,
        strategy: resolveIslandHydrate(island.hydrate, upgradeStrategy),
        ...resolveIslandSsrDsd(island),
        reason: island.reason,
      }),
    ),
  ];
}
