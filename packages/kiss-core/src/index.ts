/**
 * @kissjs/core - Main entry
 *
 * KISS = 1 个 Vite 插件，连接 Hono + Lit + Vite。
 * 设计参考 honox，但渲染引擎固定为 Lit / Web Components。
 *
 * 使用方式：
 * ```ts
 * // vite.config.ts
 * import { kiss } from '@kiss/core'
 * export default defineConfig({ plugins: [kiss()] })
 * ```
 *
 * 插件组成（kiss() 返回的 Plugin[]）：
 *  1. kiss:core          — configResolved + buildStart（路由扫描 + 虚拟模块生成）
 *  2. kiss:virtual-entry  — 解析/加载 virtual:kiss-hono-entry 虚拟模块
 *  3. @hono/vite-dev-server — dev 模式（读取 virtual:kiss-hono-entry）
 *  4. island-transform     — AST 标记 (__island, __tagName)
 *  5. island-extractor     — 构建时 island 依赖分析
 *  6. html-template        — transformIndexHtml（preload / meta / hydration）
 *  7. kiss:ssg             — SSG 静态生成（closeBundle 阶段）
 *  8. kiss:build           — 双端构建（SSR + Client）
 */

import type { Plugin } from 'vite'
import type { FrameworkOptions, RouteEntry } from './types.js'

import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

import { KissBuildContext } from './build-context.js'
import { islandTransformPlugin } from './island-transform.js'
import { islandExtractorPlugin } from './island-extractor.js'
import { htmlTemplatePlugin } from './html-template.js'
import { buildPlugin } from './build.js'
import { generateHonoEntryCode } from './hono-entry.js'
import { scanRoutes, scanIslands, fileToTagName } from './route-scanner.js'

export type {
  FrameworkOptions, RouteEntry, IslandMeta, SsrContext, SpecialFileType,
} from './types.js'
export {
  KissError, NotFoundError, UnauthorizedError, ForbiddenError,
  ValidationError, ConflictError, RateLimitError, SsrRenderError, HydrationError,
} from './errors.js'
export { createSsrContext, extractParams, parseQuery } from './context.js'
export { collectIslands, renderSsrError, wrapInDocument } from './ssr-handler.js'
export { generateHydrationScript } from './island-transform.js'
export { getKnownIslandsMap } from './island-extractor.js'

// --- Re-export runtime APIs for zero-config user experience ---
// Users import everything from @kissjs/core — no need to add lit/hono to their deno.json
export { LitElement, html, css, nothing, svg } from 'lit'
export { unsafeHTML } from 'lit/directives/unsafe-html.js'
export { classMap } from 'lit/directives/class-map.js'
export { styleMap } from 'lit/directives/style-map.js'
export { ref, createRef } from 'lit/directives/ref.js'
export { Hono } from 'hono'

// --- Hono 官方 Vite 插件（静态 import，package.json 已声明依赖）---
import honoDevServer from '@hono/vite-dev-server'
// @hono/vite-ssg 不再直接使用——SSG 由 kiss:ssg 自定义插件实现
// 但保留依赖声明以便用户使用 hono/ssg

/**
 * KISS Framework Vite Plugin
 *
 * Architecture:
 *   All plugins share state through a KissBuildContext instance,
 *   which is created fresh per kiss() call (no module-level globals).
 *
 *   kiss() → creates KissBuildContext → passes it to all sub-plugins
 *
 *   Time sequence:
 *     configResolved (minimal fallback entry) → virtual module has content
 *     buildStart (async scan routes, regenerate entry) → real routes ready
 *     configureServer (dev server middleware) → entry already updated by buildStart
 *     first request → ssrLoadModule loads virtual module → gets latest entry
 */

export function kiss(options: FrameworkOptions = {}): Plugin[] {
  // Auto-generate headExtras from ui.cdn option
  let headExtras = options.headExtras
  if (options.ui?.cdn && !headExtras) {
    const version = options.ui.version || '3.5.0'
    const cdnBase = `https://ka-f.webawesome.com/webawesome@${version}`
    headExtras = [
      `<link rel="stylesheet" href="${cdnBase}/styles/webawesome.css" />`,
      `<script type="module" src="${cdnBase}/webawesome.loader.js"></script>`,
    ].join('\n  ')
  }

  // Build the resolved options with defaults
  const resolvedOptions: FrameworkOptions = {
    ...options,
    routesDir:     options.routesDir     || 'app/routes',
    islandsDir:    options.islandsDir    || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    headExtras,    // computed value takes precedence (auto-generated from ui.cdn or user-provided)
  }

  // Shared build context — replaces all closure-captured mutable variables
  const ctx = new KissBuildContext(resolvedOptions)

  const VIRTUAL_ENTRY_ID   = 'virtual:kiss-hono-entry'
  const RESOLVED_ENTRY_ID  = '\0' + VIRTUAL_ENTRY_ID

  function generateEntry(routes: RouteEntry[], islandTagNames: string[] = []): string {
    return generateHonoEntryCode(routes, {
      routesDir:     resolvedOptions.routesDir,
      islandsDir:    resolvedOptions.islandsDir,
      componentsDir: resolvedOptions.componentsDir,
      middleware:    resolvedOptions.middleware,
      islandTagNames,
      headExtras:    resolvedOptions.headExtras,
      html:          resolvedOptions.html,
    })
  }

  // --- 1. 核心插件：configResolved 同步扫描 + virtual module 提供 ---
  const corePlugin: Plugin = {
    name: 'kiss:core',

    config() {
      return {
        build: {
          rollupOptions: {
            input: [VIRTUAL_ENTRY_ID],
          },
        },
      }
    },

    configResolved() {
      // Generate minimal fallback entry (all routes return 404)
      // Real routes are scanned in buildStart (async) and regenerated.
      // @hono/vite-dev-server lazy-loads entry (ssrLoadModule on first request),
      // so buildStart always completes before the first request.
      ctx.honoEntryCode = generateEntry([], ctx.islandTagNames)
    },

    async buildStart() {
      // Async re-scan (catch changes missed during configResolved)
      // Also scan islands directory
      try {
        const routes = await scanRoutes(resolvedOptions.routesDir!)

        // Scan islands directory for known island tag names
        const islandsRoot = join(process.cwd(), resolvedOptions.islandsDir || 'app/islands')
        const islandFiles = await scanIslands(islandsRoot)
        ctx.islandTagNames = islandFiles.map(f => fileToTagName(f))

        ctx.honoEntryCode = generateEntry(routes, ctx.islandTagNames)
        const pageCount = routes.filter(r => r.type === 'page' && !r.special).length
        const apiCount  = routes.filter(r => r.type === 'api'  && !r.special).length
        console.log(
          `[KISS] Routes confirmed: ${pageCount} page(s), ${apiCount} API route(s), ` +
          `${ctx.islandTagNames.length} island(s) — Hono entry (${ctx.honoEntryCode.length} bytes)`,
        )
      } catch (err) {
        console.error('[KISS] Async route scan failed:', err)
      }
    },
  }

  // --- 2. 虚拟模块：解析 ID + 提供代码 ---
  const virtualEntryPlugin: Plugin = {
    name: 'kiss:virtual-entry',

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID) return RESOLVED_ENTRY_ID
    },

    load(id) {
      if (id === RESOLVED_ENTRY_ID) {
        return ctx.honoEntryCode || generateEntry([], ctx.islandTagNames)
      }
    },
  }

  // --- 3. @hono/vite-dev-server（dev 模式）---
  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  }) as unknown as Plugin

  // --- 4. 自定义 SSG 插件（替代 @hono/vite-ssg）---
  const ssgPlugin: Plugin = {
    name: 'kiss:ssg',
    apply: 'build',

    configResolved(config) {
      ctx.resolvedConfig = config
    },

    async closeBundle() {
      const config = ctx.resolvedConfig
      if (!config) return

      const root = config.root
      const outDir = config.build.outDir

      // Generate SSG entry with DOM shim
      const routes = await scanRoutes(resolvedOptions.routesDir!)

      // Scan islands for SSG entry too
      const islandsRoot = join(root, resolvedOptions.islandsDir || 'app/islands')
      const ssgIslandFiles = await scanIslands(islandsRoot)
      const ssgIslandTagNames = ssgIslandFiles.map(f => fileToTagName(f))

      const ssgEntryCode = generateHonoEntryCode(routes, {
        routesDir: resolvedOptions.routesDir,
        islandsDir: resolvedOptions.islandsDir,
        componentsDir: resolvedOptions.componentsDir,
        middleware: resolvedOptions.middleware,
        ssg: true,  // inject DOM shim
        islandTagNames: ssgIslandTagNames,
        headExtras: resolvedOptions.headExtras,
        html: resolvedOptions.html,
      })

      // Write temp entry file to project's .kiss/ directory
      const KISS_SSG_ENTRY = '.kiss-ssg-entry.ts'
      const kissTmpDir = join(root, '.kiss')
      mkdirSync(kissTmpDir, { recursive: true })
      const tmpEntryPath = join(kissTmpDir, KISS_SSG_ENTRY)
      writeFileSync(tmpEntryPath, ssgEntryCode, 'utf-8')

      try {
        const { createServer } = await import('vite')
        const server = await createServer({
          configFile: false,
          root,
          server: { middlewareMode: true },
          appType: 'custom',
          build: { ssr: true },
          plugins: [],
          resolve: {
            preserveSymlinks: true,
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
            alias: config.resolve?.alias || [],
          },
        })

        try {
          const module = await server.ssrLoadModule(tmpEntryPath)
          const app = module.default

          if (!app) {
            throw new Error(`[KISS SSG] Failed to load Hono app from ${KISS_SSG_ENTRY}`)
          }

          const { toSSG } = await import('hono/ssg')
          const nodeFs = await import('node:fs')
          const nodePath = await import('node:path')

          const fsModule = {
            writeFile: async (path: string, data: string | Uint8Array) => {
              const dir = nodePath.dirname(path)
              if (!nodeFs.existsSync(dir)) {
                nodeFs.mkdirSync(dir, { recursive: true })
              }
              nodeFs.writeFileSync(path, data)
            },
            mkdir: async (path: string) => {
              if (!nodeFs.existsSync(path)) {
                nodeFs.mkdirSync(path, { recursive: true })
              }
            },
            isDirectory: async (path: string) => {
              try {
                return nodeFs.statSync(path).isDirectory()
              } catch {
                return false
              }
            },
          }

          const outputDir = join(root, outDir)
          const result = await toSSG(app, fsModule, { dir: outputDir })

          if (!result.success) {
            throw result.error
          }

          console.log(`[KISS SSG] Static site generated → ${join(root, outDir)}`)
        } finally {
          await server.close()
        }
      } catch (err) {
        console.error('[KISS SSG] Failed:', err)
      } finally {
        try {
          unlinkSync(tmpEntryPath)
        } catch { /* ignore */ }
      }
    },
  }

  // --- 组装插件数组 ---
  return [
    corePlugin,               // configResolved + buildStart（路由扫描）
    virtualEntryPlugin,       // virtual:kiss-hono-entry 提供器
    devServerPlugin,          // dev 模式 Hono 服务器
    islandTransformPlugin(resolvedOptions.islandsDir!),
    islandExtractorPlugin(resolvedOptions),
    htmlTemplatePlugin(resolvedOptions),
    ssgPlugin,                // SSG 静态生成
    buildPlugin(resolvedOptions, ctx),
  ]
}

export default kiss
