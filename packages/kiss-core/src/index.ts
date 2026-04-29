/**
 * @kissjs/core - Main entry
 *
 * KISS Architecture = K·I·S·S (Knowledge · Isolated · Semantic · Static)
 * 融合 Jamstack 部署模型与声明式岛屿交互范式的全栈架构风格。
 *
 * K — Knowledge: 所有内容在构建时预渲染为语义 HTML 静态文件
 * I — Isolated: 客户端 JS 仅存在于 Island Web Component 的 Shadow DOM 内部
 * S — Semantic: 每个 Island 包裹原生 HTML 元素，DSD 让内容声明式可见
 * S — Static: 构建产物仅为纯静态文件，动态数据通过 API Routes（Hono + RPC）获取
 *
 * v0.3.0 Build Pipeline (no nested viteBuild in closeBundle):
 *   Phase 1: vite build          → SSR bundle + .kiss/build-metadata.json
 *   Phase 2: deno task build:client → client island chunks
 *   Phase 3: deno task build:ssg    → static HTML + post-process
 *
 * 插件组成（kiss() 返回的 Plugin[]）：
 *  1. kiss:core          — configResolved + buildStart（路由扫描 + 虚拟模块生成）
 *  2. kiss:virtual-entry  — 解析/加载 virtual:kiss-hono-entry 虚拟模块
 *  3. @hono/vite-dev-server — dev 模式（仅开发，不进入生产产物）
 *  4. island-transform     — AST 标记 (__island, __tagName)
 *  5. html-template        — transformIndexHtml（preload / meta / hydration）
 *  6. kiss:build           — 写出 .kiss/build-metadata.json
 */

import type { Plugin } from 'vite';
import type { FrameworkOptions, PackageIslandMeta, RouteEntry } from './types.js';

import { join } from 'node:path';
import process from 'node:process';

import { KissBuildContext } from './build-context.js';
import { islandTransformPlugin } from './island-transform.js';
import { htmlTemplatePlugin } from './html-template.js';
import { buildPlugin } from './build.js';
import { generateHonoEntryCode } from './hono-entry.js';
import { fileToTagName, scanIslands, scanPackageIslands, scanRoutes } from './route-scanner.js';

export type {
  FrameworkOptions,
  KissMiddleware,
  KissRenderer,
  PackageIslandMeta,
  RouteEntry,
  SpecialFileType,
  SsrContext,
} from './types.js';
export {
  ConflictError,
  ForbiddenError,
  HydrationError,
  KissError,
  NotFoundError,
  RateLimitError,
  SsrRenderError,
  UnauthorizedError,
  ValidationError,
} from './errors.js';
export { createSsrContext, extractParams, parseQuery } from './context.js';
export { renderSsrError, wrapInDocument } from './ssr-handler.js';
export {
  buildIslandChunkMap,
  injectClientScript,
  injectCspMeta,
  rewriteHtmlFiles,
} from './ssg-postprocess.js';
export { printBuildManifest, scanClientBuild, scanSSGOutput } from './build-manifest.js';
export type { ArtifactInfo, BuildManifest } from './build-manifest.js';
// generateHydrationScript was removed in v0.3.0 — hydration logic is now
// in the Vite-built client entry (entry-generators.ts::generateClientEntry).
// The inline <script> approach couldn't import @lit-labs/ssr-client
// (bare module specifier), and the inline hydrateElement() was not real
// Lit hydration (just DSD polyfill + removeAttribute).

// --- Re-export runtime APIs for zero-config user experience ---
// Users import everything from @kissjs/core — no need to add lit/hono to their deno.json
export { css, html, LitElement, nothing, svg } from 'lit';
export type { CSSResult, TemplateResult } from 'lit';
export { unsafeHTML } from 'lit/directives/unsafe-html.js';
export { classMap } from 'lit/directives/class-map.js';
export { styleMap } from 'lit/directives/style-map.js';
export { createRef, ref } from 'lit/directives/ref.js';
export { Hono } from 'hono';

// --- Hono 官方 Vite 插件（静态 import，package.json 已声明依赖）---
import honoDevServer from '@hono/vite-dev-server';

/**
 * KISS Framework Vite Plugin — KISS Architecture (K·I·S·S)
 * Knowledge · Isolated · Semantic · Static
 * Jamstack: M=SSG+DSD, A=API Routes, J=Islands
 *
 * v0.3.0: Build pipeline is split into 3 phases (no nested viteBuild).
 * kiss() only handles Phase 1 (dev + SSR bundle + metadata).
 */

export function kiss(options: FrameworkOptions = {}): Plugin[] {
  // Resolve headExtras: support both new inject option and legacy ui option
  let headExtras = options.headExtras;

  // New inject option: build headExtras from structured config
  if (options.inject && !headExtras) {
    const fragments: string[] = [];
    for (const href of options.inject.stylesheets || []) {
      // Escape URL to prevent attribute breakout in injected <link>
      const safeHref = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      fragments.push(`<link rel="stylesheet" href="${safeHref}" />`);
    }
    for (const src of options.inject.scripts || []) {
      // Escape URL to prevent attribute breakout in injected <script>
      const safeSrc = src.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      fragments.push(`<script type="module" src="${safeSrc}"></script>`);
    }
    for (const frag of options.inject.headFragments || []) {
      fragments.push(frag);
    }
    headExtras = fragments.join('\n  ');
  }

  // Legacy ui option: auto-generate WebAwesome CDN links
  if (options.ui?.cdn && !headExtras) {
    const version = options.ui.version || '3.5.0';
    const cdnBase = `https://ka-f.webawesome.com/webawesome@${version}`;
    headExtras = [
      `<link rel="stylesheet" href="${cdnBase}/styles/webawesome.css" />`,
      `<script type="module" src="${cdnBase}/webawesome.loader.js"></script>`,
    ].join('\n  ');
  }
  if (options.ui?.cdn && headExtras) {
    console.warn('[KISS] Both inject and ui.cdn options provided. ui.cdn is ignored in favor of inject.');
  }

  // Build the resolved options with defaults
  const resolvedOptions: FrameworkOptions = {
    ...options,
    routesDir: options.routesDir || 'app/routes',
    islandsDir: options.islandsDir || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    headExtras, // computed value takes precedence
  };

  // Shared build context — replaces all closure-captured mutable variables
  const ctx = new KissBuildContext(resolvedOptions);

  const VIRTUAL_ENTRY_ID = 'virtual:kiss-hono-entry';
  const RESOLVED_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID;

  function generateEntry(
    routes: RouteEntry[],
    islandTagNames: string[] = [],
    packageIslands: PackageIslandMeta[] = [],
  ): string {
    return generateHonoEntryCode(routes, {
      routesDir: resolvedOptions.routesDir,
      islandsDir: resolvedOptions.islandsDir,
      componentsDir: resolvedOptions.componentsDir,
      middleware: resolvedOptions.middleware,
      islandTagNames,
      packageIslands,
      headExtras: resolvedOptions.headExtras,
      html: resolvedOptions.html,
      hydrationStrategy: resolvedOptions.island?.hydrationStrategy || 'lazy',
    });
  }

  // --- 1. 核心插件：configResolved 同步扫描 + virtual module 提供 ---
  const corePlugin: Plugin = {
    name: 'kiss:core',

    config(userConfig) {
      if (userConfig.resolve?.alias) {
        ctx.userResolveAlias = userConfig.resolve.alias as
          | Record<string, string>
          | import('vite').Alias[];
      }
      return {
        build: {
          rollupOptions: {
            input: [VIRTUAL_ENTRY_ID],
          },
        },
      };
    },

    configResolved() {
      ctx.honoEntryCode = generateEntry([], ctx.islandTagNames, ctx.packageIslands);
    },

    async buildStart() {
      try {
        const routes = await scanRoutes(resolvedOptions.routesDir!);

        const islandsRoot = join(process.cwd(), resolvedOptions.islandsDir || 'app/islands');
        const islandFiles = await scanIslands(islandsRoot);
        ctx.islandTagNames = islandFiles.map((f) => fileToTagName(f));

        // Scan package islands if configured
        if (resolvedOptions.packageIslands && resolvedOptions.packageIslands.length > 0) {
          ctx.packageIslands = await scanPackageIslands(resolvedOptions.packageIslands);
          if (ctx.packageIslands.length > 0) {
            console.log(
              `[KISS] Package islands: ${ctx.packageIslands.map((i) => i.tagName).join(', ')}`,
            );
          }
        }

        ctx.honoEntryCode = generateEntry(routes, ctx.islandTagNames, ctx.packageIslands);
        const pageCount = routes.filter((r) => r.type === 'page' && !r.special).length;
        const apiCount = routes.filter((r) => r.type === 'api' && !r.special).length;
        const totalIslands = ctx.islandTagNames.length + ctx.packageIslands.length;
        console.log(
          `[KISS] Routes: ${pageCount} page(s), ${apiCount} API route(s), ` +
            `${totalIslands} island(s) — KISS Architecture`,
        );
      } catch (err) {
        // Route scanning failure is always fatal — empty builds should not pass CI
        throw new Error(
          `[KISS] Route scan failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
  };

  // --- 2. 虚拟模块：解析 ID + 提供代码 ---
  const virtualEntryPlugin: Plugin = {
    name: 'kiss:virtual-entry',

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID) return RESOLVED_ENTRY_ID;
    },

    load(id) {
      if (id === RESOLVED_ENTRY_ID) {
        return ctx.honoEntryCode || generateEntry([], ctx.islandTagNames, ctx.packageIslands);
      }
    },
  };

  // --- 3. @hono/vite-dev-server（dev 模式 only，不进入生产产物）---
  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  });

  // --- 组装插件数组 ---
  // v0.3.0: No more ssgPlugin with nested viteBuild/createServer.
  // Build pipeline: vite build (Phase 1) → build:client (Phase 2) → build:ssg (Phase 3)
  return [
    corePlugin, // configResolved + buildStart（路由扫描）
    virtualEntryPlugin, // virtual:kiss-hono-entry 提供器
    devServerPlugin, // dev 模式 Hono 服务器（仅开发）
    islandTransformPlugin(resolvedOptions.islandsDir!),
    // NOTE: htmlTemplatePlugin is currently a no-op (returns empty tags).
    // Kept as registration point for future per-route HTML injection (title/meta/preload).
    htmlTemplatePlugin(resolvedOptions),
    buildPlugin(resolvedOptions, ctx), // Phase 1: metadata 写出
  ];
}

export default kiss;
