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

import type { Plugin, ResolvedConfig } from 'vite'
import type { FrameworkOptions, RouteEntry } from './types.js'

import { writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

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
 * 架构说明：
 *   kiss() 在 configResolved 钩子中生成最小化 Hono app（404 兜底），
 *   在 buildStart（async）中扫描真实 routes 并重新生成完整的 Hono entry 代码，
 *   写入 virtual:kiss-hono-entry 虚拟模块。
 *
 *   @hono/vite-dev-server 和 @hono/vite-ssg 都以
 *   virtual:kiss-hono-entry 作为 entry，
 *   运行时通过 Vite ssrLoadModule 懒加载该虚拟模块，拿到 Hono app。
 *
 *   时序保证：
 *     configResolved（生成最小 entry）→ 虚拟模块有兜底内容
 *     buildStart（异步扫描 routes，重新生成 entry）→ 真实路由就绪
 *     configureServer（dev server 中间件注册）→ 此时 entry 已被 buildStart 更新
 *     首次请求到达 → ssrLoadModule 加载虚拟模块 → 拿到最新 entry 代码
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

  const resolvedOptions: FrameworkOptions = {
    ...options,
    routesDir:     options.routesDir     || 'app/routes',
    islandsDir:    options.islandsDir    || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    headExtras,    // computed value takes precedence (auto-generated from ui.cdn or user-provided)
  }

  const VIRTUAL_ENTRY_ID   = 'virtual:kiss-hono-entry'
  const RESOLVED_ENTRY_ID  = '\0' + VIRTUAL_ENTRY_ID

  // --- 在 configResolved 时生成（同步），保证 dev server 启动前就绪 ---
  let honoEntryCode = ''
  let scannedIslandTagNames: string[] = []

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
      // Override Vite's default build config:
      // - Disable index.html as entry (we use virtual:kiss-hono-entry)
      // - Set library mode with our virtual entry as input
      return {
        build: {
          rollupOptions: {
            input: [VIRTUAL_ENTRY_ID],
          },
        },
      }
    },

    configResolved(config) {
      // 生成最小兜底 entry（所有路由返回 404）
      // 真实 routes 在 buildStart（async）里扫描并重新生成，
      // @hono/vite-dev-server 懒加载 entry（首次请求时才 ssrLoadModule），
      // 所以 buildStart 一定在首次请求前执行完毕。
      honoEntryCode = generateEntry([], scannedIslandTagNames)
    },

    async buildStart() {
      // 异步重新扫描（捕获 configResolved 时可能遗漏的变化）
      // 同时扫描 islands 目录
      try {
        const routes     = await scanRoutes(resolvedOptions.routesDir!)

        // Scan islands directory for known island tag names
        const islandsRoot = join(process.cwd(), resolvedOptions.islandsDir || 'app/islands')
        const islandFiles = await scanIslands(islandsRoot)
        scannedIslandTagNames = islandFiles.map(f => fileToTagName(f))

        honoEntryCode    = generateEntry(routes, scannedIslandTagNames)
        const pageCount  = routes.filter(r => r.type === 'page' && !r.special).length
        const apiCount   = routes.filter(r => r.type === 'api'  && !r.special).length
        console.log(
          `[KISS] Routes confirmed: ${pageCount} page(s), ${apiCount} API route(s), ` +
          `${scannedIslandTagNames.length} island(s) — Hono entry (${honoEntryCode.length} bytes)`,
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
        return honoEntryCode || generateEntry([], scannedIslandTagNames)
      }
    },
  }

  // --- 3. @hono/vite-dev-server（dev 模式）---
  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  }) as unknown as Plugin

  // --- 4. 自定义 SSG 插件（替代 @hono/vite-ssg）---
  // @hono/vite-ssg 在 generateBundle 中创建新 Vite server（空插件），
  // 导致 virtual:kiss-hono-entry 无法解析，路由模块也无法加载。
  //
  // 我们的方案：在 closeBundle 阶段（构建完成后），
  // 1. 生成带 DOM shim 的 SSG entry（真实 .ts 文件）
  // 2. 创建 Vite SSR server（configFile: false 防止递归加载用户 vite.config）
  // 3. 加载 entry → 拿到 Hono app → 用 hono/ssg toSSG 生成静态文件
  // 4. 写入 dist/ 目录

  let resolvedConfig: ResolvedConfig

  const ssgPlugin: Plugin = {
    name: 'kiss:ssg',
    apply: 'build',

    configResolved(config) {
      resolvedConfig = config
    },

    async closeBundle() {
      const root = resolvedConfig.root
      const outDir = resolvedConfig.build.outDir

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

      // Write temp entry file to project's .kiss/ directory (not tempdir).
      // The entry MUST be under the project root so Vite SSR can resolve
      // bare imports (e.g. @lit-labs/ssr) from the project's node_modules.
      // Temp directories are outside the project root, causing module resolution failures.
      const KISS_SSG_ENTRY = '.kiss-ssg-entry.ts'
      const kissTmpDir = join(root, '.kiss')
      mkdirSync(kissTmpDir, { recursive: true })
      const tmpEntryPath = join(kissTmpDir, KISS_SSG_ENTRY)
      writeFileSync(tmpEntryPath, ssgEntryCode, 'utf-8')

      try {
        // Create Vite SSR server — CRITICAL: configFile: false
        // Prevents loading user's vite.config.ts (which contains kiss()),
        // avoiding infinite recursive plugin loading.
        // Vite still resolves bare imports from node_modules via root.
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
            // Preserve user's resolve.alias (e.g. '@kissjs/core' → runtime shim)
            // so SSG can resolve the same bare specifiers as the main build.
            alias: resolvedConfig.resolve?.alias || [],
          },
        })

        try {
          // Load the SSG entry module (absolute path since file is in tmpdir)
          const module = await server.ssrLoadModule(tmpEntryPath)
          const app = module.default

          if (!app) {
            throw new Error(`[KISS SSG] Failed to load Hono app from ${KISS_SSG_ENTRY}`)
          }

          // Use hono/ssg to generate static files
          const { toSSG } = await import('hono/ssg')
          const nodeFs = await import('node:fs')
          const nodePath = await import('node:path')

          // FileSystemModule adapter for hono/ssg
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

          const result = await toSSG(app, fsModule, {
            dir: outputDir,
          })

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
      // Clean up temp file
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
    buildPlugin(resolvedOptions),
  ]
}

export default kiss
