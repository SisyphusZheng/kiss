# KISS — Keep It Simple, Stupid

> **Web Standards 下的最小增幅渐进式全栈框架**
> KISS = Keep It Simple, Stupid. 不是口号，是每个设计决策的过滤器。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-3.x-325CFF)](https://lit.dev/)
[![Deno](https://img.shields.io/badge/Deno-2.x-000000)](https://deno.land/)

**K**eep **I**t **S**imple, **S**tupid — 三个 Web Standards 原生库的组合，以单一 Vite 插件形态提供全栈能力。

## 为什么是 KISS？

| 问题 | KISS 的回答 |
|------|-------------|
| 框架锁定太重？ | KISS = 1 个 Vite 插件，所有组件都是标准 Custom Element |
| 首页 JS 太大？ | 默认 0KB，Island 按需加载 ~6KB |
| SSR 配置复杂？ | `plugins: [kiss()]` — 完事 |
| 类型安全靠 codegen？ | Hono RPC 端到端类型推断，零 codegen |
| 部署只能 Node？ | CF Workers / Deno / Bun / Node，一套代码 |

## 核心特性

- 🔌 **Vite 插件即框架** — `kiss()` 一个函数搞定所有
- 📄 **SSR 优先** — Lit SSR + Declarative Shadow DOM，零 JS 也有完整 HTML
- 🏝️ **Islands 架构** — 仅交互组件发送 JS，非 Island 纯静态
- 🔒 **端到端类型安全** — Hono RPC 类型推断，可选 Zod 验证
- 🌍 **多运行时部署** — Cloudflare / Vercel / Deno / Bun / Node
- 📈 **渐进增强** — 纯 HTML → Islands → SPA 导航 → 实时功能，每层可选
- 🦕 **Deno 原生** — 以 Deno 为首选运行时，完全兼容 Node 生态

## 快速开始

### 前置要求

- [Deno](https://deno.land/) 2.x+

### 手动集成

```bash
deno add jsr:@kissjs/core jsr:@kissjs/rpc
```

```ts
// vite.config.ts
import { kiss } from '@kissjs/core'

export default defineConfig({
  plugins: [kiss()]
})
```

### 项目结构

```
my-app/
├── app/
│   ├── routes/           # 文件路由（自动扫描）
│   │   ├── index.ts      # 首页
│   │   ├── about.ts      # /about
│   │   └── api/
│   │       └── posts.ts  # API 路由（Hono）
│   ├── islands/          # Island 组件（自动水合）
│   │   └── counter.ts    # <my-counter>
│   └── components/       # 普通 Lit 组件（SSR only）
│       └── header.ts
├── deno.json             # Deno 配置（替代 package.json）
└── vite.config.ts        # 只需 plugins: [kiss()]
```

### 页面路由

```ts
// app/routes/index.ts
import { LitElement, html, css } from '@kissjs/core'

export const tagName = 'home-page'
export default class HomePage extends LitElement {
  render() {
    return html`
      <h1>Hello KISS!</h1>
      <my-counter></my-counter>
    `
  }
}
```

### API 路由

```ts
// app/routes/api/posts.ts
import { Hono } from '@kissjs/core'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

app.get('/', (c) => c.json({ data: [] }))

app.post('/', zValidator('json', z.object({
  title: z.string().min(1),
})), (c) => {
  const { title } = c.req.valid('json')
  return c.json({ data: { title } }, 201)
})

export default app
export type AppType = typeof app
```

### RPC 类型安全调用

```ts
// 在 Island 组件中
import { hc } from 'hono/client'
import type { AppType } from '../routes/api/posts'

const client = hc<AppType>('/api/posts')

// ✅ 完全类型安全，自动补全
const res = await client.$post({ json: { title: 'Hello' } })
```

### Island 组件

```ts
// app/islands/my-counter.ts
import { LitElement, html } from '@kissjs/core'

export const tagName = 'my-counter'
export default class MyCounter extends LitElement {
  static properties = { count: { type: Number } }

  constructor() {
    super()
    this.count = 0
  }

  render() {
    return html`
      <button @click=${() => this.count++}>+</button>
      <span>${this.count}</span>
      <button @click=${() => this.count--}>−</button>
    `
  }
}
```

## 渐进增强层级

| 层级 | JS 大小 | 能力 | 状态 |
|------|---------|------|------|
| **Level 0** | 0 KB | 纯 HTML SSR | ✅ 已实现 |
| **Level 1** | ~6 KB | Island 交互 | ✅ 已实现 |
| **Level 2** | ~10 KB | SPA 导航 | 🔲 计划中 |
| **Level 3** | ~12 KB | 实时功能 | 🔲 计划中 |
| **Level 4** | 全量 | 全页 CSR | 🔲 计划中 |

## 配置

```ts
// vite.config.ts
kiss({
  routesDir: 'app/routes',
  islandsDir: 'app/islands',
  ssr: { preRender: false },
  island: { hydrationStrategy: 'lazy' },  // eager | lazy | idle | visible
  headExtras: '<link rel="stylesheet" href="...">', // 自定义 <head> 内容
  ui: { cdn: true },  // 自动注入 WebAwesome CDN
  middleware: {
    cors: true,
    securityHeaders: true,
    rateLimit: false,
  },
})
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `deno task dev` | 启动开发服务器 |
| `deno task build` | 构建生产产物 |
| `deno task test` | 运行测试 |
| `deno task lint` | 代码检查 |
| `deno task fmt` | 格式化代码 |

## 包结构

| 包名 | 版本 | 说明 |
|------|------|------|
| [@kissjs/core](https://jsr.io/@kissjs/core) | 0.1.5 | 核心框架 — Vite 插件 + Lit/Hono re-export |
| [@kissjs/rpc](https://jsr.io/@kissjs/rpc) | 0.1.2 | RPC 客户端 — Lit ReactiveController |
| [@kissjs/ui](https://jsr.io/@kissjs/ui) | 0.1.2 | UI 插件 — WebAwesome CDN 注入 |

> ⚠️ JSR 上仍有旧包 `@kissjs/vite` (v0.0.3) 和 `@kissjs/ssg` (v0.1.0)，这些是重命名前的历史遗留，请勿使用。

## 文档

📖 完整文档见 [KISS 文档站](https://sisyphuszheng.github.io/kiss/)

| 文档 | 说明 |
|------|------|
| [🎯 设计哲学](https://sisyphuszheng.github.io/kiss/guide/design-philosophy) | **五大支柱 + 硬约束** |
| [快速开始](https://sisyphuszheng.github.io/kiss/guide/getting-started) | 5 分钟上手 |
| [路由](https://sisyphuszheng.github.io/kiss/guide/routing) | 文件路由、动态路由 |
| [Islands](https://sisyphuszheng.github.io/kiss/guide/islands) | 按需加载交互组件 |
| [SSG](https://sisyphuszheng.github.io/kiss/guide/ssg) | 静态站点生成 |
| [API 路由](https://sisyphuszheng.github.io/kiss/guide/api-routes) | Hono 后端端点 |
| [API 设计](https://sisyphuszheng.github.io/kiss/guide/api-design) | 类型安全 RPC、验证 |
| [错误处理](https://sisyphuszheng.github.io/kiss/guide/error-handling) | 类型化错误层级 |
| [安全与中间件](https://sisyphuszheng.github.io/kiss/guide/security-middleware) | 安全头、CORS |
| [测试](https://sisyphuszheng.github.io/kiss/guide/testing) | 测试策略、CI |
| [架构](https://sisyphuszheng.github.io/kiss/guide/architecture) | 插件组合、请求生命周期 |
| [配置](https://sisyphuszheng.github.io/kiss/guide/configuration) | kiss() 选项 |
| [部署](https://sisyphuszheng.github.io/kiss/guide/deployment) | 6 平台部署 |
| [Web Awesome](https://sisyphuszheng.github.io/kiss/styling/web-awesome) | 50+ UI 组件 |
| [路线图](./ROADMAP.md) | Phase 0~4 详细任务 |

## 当前状态

**Phase 2 完成** — 核心插件包可用，工程化补齐，JSR 已发布。

已实现 ✅：
- Route Scanner — 文件路由扫描（含 _renderer / _middleware 支持）
- Island Transform — AST 检测 + 水合标记
- Island Extractor — 构建时 Island 依赖分析
- SSR Handler — Lit 渲染 + DSD 输出
- SSG — 静态站点生成（自研方案，替代 @hono/vite-ssg）
- Build Plugin — 双端构建（SSR + Client）
- HTML Template — 预加载/水合注入
- Error Classes — 类型化错误层级
- Context — 请求上下文（SsrContext）
- RPC Client — Lit ReactiveController + loading/error 状态管理
- UI Plugin — WebAwesome CDN 注入
- 5 个测试文件覆盖核心模块

运行时依赖（5 个）：hono, lit, @lit-labs/ssr, @hono/vite-dev-server, magic-string

## 设计哲学速览

KISS 是唯一**全链路 Web Standards** 的全栈框架：

| 层 | 标准 | KISS 做法 |
|----|------|-----------|
| HTTP | Fetch API | Hono 直用，不封装 |
| UI | Web Components | Lit 直用，不抽象 |
| 构建 | ESM | Vite 输出纯 ESM |

➡️ 完整哲学见 [设计哲学](https://sisyphuszheng.github.io/kiss/guide/design-philosophy)

## 技术栈

| 层 | 技术 | 版本 | 理由 |
|----|------|------|------|
| 运行时 | [Deno](https://deno.land/) | ^2.x | Web Standards 原生、安全沙箱、内置工具链 |
| HTTP | [Hono](https://hono.dev/) | ^4.x | Web Standards、零依赖、多运行时、内置 RPC |
| UI | [Lit](https://lit.dev/) | ^3.x | Web Components 标准、5KB 运行时 |
| Build | [Vite](https://vitejs.dev/) | ^6.x | ESM 原生、SSR 支持 |
| SSR | @lit-labs/ssr | ^3.3.x | Declarative Shadow DOM |
| 验证 | [Zod](https://zod.dev/) | ^3.x | 与 Hono 集成、RPC 类型推断（用户选择） |
| 类型 | TypeScript | ^5.x | 端到端类型安全 |

## License

MIT

---

**KISS — Keep It Simple, Stupid · Web Standards · 最小增幅 · 渐进增强**
