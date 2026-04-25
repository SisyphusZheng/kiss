# KISS — Keep It Simple, Stupid

> **Declarative Islands Architecture (DIA) 框架**
> 构建即终态，交互必隔离，声明即内容，拒绝即纪律。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-3.x-325CFF)](https://lit.dev/)
[![Deno](https://img.shields.io/badge/Deno-2.x-000000)](https://deno.land/)

## DIA 是什么

KISS 是唯一将"声明式 Shadow DOM 内容可达"与"交互强制隔离"同时固化为框架纪律的全栈框架。

四条不可动摇的支柱：

1. **构建即终态** — 所有页面在构建时渲染为静态 HTML（含 DSD），构建后零服务端进程
2. **交互必隔离** — 客户端 JS 只能存在于 Island Web Component 内部
3. **声明即内容** — DSD 让 Shadow DOM 内容从 HTML 声明中即可见，不需要 JS
4. **拒绝即纪律** — 框架不提供 SSR 运行时、CSR、SPA。这些限制不可配置关闭

### DSD：DIA 的桥梁

Declarative Shadow DOM 是 DIA 与 Web Components 之间的桥梁。它解决了"封装 vs 可达"的根本矛盾：

- **Shadow DOM 封装**：样式隔离，DOM 保护 ✓
- **DSD 内容可达**：JS 加载前内容即可见 ✓
- **SEO / 爬虫可达**：完整内容对 bot 可见 ✓
- **浏览器支持**：Chrome 111+ / Safari 16.4+ / Firefox 123+（polyfill ~1KB）

### 分层原则：能力下沉，依赖上移

```
L0  HTML5 语义       — 结构、内容、导航
L1  CSS 表现         — 视觉、布局、动画、响应式
L2  浏览器平台 API    — Clipboard、IntersectionObserver、matchMedia
L3  Hono/Vite/Lit    — 路由、构建、组件封装
L4  自研代码          — Island 水合、RPC、插件逻辑
```

每一层只做上一层做不了的事。能用低层能力解决的事情，绝不引入高层依赖。

## 为什么是 KISS

| 问题 | KISS 的回答 |
|------|-------------|
| 框架锁定太重？ | 1 个 Vite 插件，所有组件都是标准 Custom Element |
| 首页 JS 太大？ | 默认 0KB，Island 按需加载 ~6KB |
| SSR 运维太重？ | 没有 SSR 运行时。构建产出纯静态文件 |
| Shadow DOM 破坏了 SEO？ | DSD 让 Shadow DOM 内容声明式可达 |
| 类型安全靠 codegen？ | Hono RPC 端到端类型推断，零 codegen |
| 部署只能 Node？ | CDN / GitHub Pages / Nginx，任何静态托管 |

## 渐进增强

DIA 只有两层：

| 层级 | JS 大小 | 能力 | 状态 |
|------|---------|------|------|
| **Level 0** | 0 KB | HTML + DSD（构建时预渲染，Shadow DOM 封装） | 已实现 |
| **Level 1** | ~6 KB/Island | Island 交互 + 懒水合 | 已实现 |

没有 Level 2 SPA、Level 3 实时、Level 4 CSR。这不是疏忽，是纪律。

## 快速开始

### 安装

```bash
deno add jsr:@kissjs/core jsr:@kissjs/rpc
```

### 配置

```ts
// vite.config.ts
import { kiss } from '@kissjs/core'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [kiss({
    inject: {
      stylesheets: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css'],
      scripts: ['https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js'],
    },
  })]
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
│   └── components/       # 普通 Lit 组件（构建时渲染 + DSD，不发送 JS）
│       └── header.ts
├── deno.json
└── vite.config.ts
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

const app = new Hono()
app.get('/', (c) => c.json({ data: [] }))

export default app
export type AppType = typeof app
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
      <button @click=${() => this.count--}>-</button>
    `
  }
}
```

### RPC 调用（在 Island 内）

```ts
import { hc } from 'hono/client'
import type { AppType } from '../routes/api/posts'

const client = hc<AppType>('/api/posts')
const res = await client.$post({ json: { title: 'Hello' } })
```

## 配置选项

```ts
kiss({
  routesDir: 'app/routes',
  islandsDir: 'app/islands',

  // 通用外部资源注入
  inject: {
    stylesheets: ['https://cdn.example.com/style.css'],
    scripts: ['https://cdn.example.com/ui.js'],
    headFragments: ['<meta name="theme-color" content="#0a0a0a">'],
  },

  // 旧版 WebAwesome CDN 注入（已废弃，推荐迁移到 inject）
  // ui: { cdn: true },

  // 文档属性
  html: { lang: 'zh', title: '我的应用' },

  // Island 水合策略
  island: { hydrationStrategy: 'lazy' },  // eager | lazy | idle | visible

  // 构建输出
  build: { outDir: 'dist' },

  // 中间件（构建时 Hono + dev server）
  middleware: {
    cors: true,
    corsOrigin: 'https://example.com',
    securityHeaders: true,
  },
})
```

## 工作原理

```
开发时：
  deno task dev → Vite dev server + Hono + HMR
  （模拟 SSG 输出，DSD 内容可见）

构建时：
  deno task build → @lit-labs/ssr 渲染所有页面 → 静态 HTML + DSD
                     Island 组件 → 独立 JS chunk
                     非 Island 组件 → 不发送 JS

生产部署：
  dist/ → 任何静态托管（CDN / GitHub Pages / Nginx）
  零运行时进程
  DSD 让 Shadow DOM 内容在 JS 加载前可见
```

## 包结构

| 包 | 版本 | 说明 |
|----|------|------|
| [@kissjs/core](https://jsr.io/@kissjs/core) | 0.1.5 | 核心框架 — Vite 插件 + Lit/Hono re-export |
| [@kissjs/rpc](https://jsr.io/@kissjs/rpc) | 0.1.2 | RPC 客户端 — Lit ReactiveController |
| [@kissjs/ui](https://jsr.io/@kissjs/ui) | 0.1.2 | UI 插件 — WebAwesome CDN 注入 |

> JSR 上有旧包 `@kissjs/vite` 和 `@kissjs/ssg`，已废弃，请勿使用。

## 文档

[完整文档站](https://sisyphuszheng.github.io/kiss/)

## 技术栈

| 层 | 技术 | 版本 | 用途 |
|----|------|------|------|
| 运行时 | Deno | ^2.x | 首选运行时 |
| HTTP | Hono | ^4.x | 构建时路由匹配 + dev server |
| UI | Lit | ^3.x | Web Component 渲染引擎 |
| Build | Vite | ^6.x | 构建工具 |
| SSR | @lit-labs/ssr | ^3.3.x | 构建时渲染 + DSD 输出 |
| 类型 | TypeScript | ^5.x | 端到端类型安全 |

运行时依赖（5 个）：hono, lit, @lit-labs/ssr, @hono/vite-dev-server, magic-string

## 当前状态

Phase 4 进行中。DIA 文档已建立，代码改造（Shadow DOM + DSD 恢复）待执行。JSR 已发布。

## License

MIT

---

KISS — Keep It Simple, Stupid / DIA / 声明即内容
