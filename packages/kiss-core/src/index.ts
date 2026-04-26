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
 * Jamstack 对齐：
 *   M (Markup)     → K+S: SSG + DSD（零 JS 默认）
 *   A (APIs)       → S: API Routes（Hono，类型安全，Serverless）
 *   J (JavaScript) → I: Islands（Shadow DOM + lazy hydration）
 *
 * 插件组成（kiss() 返回的 Plugin[]）：
 *  1. kiss:core          — configResolved + buildStart（路由扫描 + 虚拟模块生成）
 *  2. kiss:virtual-entry  — 解析/加载 virtual:kiss-hono-entry 虚拟模块
 *  3. @hono/vite-dev-server — dev 模式（仅开发，不进入生产产物）
 *  4. island-transform     — AST 标记 (__island, __tagName)
 *  5. island-extractor     — 构建时 island 依赖分析
 *  6. html-template        — transformIndexHtml（preload / meta / hydration）
 *  7. kiss:ssg             — SSG 静态生成（closeBundle 阶段，K+S 约束的产物）
 *  8. kiss:build           — 客户端构建（仅 Islands，I 约束）
 */

import type { Plugin } from 'vite';
import type { FrameworkOptions, RouteEntry } from './types.js';

import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { KissBuildContext } from './build-context.js';
import { islandTransformPlugin } from './island-transform.js';
import { islandExtractorPlugin } from './island-extractor.js';
import { htmlTemplatePlugin } from './html-template.js';
import { buildPlugin } from './build.js';
import { generateHonoEntryCode } from './hono-entry.js';
import { fileToTagName, scanIslands, scanRoutes } from './route-scanner.js';

export type {
  FrameworkOptions,
  IslandMeta,
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
export { generateHydrationScript } from './island-transform.js';
export { getKnownIslandsMap } from './island-extractor.js';
export { logger } from './logger.js';

// --- Re-export runtime APIs for zero-config user experience ---
// Users import everything from @kissjs/core — no need to add lit/hono to their deno.json
export { css, html, LitElement, nothing, svg } from 'lit';
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
 * Architecture:
 *   All plugins share state through a KissBuildContext instance,
 *   which is created fresh per kiss() call (no module-level globals).
 *
 *   KISS Architecture: Production output is always static HTML files + optional Island JS.
 *   API Routes deploy separately as Serverless functions (S constraint).
 *   No SSR runtime in production (S constraint).
 *
 *   kiss() → creates KissBuildContext → passes it to all sub-plugins
 */

export function kiss(options: FrameworkOptions = {}): Plugin[] {
  // Resolve headExtras: support both new inject option and legacy ui option
  let headExtras = options.headExtras;

  // New inject option: build headExtras from structured config
  if (options.inject && !headExtras) {
    const fragments: string[] = [];
    for (const href of options.inject.stylesheets || []) {
      fragments.push(`<link rel="stylesheet" href="${href}" />`);
    }
    for (const src of options.inject.scripts || []) {
      fragments.push(`<script type="module" src="${src}"></script>`);
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

  function generateEntry(routes: RouteEntry[], islandTagNames: string[] = []): string {
    return generateHonoEntryCode(routes, {
      routesDir: resolvedOptions.routesDir,
      islandsDir: resolvedOptions.islandsDir,
      componentsDir: resolvedOptions.componentsDir,
      middleware: resolvedOptions.middleware,
      islandTagNames,
      headExtras: resolvedOptions.headExtras,
      html: resolvedOptions.html,
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
      ctx.honoEntryCode = generateEntry([], ctx.islandTagNames);
    },

    async buildStart() {
      try {
        const routes = await scanRoutes(resolvedOptions.routesDir!);

        const islandsRoot = join(process.cwd(), resolvedOptions.islandsDir || 'app/islands');
        const islandFiles = await scanIslands(islandsRoot);
        ctx.islandTagNames = islandFiles.map((f) => fileToTagName(f));

        ctx.honoEntryCode = generateEntry(routes, ctx.islandTagNames);
        const pageCount = routes.filter((r) => r.type === 'page' && !r.special).length;
        const apiCount = routes.filter((r) => r.type === 'api' && !r.special).length;
        console.log(
          `[KISS] Routes: ${pageCount} page(s), ${apiCount} API route(s), ` +
            `${ctx.islandTagNames.length} island(s) — KISS Architecture`,
        );
      } catch (err) {
        console.error('[KISS] Route scan failed:', err);
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
        return ctx.honoEntryCode || generateEntry([], ctx.islandTagNames);
      }
    },
  };

  // --- 3. @hono/vite-dev-server（dev 模式 only，不进入生产产物）---
  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  });

  // --- 4. 自定义 SSG 插件（KISS Architecture K+S 约束的产物生成器）---
  const ssgPlugin: Plugin = {
    name: 'kiss:ssg',
    apply: 'build',

    configResolved(config) {
      ctx.resolvedConfig = config;
    },

    async closeBundle() {
      const config = ctx.resolvedConfig;
      if (!config) return;

      const root = config.root;
      const outDir = config.build.outDir;

      // Generate SSG entry with DOM shim
      const routes = await scanRoutes(resolvedOptions.routesDir!);

      const islandsRoot = join(root, resolvedOptions.islandsDir || 'app/islands');
      const ssgIslandTagNames = ctx.islandTagNames.length > 0
        ? ctx.islandTagNames
        : (await scanIslands(islandsRoot)).map((f) => fileToTagName(f));

      const ssgEntryCode = generateHonoEntryCode(routes, {
        routesDir: resolvedOptions.routesDir,
        islandsDir: resolvedOptions.islandsDir,
        componentsDir: resolvedOptions.componentsDir,
        middleware: resolvedOptions.middleware,
        ssg: true, // inject DOM shim
        islandTagNames: ssgIslandTagNames,
        headExtras: resolvedOptions.headExtras,
        html: resolvedOptions.html,
      });

      // Write temp entry file to project's .kiss/ directory
      const KISS_SSG_ENTRY = '.kiss-ssg-entry.ts';
      const kissTmpDir = join(root, '.kiss');
      mkdirSync(kissTmpDir, { recursive: true });
      const tmpEntryPath = join(kissTmpDir, KISS_SSG_ENTRY);
      writeFileSync(tmpEntryPath, ssgEntryCode, 'utf-8');

      try {
        const { createServer } = await import('vite');
        // SSR noExternal: bundle @kissjs/ui, lit packages, and @lit-labs/ssr to avoid module resolution errors
        // Use regex patterns to match all lit-related packages
        const defaultNoExternal = [
          // Match all lit ecosystem packages (must be bundled to avoid decorator errors)
          /^lit/,
          /^@lit/,
          /^@kissjs\/ui/,
        ];
        // Add user-provided noExternal
        const userNoExternal = resolvedOptions.ssr?.noExternal || [];
        const allNoExternal = [...defaultNoExternal, ...userNoExternal];
        // If there's an alias for @kissjs/ui, add the resolved path too
        const alias = ctx.userResolveAlias;
        if (alias) {
          if (Array.isArray(alias)) {
            // Vite Alias[] format: { find: string, replacement: string }
            for (const a of alias) {
              if (a.find === '@kissjs/ui') {
                allNoExternal.push(a.replacement);
              }
            }
          } else {
            // Record<string, string> format
            if ('@kissjs/ui' in alias) {
              allNoExternal.push(alias['@kissjs/ui']);
            }
          }
        }
        const server = await createServer({
          configFile: false,
          root,
          server: { middlewareMode: true },
          appType: 'custom',
          build: { ssr: true },
          ssr: {
            // Bundle lit ecosystem packages and @kissjs/ui to avoid decorator errors
            // Includes user-provided noExternal
            noExternal: allNoExternal,
          },
          // Configure esbuild to support TC39 decorators used by Lit
          esbuild: {
            // Use 'decorators-legacy' to support experimental decorators
            // Lit uses experimental decorators, not TC39 decorators
            tsconfigRaw: {
              compilerOptions: {
                experimentalDecorators: true,
                useDefineForClassFields: false,
              },
            },
          },
          plugins: [],
          resolve: {
            preserveSymlinks: true,
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
            alias: alias || undefined,
          },
        });

        try {
          const module = await server.ssrLoadModule(tmpEntryPath);
          const app = module.default;

          if (!app) {
            throw new Error(`[KISS SSG] Failed to load Hono app from ${KISS_SSG_ENTRY}`);
          }

          const { toSSG } = await import('hono/ssg');
          const nodeFs = await import('node:fs');
          const nodePath = await import('node:path');

          const fsModule = {
            writeFile: (path: string, data: string | Uint8Array) => {
              const dir = nodePath.dirname(path);
              if (!nodeFs.existsSync(dir)) {
                nodeFs.mkdirSync(dir, { recursive: true });
              }
              nodeFs.writeFileSync(path, data);
            },
            mkdir: (path: string) => {
              if (!nodeFs.existsSync(path)) {
                nodeFs.mkdirSync(path, { recursive: true });
              }
            },
            isDirectory: (path: string) => {
              try {
                return nodeFs.statSync(path).isDirectory();
              } catch {
                return false;
              }
            },
          };

          const outputDir = join(root, outDir);
          const result = await toSSG(app, fsModule, { dir: outputDir });

          if (!result.success) {
            throw result.error;
          }

          console.log(
            `[KISS SSG] KISS Architecture: Static site generated → ${join(root, outDir)}`,
          );

          // Post-process: rewrite Island hydration paths from source to built chunks
          // This must happen AFTER client build (kiss:build) has produced the JS files
          // and AFTER SSG has generated the HTML files.
          const { buildIslandChunkMap, rewriteHtmlFiles } = await import('./ssg-postprocess.js');
          const basePath = ctx.resolvedConfig?.base || '/';
          const islandChunkMap = buildIslandChunkMap(root, outDir, ctx.islandTagNames, basePath);
          if (Object.keys(islandChunkMap).length > 0) {
            rewriteHtmlFiles(outputDir, islandChunkMap);
          }
        } finally {
          await server.close();
        }
      } catch (err) {
        console.error('[KISS SSG] Failed:', err);
      } finally {
        try {
          unlinkSync(tmpEntryPath);
        } catch { /* ignore */ }
      }
    },
  };

  // --- 组装插件数组 ---
  // CRITICAL ORDER: kiss:build must run BEFORE kiss:ssg in closeBundle
  // because client build compiles Island JS, then SSG generates HTML,
  // then post-processing rewrites Island paths in HTML.
  return [
    corePlugin, // configResolved + buildStart（路由扫描）
    virtualEntryPlugin, // virtual:kiss-hono-entry 提供器
    devServerPlugin, // dev 模式 Hono 服务器（仅开发）
    islandTransformPlugin(resolvedOptions.islandsDir!),
    islandExtractorPlugin(resolvedOptions),
    htmlTemplatePlugin(resolvedOptions),
    buildPlugin(resolvedOptions, ctx), // 客户端构建（仅 Islands，I 约束）— 先于 SSG
    ssgPlugin, // SSG 静态生成（K+S 约束产物）+ 路径重写
  ];
}

export default kiss;
