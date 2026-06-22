import type { IsrCacheEntry, IsrCacheResult } from '@openelement/protocol/isr';
import type { IsrManifestEntry } from '@openelement/protocol/framework';
import type { MemoryIsrCache } from './isr.js';

export type IsrRuntimeState = IsrCacheResult['state'] | 'not-found';

export interface IsrRuntimeRenderResult {
  html: string;
  headers?: Record<string, string>;
}

export interface IsrRuntimeRenderContext {
  entry: IsrManifestEntry;
  request?: Request;
}

export interface IsrRuntimeOptions {
  manifest: IsrManifestEntry[];
  cache: MemoryIsrCache;
  render: (
    path: string,
    context: IsrRuntimeRenderContext,
  ) => Promise<IsrRuntimeRenderResult> | IsrRuntimeRenderResult;
  now?: () => number;
  regenerate?: 'blocking' | 'background';
  onRegenerateError?: (error: unknown, entry: IsrManifestEntry) => void;
  schedule?: (task: Promise<void>) => void;
}

export interface IsrRuntimeResult {
  state: IsrRuntimeState;
  entry?: IsrManifestEntry;
  response: Response;
}

export function findIsrManifestEntry(
  manifest: IsrManifestEntry[],
  path: string,
  params: Record<string, string> = {},
): IsrManifestEntry | undefined {
  const paramEntries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return manifest.find((entry) => {
    if (entry.path !== path) return false;
    const entryParams = Object.entries(entry.params).sort(([a], [b]) => a.localeCompare(b));
    if (entryParams.length !== paramEntries.length) return false;
    return entryParams.every(([key, value], index) => {
      const [otherKey, otherValue] = paramEntries[index];
      return key === otherKey && value === otherValue;
    });
  });
}

export async function renderIsrResponse(
  path: string,
  params: Record<string, string>,
  options: IsrRuntimeOptions,
  request?: Request,
): Promise<IsrRuntimeResult> {
  const entry = findIsrManifestEntry(options.manifest, path, params);
  if (!entry) {
    return {
      state: 'not-found',
      response: new Response('Not found', { status: 404 }),
    };
  }

  const now = options.now?.() ?? Date.now();
  const cached = await options.cache.get(entry.cacheKey, now);
  if (cached.state === 'hit' && cached.entry) {
    return {
      state: 'hit',
      entry,
      response: responseFromCacheEntry(cached.entry, 'hit'),
    };
  }

  if (cached.state === 'stale' && cached.entry) {
    const regenerate = regenerateEntry(entry, options, request, now);
    if (options.regenerate === 'background') {
      options.schedule?.(regenerate);
      if (!options.schedule) regenerate.catch((error) => options.onRegenerateError?.(error, entry));
      return {
        state: 'stale',
        entry,
        response: responseFromCacheEntry(cached.entry, 'stale'),
      };
    }
    await regenerate;
    const refreshed = await options.cache.get(entry.cacheKey, options.now?.() ?? Date.now());
    return {
      state: 'stale',
      entry,
      response: refreshed.entry
        ? responseFromCacheEntry(refreshed.entry, 'stale')
        : responseFromCacheEntry(cached.entry, 'stale'),
    };
  }

  if (cached.state === 'error') {
    return {
      state: 'error',
      entry,
      response: new Response('ISR cache error', { status: 500 }),
    };
  }

  const rendered = await renderAndStore(entry, options, request, now);
  return {
    state: 'miss',
    entry,
    response: responseFromCacheEntry(rendered, 'miss'),
  };
}

async function regenerateEntry(
  entry: IsrManifestEntry,
  options: IsrRuntimeOptions,
  request: Request | undefined,
  now: number,
): Promise<void> {
  try {
    await renderAndStore(entry, options, request, now);
  } catch (error) {
    options.onRegenerateError?.(error, entry);
    throw error;
  }
}

async function renderAndStore(
  entry: IsrManifestEntry,
  options: IsrRuntimeOptions,
  request: Request | undefined,
  now: number,
): Promise<IsrCacheEntry> {
  const result = await options.render(entry.path, { entry, request });
  const cacheEntry: IsrCacheEntry = {
    html: result.html,
    headers: result.headers,
    createdAt: now,
    revalidate: entry.revalidate,
  };
  await options.cache.set(entry.cacheKey, cacheEntry);
  return cacheEntry;
}

function responseFromCacheEntry(entry: IsrCacheEntry, state: IsrCacheResult['state']): Response {
  const headers = new Headers(entry.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'text/html; charset=utf-8');
  }
  headers.set('x-openelement-isr', state);
  return new Response(entry.html, { headers });
}
