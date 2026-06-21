/**
 * SSG engine contracts.
 *
 * Runtime-free data contracts consumed by the SSG engine and build adapters.
 * These types keep the SSG engine adapter-agnostic: the engine depends on
 * core and router, never on Vite or adapter-vite.
 *
 * This module is zero-dependency — it imports nothing outside SSG itself.
 */

import type { HydrationStrategy } from '@openelement/core';

// ─── Concurrency types ───────────────────────────────────────

/** A single page to be rendered during SSG. */
export interface SsgPageInput {
  /** Route path (e.g. '/about', '/blog/hello') */
  path: string;
  /** Route params (e.g. { slug: 'hello' }) */
  params?: Record<string, string>;
}

/** Result of rendering a single page through the concurrency helper. */
export interface ParallelRenderPageOutput {
  path: string;
  html: string;
  durationMs: number;
  error?: string;
}

/** Options for parallel SSG rendering. */
export interface ParallelRenderOptions {
  /** Pages to render. */
  pages: SsgPageInput[];
  /** Render function called for each page. */
  renderPage: (page: SsgPageInput) => Promise<string>;
  /** Number of concurrent workers. Defaults to hardware concurrency or 4. */
  concurrency?: number;
}

/** Summary of a parallel render run. */
export interface ParallelRenderResult {
  pages: ParallelRenderPageOutput[];
  totalDurationMs: number;
  successCount: number;
  errorCount: number;
}

// ─── SSG render pipeline options ─────────────────────────────

/** Options passed to the shared SSG render pipeline. */
export interface SsgRenderOptions {
  root: string;
  outDir: string;
  base?: string;
  headExtras?: string;
  html?: { lang?: string; title?: string };
  middleware?: {
    csp?: { policy?: string; reportOnly?: boolean; nonce?: boolean };
  };
  upgradeStrategy?: string;
  viewTransition?: boolean;
  speculation?: boolean | Record<string, unknown>;
  islandTagNames?: string[];
  routesDir?: string;
}

/** Island declaration shape used in SSG render evidence reports. */
export interface SsgIslandDeclForReport {
  tagName: string;
  hydrate?: HydrationStrategy | string;
  dsd?: boolean;
}

// ─── External resolver types ─────────────────────────────────

/** Manifest produced by Deno dependency pre-resolution. */
export interface ExternalManifest {
  /** Complete list of bare specifiers to mark as external. */
  specifiers: string[];
  /** Redirect map (bare specifier to npm: URL) for importmap generation. */
  importMap: Record<string, string>;
  /** ISO timestamp of generation. */
  generatedAt: string;
  /** SHA-256 hash prefix of deno.lock at time of generation. */
  lockHash: string;
}

// ─── Entry generator types ───────────────────────────────────

/** Client island entry shape passed to entry generator. */
export interface ClientIslandEntry {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  strategy: HydrationStrategy;
  strategySource?: 'default' | 'manifest' | 'component' | 'route';
  ssr?: boolean;
  dsd?: boolean;
  reason?: string;
}
