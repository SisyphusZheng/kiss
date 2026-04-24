/**
 * @kiss/core - Main entry
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
 *  1. kiss:config-resolved  — 扫描 routes，生成 virtual:kiss-hono-entry 代码
 *  2. kiss:virtual-entry    — 解析/加载 virtual:kiss-hono-entry 虚拟模块
 *  3. @hono/vite-dev-server — dev 模式（读取 virtual:kiss-hono-entry）
 *  4. island-transform       — AST 标记 (__island, __tagName)
 *  5. island-extractor      — 构建时 island 依赖分析
 *  6. html-template         — transformIndexHtml（preload / meta / hydration）
 *  7. @hono/vite-ssg        — SSG 构建（读取 virtual:kiss-hono-entry）
 *  8. build                 — 双端构建（SSR + Client）
 */

import type { Plugin, ResolvedConfig } from 'vite'
import type { FrameworkOptions, RouteEntry } from './types.js'

import { islandTransformPlugin } from './island-transform.js'
import { islandExtractorPlugin } from './island-extractor.js'
import { htmlTemplatePlugin } from './html-template.js'
import { buildPlugin } from './build.js'
import { generateHonoEntryCode } from './hono-entry.js'
import { scanRoutes } from './route-scanner.js'

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

// --- Hono 官方 Vite 插件（静态 import，package.json 已声明依赖）---
import honoDevServer from '@hono/vite-dev-server'
import honoSsg       from '@hono/vite-ssg'

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
  const resolvedOptions: FrameworkOptions = {
    routesDir:     options.routesDir     || 'app/routes',
    islandsDir:    options.islandsDir    || 'app/islands',
    componentsDir: options.componentsDir || 'app/components',
    ...options,
  }

  const VIRTUAL_ENTRY_ID   = 'virtual:kiss-hono-entry'
  const RESOLVED_ENTRY_ID  = '\0' + VIRTUAL_ENTRY_ID

  // --- 在 configResolved 时生成（同步），保证 dev server 启动前就绪 ---
  let honoEntryCode = ''

  function generateEntry(routes: RouteEntry[]): string {
    return generateHonoEntryCode(routes, {
      routesDir:     resolvedOptions.routesDir,
      componentsDir: resolvedOptions.componentsDir,
    })
  }

  // --- 1. 核心插件：configResolved 同步扫描 + virtual module 提供 ---
  const corePlugin: Plugin = {
    name: 'kiss:core',

    configResolved(config) {
      // 生成最小兜底 entry（所有路由返回 404）
      // 真实 routes 在 buildStart（async）里扫描并重新生成，
      // @hono/vite-dev-server 懒加载 entry（首次请求时才 ssrLoadModule），
      // 所以 buildStart 一定在首次请求前执行完毕。
      honoEntryCode = [
        `import { Hono } from 'hono'`,
        `const app = new Hono()`,
        `app.all('*', () => new Response('Not Found', { status: 404 }))`,
        `export default app`,
      ].join('\n')
    },

    async buildStart() {
      // 异步重新扫描（捕获 configResolved 时可能遗漏的变化）
      // 同时用于打印更详细的路由信息
      try {
        const routes     = await scanRoutes(resolvedOptions.routesDir!)
        honoEntryCode    = generateEntry(routes)
        const pageCount  = routes.filter(r => r.type === 'page' && !r.special).length
        const apiCount   = routes.filter(r => r.type === 'api'  && !r.special).length
        console.log(
          `[KISS] Routes confirmed: ${pageCount} page(s), ${apiCount} API route(s) ` +
          `— Hono entry (${honoEntryCode.length} bytes)`,
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
        return honoEntryCode || generateEntry([])
      }
    },
  }

  // --- 3. @hono/vite-dev-server（dev 模式）---
  const devServerPlugin = honoDevServer({
    entry: VIRTUAL_ENTRY_ID,
    injectClientScript: true,
  }) as unknown as Plugin

  // --- 4. @hono/vite-ssg（SSG 构建）---
  const ssgPlugin = honoSsg({
    entry: VIRTUAL_ENTRY_ID,
  }) as unknown as Plugin

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
