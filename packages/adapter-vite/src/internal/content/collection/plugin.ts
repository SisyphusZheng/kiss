import { createLogger, formatError } from '@openelement/element';
import { join, relative, resolve } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import type { OpenElementBuildContextLike } from '../../protocol/framework.ts';
import { DEFAULT_DATA_DIR } from '../../paths.ts';
import type { FileSystemAdapter } from '../fs-adapter.ts';
import { nodeFsAdapter } from '../fs-adapter.ts';
import { loadCollectionData, writeCollectionDataModule } from './data.ts';
import type { CollectionOptions } from './types.ts';

export interface CollectionPluginCompatibility {
  dataModule?: (entries: Awaited<ReturnType<typeof loadCollectionData>>) => string;
  prepareEntries?: (
    entries: Awaited<ReturnType<typeof loadCollectionData>>,
  ) => Awaited<ReturnType<typeof loadCollectionData>>;
  outputName?: string;
  contextKey?: string;
  itemLabel?: string;
}

/** Create the Vite plugin that loads one content collection into a generated data module. */
export function createCollectionPlugin(
  name: string,
  options: CollectionOptions,
  ctx?: OpenElementBuildContextLike,
  fs: FileSystemAdapter = nodeFsAdapter,
  compatibility: CollectionPluginCompatibility = {},
): Plugin {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(`Invalid content collection name: ${name}`);
  }
  const log = createLogger(`content:${name}`);
  const outputName = compatibility.outputName ?? `_generated-${name}-data.ts`;
  const dataFile = () => join(fs.cwd(), DEFAULT_DATA_DIR, outputName);

  async function regenerate(): Promise<number> {
    const loaded = await loadCollectionData(name, options);
    const entries = compatibility.prepareEntries?.(loaded) ?? loaded;
    fs.mkdirSync(join(fs.cwd(), DEFAULT_DATA_DIR), { recursive: true });
    const module = compatibility.dataModule?.(entries) ??
      writeCollectionDataModule(name, entries, options);
    fs.writeFileSync(dataFile(), module, 'utf-8');
    log.info(`wrote ${outputName} (${entries.length} ${compatibility.itemLabel ?? 'item'}(s))`);
    return entries.length;
  }

  return {
    name: `open:content:${name}`,
    async buildStart() {
      const count = await regenerate();
      log.info(`${count} ${compatibility.itemLabel ?? 'item'}(s) found in ${options.contentDir}`);
      if (ctx) {
        ctx.registerPlugin(compatibility.contextKey ?? `${name}CollectionOptions`, {
          contentDir: options.contentDir,
          basePath: options.basePath,
        });
      }
    },
    configureServer(server: ViteDevServer) {
      const absoluteContentDir = resolve(server.config.root, options.contentDir);
      server.watcher.add(absoluteContentDir);
      const invalidate = (file: string) => {
        if (!file.startsWith(absoluteContentDir)) return;
        if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;
        log.info(`Content changed: ${relative(server.config.root, file)} - regenerating data`);
        regenerate().then(() => {
          const mod = server.moduleGraph.getModuleById(dataFile());
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.hot.send({ type: 'full-reload' });
        }).catch((error: unknown) => log.error(`data regeneration failed: ${formatError(error)}`));
      };
      server.watcher.on('change', invalidate);
      server.watcher.on('add', invalidate);
      server.watcher.on('unlink', invalidate);
      server.httpServer?.on('close', () => {
        server.watcher.off('change', invalidate);
        server.watcher.off('add', invalidate);
        server.watcher.off('unlink', invalidate);
      });
    },
  };
}
