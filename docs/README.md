# KISS — Keep It Simple, Stupid

> **Web Standards 下的最小增幅渐进式全栈框架**
> KISS = Keep It Simple, Stupid. 不是口号，是每个设计决策的过滤器。

---

## 一、核心原则

| 原则 | 说明 |
|------|------|
| **Web Standards** | HTTP=Fetch API，UI=Web Components，Build=ESM，三层全标准 |
| **最小增幅** | 框架=1个Vite插件，0KB框架运行时，Island仅加载Lit(~6KB) |
| **无框架绑定** | Lit组件=标准Custom Element，可脱离框架在任何环境使用 |
| **无Runtime绑定** | 纯ESM产物，Deno/Node/Bun/CF Workers都能跑 |

### 运行时体积对比

| 框架 | 首页零交互JS | 1个交互组件JS |
|------|-------------|--------------|
| Next.js | ~125KB | ~130KB |
| Fresh | ~0KB | ~8KB |
| Qwik | ~0KB | ~2KB |
| **KISS** | **~0KB** | **~6KB** |

---

## 二、框架定位

| 维度 | 定位 |
|------|------|
| 形态 | Vite 插件（非独立框架），对 Vite 生态完全兼容 |
| 目标用户 | 追求 Web 标准、厌恶框架锁定、重视性能的开发者 |
| 核心差异 | **唯一**全链路 Web Standards 的全栈框架，且以 Vite 插件形态存在 |
| 体积对比 | 运行时增量 < 20KB（Hono ~14KB + Lit ~6KB），vs Next.js ~300KB+ |
| 交互模型 | 默认零 JS → 按需 Island → 按需全页 CSR |
| 部署模型 | 边缘优先，多运行时自适应 |

---

## 三、全链路 Web Standards（独有优势）

> ⚡ **KISS 是唯一一个全链路 Web Standards 的全栈框架：HTTP=Fetch API，UI=Web Components，Build=ESM。其他框架最多 1/3。**

| 标准 | Next.js | Nuxt | SvelteKit | Fresh | Qwik | Astro | **KISS** |
|------|---------|------|-----------|-------|------|-------|---------|
| Fetch API (HTTP) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Web Components (UI) | ❌(React) | ❌(Vue) | ❌(Svelte) | ❌(Preact) | ❌(Qwik) | ⚠️(可选) | ✅(Lit) |
| ESM (Build) | ❌(Webpack) | ⚠️ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **全链路标准** | **0/3** | **0/3** | **1/3** | **0/3** | **1/3** | **1/3** | **3/3** |

---

## 四、架构设计

### 设计哲学

> 🪶 **框架 = 一个 Vite 插件**。SSR 能力完全借用 Vite 内置机制，Hono 作为 Vite 中间件集成，Lit 作为 UI 渲染层。不重新发明轮子。

### Vite 钩子映射

| 框架能力 | Vite 钩子/能力 | 实现方式 |
|----------|---------------|----------|
| 开发服务器 | `configureServer` | 注入 Hono 为 Vite 中间件，处理路由请求 |
| SSR 渲染 | `server.ssrLoadModule()` | Vite 加载 Lit 组件 → `@lit-labs/ssr` 渲染 → HTML |
| 文件路由 | `resolveId` + `load` | 虚拟模块 `virtual:routes`，扫描 `app/routes/` |
| Island 检测 | `transform` | AST 分析 Island 组件，注入水合标记 |
| 双端构建 | `build` 钩子 | 服务端 `build.ssr` + 客户端 `build.rollupOptions` |
| HMR | Vite 内置 | 组件变更 → Vite HMR → 自动重渲染 |
| HTML 模板 | `transformIndexHtml` | 注入 Island 水合脚本、样式链接 |

### 架构总览

```
用户视角：vite.config.ts
┌─────────────────────────────────────────┐
│  import { kiss } from '@kiss/core'      │
│  export default defineConfig({           │
│    plugins: [kiss()]                   │
│  })                                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         @kiss/core (核心插件)          │
│                                          │
│  ┌─ configureServer ──────────────────┐  │
│  │  Hono app ← Vite middlewares       │  │
│  │  app.use('*', pageHandler)          │  │
│  │    ├─ 文件路由匹配                  │  │
│  │    ├─ Vite SSR 加载页面组件         │  │
│  │    ├─ @lit-labs/ssr 渲染 → HTML    │  │
│  │    ├─ 收集 Island → 注入水合脚本   │  │
│  │    └─ 返回 Response                 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌─ resolveId + load ────────────────┐   │
│  │  virtual:routes → 文件路由表       │   │
│  │  virtual:islands → Island 映射表   │   │
│  └────────────────────────────────────┘   │
│                                          │
│  ┌─ transform ───────────────────────┐   │
│  │  Island 组件 AST 标记              │   │
│  │  客户端入口代码生成                │   │
│  └────────────────────────────────────┘   │
│                                          │
│  ┌─ build ───────────────────────────┐   │
│  │  Step 1: 服务端构建 (ssr: true)    │   │
│  │  Step 2: 客户端构建 (Islands only) │   │
│  └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### 数据流

**Dev Mode：**
```
Request → Vite Dev Server → Hono 中间件 → 文件路由匹配
  → Vite SSR (ssrLoadModule) → @lit-labs/ssr 渲染 Lit 组件
  → HTML + Declarative Shadow DOM → 注入 Island 水合脚本 → Response
```

**Build Mode：**
```
Vite Build → Step 1: 服务端构建 (ssr: true)
           → Step 2: 客户端构建 (仅 Islands + 入口)

Runtime：
  CF Workers / Deno / Bun / Node.js → 服务端产物
  Browser → 客户端产物（仅 Island JS）
```

---

## 五、关键技术决策

### 1. Vite SSR 驱动 Lit 渲染

```typescript
// configureServer 钩子中：Vite SSR 加载 + Lit 渲染
async function handleSSR(vite: ViteDevServer, route: RouteMatch) {
  // 1. Vite SSR 加载页面模块
  const module = await vite.ssrLoadModule(route.filePath)
  const Page = module.default
  
  // 2. @lit-labs/ssr 渲染 Lit 组件
  const { render } = await import('@lit-labs/ssr')
  const result = render(Page, route.props)
  
  // 3. 收集 Island → 注入水合脚本
  const html = await collectAndInjectIslands(result)
  
  return new Response(html, {
    headers: { 'content-type': 'text/html' }
  })
}
```

**边缘运行时 vs Node.js 双层策略：**
- **边缘运行时**：构建时预渲染为 Declarative Shadow DOM 静态 HTML，无需 SSR 运行时
- **Node.js 运行时**：运行时使用 `@lit-labs/ssr` 流式渲染，支持动态内容

### 2. Hono 作为 Vite 中间件

```typescript
// vite-plugin/src/dev-server.ts
export function frameworkDevServer(): Plugin {
  return {
    name: 'kiss-dev-server',
    configureServer(server) {
      const app = new Hono()
      
      // API 路由：直接由 Hono 处理
      app.use('/api/*', apiMiddleware)
      
      // 页面路由：Vite SSR + Lit 渲染
      app.use('*', async (c) => {
        const url = new URL(c.req.url)
        const route = matchRoute(url.pathname)
        if (!route) return c.notFound()
        const html = await handleSSR(server, route)
        return c.html(html)
      })
      
      // 注入 Hono 到 Vite
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const response = await app.fetch(createRequest(req))
          if (response) return sendResponse(res, response)
          next()
        })
      }
    }
  }
}
```

### 3. 文件路由 via Vite 虚拟模块

```typescript
export function routeScannerPlugin(): Plugin {
  const virtualId = 'virtual:routes'
  return {
    name: 'kiss-route-scanner',
    resolveId(id) { if (id === virtualId) return '\0' + virtualId },
    async load(id) {
      if (id !== '\0' + virtualId) return
      const routes = await scanRoutes('./app/routes')
      return `
        ${routes.map(r => `import * as ${r.varName} from '${r.filePath}'`).join('\n')}
        export const routes = [
          ${routes.map(r => `{ path: '${r.path}', module: ${r.varName} }`).join(',')}
        ]
      `
    }
  }
}
```

### 4. Island 检测 via Vite transform 钩子

```typescript
export function islandTransformPlugin(): Plugin {
  return {
    name: 'kiss-island-transform',
    transform(code, id) {
      if (!id.includes('/app/islands/')) return
      return `
        ${code}
        if (typeof customElements !== 'undefined') {
          customElements.define('${getTagName(id)}', exports.default)
        }
        export const __island = true
        export const __tagName = '${getTagName(id)}'
      `
    }
  }
}
```

### 5. 双端构建

```typescript
export function frameworkBuildPlugin(): Plugin {
  return {
    name: 'kiss-build',
    async build() {
      // Step 1: 服务端构建
      await build({ build: { ssr: true }, ssr: { noExternal: ['lit', '@lit-labs/ssr'] } })
      // Step 2: 客户端构建（仅 Islands + 入口）
      await build({ rollupOptions: { input: { client: 'app/client.ts' } } })
    }
  }
}
```

### 6. Hono RPC 集成

```typescript
// 服务端：路由定义 + 验证
const routes = app.post('/api/posts',
  zValidator('json', z.object({ title: z.string() })),
  (c) => c.json({ ok: true }, 201)
)
export type AppType = typeof routes

// 客户端：自动类型推断
import { hc } from '@kiss/rpc'
const client = hc<AppType>('/')
const res = await client.api.posts.$post({ json: { title: 'Hello' } })
```

---

## 六、渐进增强层级

> 💡 默认 Level 0-1，Level 2-4 按需开启。渐进式 = 开发者按需求选择层级，框架默认最小。

| Level | 名称 | 说明 | 实现机制 |
|-------|------|------|----------|
| **0** | 纯 HTML SSR | 零 JS，完整内容可达 | Vite SSR + @lit-labs/ssr 输出 |
| **1** | Islands 交互 | 仅交互组件加载 JS | Vite transform 检测 + 条件加载 |
| **2** | 客户端导航 | SPA 路由，预加载 | 可选插件 |
| **3** | 实时功能 | WebSocket/SSE，可选 | Hono WebSocket 中间件 |
| **4** | 全页 CSR | 极端交互场景，可选降级 | 框架提供 escape hatch |

---

## 七、可行性评估总结

- **高可行性**：Vite SSR 原生能力（`ssrLoadModule`、`build.ssr`、middleware mode）、Hono HTTP 层、文件路由（成熟模式）、多运行时部署
- **中可行性**：Lit SSR + Vite SSR 集成（`@lit-labs/ssr` 需适配 Vite 的模块加载）、Islands + Lit 水合（需自研但路径清晰）、端到端类型安全（Hono RPC 成熟）
- **需攻克的关键挑战**：`@lit-labs/ssr` 在 Vite SSR 环境下的模块解析、Declarative Shadow DOM 降级方案、Island AST 检测与选择性水合

### Vite 先验验证（vike 参考）

- ✅ `configureServer` 注入自定义请求处理
- ✅ `ssrLoadModule` 服务器端加载组件
- ✅ `build.ssr` 双端构建
- ✅ `resolveId + load` 虚拟模块
- ✅ `transform` 代码转换

### 关键挑战与解决方案

| 挑战 | 严重程度 | 解决方案 |
|------|---------|----------|
| `@lit-labs/ssr` 模块解析冲突 | 中 | `ssr.noExternal: ['lit', '@lit-labs/ssr', 'lit-html', '@lit/reactive-element']` |
| DSD 浏览器兼容 | 低 | Chrome 90+/Safari 16.4+/Firefox 123+ 原生支持；旧浏览器条件加载 polyfill |
| Island AST 检测 | 中 | 目录约定(`app/islands/`) + `transform` 钩子分析 |
| 边缘运行时 SSR 限制 | 中 | 静态内容构建时预渲染；动态内容使用 Node.js 运行时 |

### 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| `@lit-labs/ssr` API 变更 | 低 | 高 | 锁定版本 + 适配层抽象 |
| DSD polyfill 体积过大 | 低 | 中 | 仅按需加载，核心功能不依赖 polyfill |
| Vite SSR 模块图不一致 | 中 | 中 | 开发模式严格同步 `ssr.noExternal` 配置 |
| Island 依赖图过度提取 | 中 | 低 | tree-shaking + 手动标记 `__island` |

---

## 八、技术栈

| 层 | 技术 | 版本 | 选型理由 |
|----|------|------|----------|
| HTTP | Hono | ^4.x | Web Standards 原生、零依赖、多运行时、内置 RPC |
| UI | Lit | ^3.x | Web Components 标准、5KB 运行时、Shadow DOM 封装 |
| 构建 | Vite | ^6.x | ESM 原生、极速 HMR、SSR 支持、插件生态 |
| SSR | @lit-labs/ssr | ^1.x | Lit 官方 SSR 方案、Declarative Shadow DOM |
| 验证 | Zod | ^3.x | 与 Hono zodValidator 集成、RPC 类型推断（用户选择） |
| 类型 | TypeScript | ^5.x | 端到端类型安全基础 |
| 包管理 | Deno | ^2.x | 内置依赖管理、workspace 支持 |

---

## 九、包结构（精简为 2+1）

```
kiss/                                 # 框架仓库根目录
├── packages/
│   ├── kiss-vite/                      # [核心] Vite 插件包（框架本体）
│   │   ├── src/
│   │   │   ├── index.ts                # 插件主入口，导出 kiss() 函数
│   │   │   ├── dev-server.ts           # configureServer：Hono 中间件注入
│   │   │   ├── ssr-handler.ts          # Vite SSR 加载 + Lit 渲染协调
│   │   │   ├── route-scanner.ts        # resolveId/load：virtual:routes 虚拟模块
│   │   │   ├── island-transform.ts     # transform：Island AST 检测 + 注册
│   │   │   ├── island-extractor.ts     # 构建时 Island 提取与映射表生成
│   │   │   ├── build.ts               # 双端构建（SSR + Client）
│   │   │   ├── html-template.ts        # transformIndexHtml：HTML 文档模板
│   │   │   ├── context.ts              # 请求上下文（跨 SSR/Island）
│   │   │   ├── errors.ts              # 类型化错误层级
│   │   │   └── types.ts                # 公共类型定义
│   │   ├── vite.config.build.ts        # Vite library mode 构建配置
│   │   ├── deno.json
│   │   └── package.json                # name: @kiss/core
│   │
│   ├── kiss-rpc/                       # [独立] RPC 客户端包
│   │   ├── src/
│   │   │   └── index.ts                # hc() + RpcError + RpcController + rpcFetch
│   │   ├── vite.config.build.ts        # Vite library mode 构建配置
│   │   ├── deno.json
│   │   └── package.json                # name: @kiss/rpc
│   │
│   └── create/                         # [脚手架] 项目创建工具
│       ├── src/
│       │   ├── index.ts                # CLI 入口
│       │   └── templates/              # 内联模板
│       │       ├── minimal/            # 最小（纯 SSR）
│       │       ├── standard/           # 标准（SSR + Islands）
│       │       └── full/               # 完整（SSR + Islands + RPC + API）
│       ├── package.json                # name: create-kiss
│       └── tsconfig.json
│
├── examples/                           # 示例应用
│   ├── blog/                           # 博客（SSG + Islands）
│   ├── dashboard/                      # 仪表盘（SSR + RPC）
│   └── todo-app/                       # Todo（全功能）
│
├── deno.json
├── package.json
└── README.md
```

---

## 十、用户项目结构（模板）

```
my-app/                                 # 用户项目
├── app/
│   ├── routes/                         # 文件路由
│   │   ├── index.ts                    # 首页
│   │   ├── about.ts                    # /about
│   │   ├── _renderer.ts                # 布局渲染器
│   │   ├── _middleware.ts              # 中间件
│   │   └── api/
│   │       └── posts.ts                # API 路由（Hono）
│   ├── islands/                        # Island 组件（自动检测）
│   │   ├── counter.ts                  # Lit Island
│   │   └── theme-toggle.ts             # Lit Island
│   ├── components/                     # 普通 Lit 组件（SSR only）
│   │   ├── header.ts
│   │   └── footer.ts
│   ├── server.ts                       # 服务端入口（导出 Hono app）
│   └── client.ts                       # 客户端入口（Island 水合）
├── public/                             # 静态资源
├── deno.json                             # Deno 配置
├── vite.config.ts                        # 只需 plugins: [kiss()]
└── tsconfig.json
```

---

## 十一、实现路线图

| Phase | 内容 | 预期时间 |
|-------|------|----------|
| **Phase 0** | PoC 验证：Vite SSR + Lit 渲染、Hono 中间件、Island 水合、双端构建 | 1-2 天 |
| **Phase 1** | `@kiss/core` 核心包：插件入口、文件路由、开发服务器、SSR、Island、构建 | 3-5 天 |
| **Phase 2** | `@kiss/rpc`：hc 封装、Lit ReactiveController 集成 | 1-2 天 |
| **Phase 3** | `create-kiss` 脚手架 + 项目模板 | 1-2 天 |
| **Phase 4** | 示例应用（blog/dashboard/todo）+ 文档 | 2-3 天 |

⏱️ **里程碑**：M0 PoC(1~2天) → M1 Alpha(1周) → M2 Beta(2周) → M3 RC(3周) → M4 v1.0.4(4周)

---

## 十二、实现要点

### 性能考量

- **Vite SSR 缓存**：开发模式下 Vite 自动缓存 `ssrLoadModule` 结果，模块变更时智能失效
- **Island 提取**：构建时通过 `transform` 钩子 AST 分析 Island 依赖图，仅打包 Island 到客户端
- **SSR 静态缓存**：边缘运行时使用构建时预渲染结果，Node.js 运行时支持动态渲染
- **Shadow DOM CSS**：Lit 组件样式在 SSR 时内联到 Declarative Shadow DOM，避免 FOUC

### 兼容性与降级

- **Declarative Shadow DOM**：Chrome 90+ / Safari 16.4+ / Firefox 123+ 原生支持；旧浏览器通过 polyfill 降级
- **Vite SSR 限制**：边缘运行时无法使用 `ssrLoadModule`（Node.js only），需构建时预渲染
- **零 JS 降级**：Island 水合脚本条件加载，无 Island 时零 JS 输出

### 错误处理

- **SSR 错误**：Lit 组件渲染失败时降级为 Error Boundary 占位符
- **水合错误**：客户端水合失败回退到完整 CSR 渲染
- **RPC 错误**：统一错误类型，自动映射 HTTP 状态码

### 日志

- 开发模式：Vite 终端 + 彩色路由注册/SSR 耗时/Island 检测输出
- 生产模式：Hono 结构化 JSON 日志，携带请求 ID

---

## 十三、文档索引

| 文档 | 说明 |
|------|------|
| [🎯 设计哲学](./design-philosophy.md) | **五大支柱 + 硬约束**：Web Standards 优先、最小增幅、无框架绑定、无 Runtime 绑定、渐进增强 |
| [架构设计](./architecture.md) | 架构总览、Mermaid 流程图、请求生命周期、Island 原理、类型安全链路 |
| [实现路线图](./roadmap.md) | Phase 0~4 详细任务、里程碑、成功标准 |
| [风险矩阵](./risk-matrix.md) | 关键挑战、风险评级、兼容性降级、错误处理、性能指标、日志规范 |
| [API 设计规范](./api-design.md) | 路由约定、Zod 验证、响应格式、Hono RPC、中间件栈、认证、分页 |
| [错误处理体系](./error-handling.md) | 类型化错误层级、全局错误处理器、SSR/水合/RPC 三层错误、跨边界映射 |
| [配置管理](./configuration.md) | 框架配置项、环境变量、启动验证、多环境策略、部署平台配置 |
| [测试策略](./testing-strategy.md) | 测试分层、框架测试矩阵、用户项目测试模板、CI 配置、质量门禁 |
| [安全与中间件](./security-middleware.md) | 中间件链、安全头、CORS、限流、输入验证、认证、安全清单 |
| [开发者体验](./dev-dx.md) | CLI 设计、dev 模式、错误覆盖层、编辑器集成、调试端点、DX 约定 |
| [部署指南](./deployment.md) | Cloudflare/Vercel/Deno/Node/Bun 部署、Docker、SSG 静态托管、部署检查清单 |

---

## License

MIT

---

**KISS — Keep It Simple, Stupid · Web Standards · 最小增幅 · 渐进增强**
