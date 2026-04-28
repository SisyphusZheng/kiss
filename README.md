# KISS — Keep It Simple, Stupid

> **KISS Architecture**: Knowledge · Isolated · Semantic · Static
> 融合 Jamstack 部署模型与声明式岛屿交互范式的全栈架构风格。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-3.x-325CFF)](https://lit.dev/)
[![Deno](https://img.shields.io/badge/Deno-2.x-000000)](https://deno.land/)

## 双重指代

**KISS** 同时是哲学和架构：

| 含义     | 解释                                                                              |
| -------- | --------------------------------------------------------------------------------- |
| **哲学** | Keep It Simple, Stupid — 简单即力量，每个决策都经过"够不够简单"的过滤             |
| **架构** | **K**nowledge · **I**solated · **S**emantic · **S**tatic — 四个不可违抗的架构约束 |

两个含义精神一致：约束就是简单。

## KISS 架构四约束

KISS 框架实现的正是 KISS 架构——一个融合了 Jamstack 部署模型与声明式岛屿交互范式的全栈架构风格。

| 字母  | 约束              | 含义                                                                                         |
| ----- | ----------------- | -------------------------------------------------------------------------------------------- |
| **K** | Knowledge（知识） | 所有内容在构建时预渲染为语义 HTML 静态文件。页面骨架、正文、导航在 JS 执行前即可见           |
| **I** | Isolated（隔离）  | 任何客户端 JS 只能存在于独立 Island 组件的 Shadow DOM 内部。一个 Island 的失败不影响其他部分 |
| **S** | Semantic（语义）  | 每个 Island 包裹原生 HTML 元素（`<form>`、`<a>`、`<details>`），禁用 JS 时提供等价基线功能   |
| **S** | Static（静态）    | 构建产物仅为纯静态文件，无持久服务端进程。可部署到任何 CDN 或静态托管，零运行时锁定          |

## 三范式继承

KISS 架构继承了三个已有范式的核心思想，将它们组合成一套严格、可验证、不可关闭的架构规则：

| 范式                        | KISS 继承了什么                | KISS 的强化                                                                                 |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| **Jamstack**                | 静态优先、前后端分离的部署模型 | 固化为不可配置的框架规则，而非最佳实践建议                                                  |
| **Islands Architecture**    | 静态海洋中的独立交互岛屿       | 要求所有 Island 必须是 Shadow DOM 内的 Web Component，跨岛通信只能通过声明式机制            |
| **Progressive Enhancement** | 内容优先，增强在后             | 从开发者最佳实践提升为框架层面的可验证约束——Island 内部没有语义降级元素，就不符合 KISS 规范 |

KISS 架构不发明新的渲染算法或通信协议。它识别出三个范式各自领域中被验证有效的约束，组合成不可违抗的架构规则，通过 KISS 框架强制执行。

`kiss build` 就是这套规则的编译验证器——不满足架构约束的输出，不会产生任何可部署产物。

### Jamstack 对齐

KISS 架构与 Jamstack 天然 1:1 对齐：

| Jamstack       | KISS 实现                             | Web Standard           |
| -------------- | ------------------------------------- | ---------------------- |
| **M**arkup     | SSG + DSD — 零 JS 默认输出            | Declarative Shadow DOM |
| **A**PIs       | API Routes — Hono + RPC               | Fetch API              |
| **J**avaScript | Islands — Shadow DOM + lazy hydration | Web Components         |

### DSD：封装与可达的桥梁

Declarative Shadow DOM 解决了"封装 vs 可达"的根本矛盾：

- **Shadow DOM 封装**：样式隔离，DOM 保护 ✓
- **DSD 内容可达**：JS 加载前内容即可见 ✓
- **SEO / 爬虫可达**：完整内容对 bot 可见 ✓
- **浏览器支持**：Chrome 111+ / Safari 16.4+ / Firefox 123+（polyfill ~1KB）

## 为什么是 KISS

| 问题                    | KISS 的回答                                     |
| ----------------------- | ----------------------------------------------- |
| 框架锁定太重？          | 1 个 Vite 插件，所有组件都是标准 Custom Element |
| 首页 JS 太大？          | 默认 0KB，Island 按需加载 ~6KB                  |
| SSR 运维太重？          | 没有 SSR 运行时。构建产出纯静态文件             |
| Shadow DOM 破坏了 SEO？ | DSD 让 Shadow DOM 内容声明式可达                |
| 类型安全靠 codegen？    | Hono RPC 端到端类型推断，零 codegen             |
| 部署只能 Node？         | CDN / GitHub Pages / Nginx，任何静态托管        |
| 动态数据怎么办？        | API Routes 部署为 Serverless，前端通过 RPC 调用 |

## 渐进增强

KISS 只有两层：

| 层级        | JS 大小      | 能力                                        | 状态   |
| ----------- | ------------ | ------------------------------------------- | ------ |
| **Level 0** | 0 KB         | HTML + DSD（构建时预渲染，Shadow DOM 封装） | 已实现 |
| **Level 1** | ~6 KB/Island | Island 交互 + 懒水合                        | 已实现 |

没有 Level 2 SPA、Level 3 实时、Level 4 CSR。这不是疏忽，是架构约束（S — Static）。

## 分层原则：能力下沉，依赖上移

```
L0  HTML5 语义       — 结构、内容、导航
L1  CSS 表现         — 视觉、布局、动画、响应式
L2  浏览器平台 API    — Clipboard、IntersectionObserver、matchMedia
L3  Hono/Vite/Lit    — 路由、构建、组件封装
L4  自研代码          — Island 水合、RPC、插件逻辑
```

每一层只做上一层做不了的事。能用低层能力解决的事情，绝不引入高层依赖。

## 快速开始

### 创建项目

```bash
deno run -A jsr:@kissjs/create my-app
cd my-app
deno task dev
```

### 手动安装

```bash
deno add jsr:@kissjs/core jsr:@kissjs/rpc
```

### 配置

```ts
// vite.config.ts
import { kiss } from '@kissjs/core';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [kiss({
    inject: {
      stylesheets: [
        'https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/styles.css',
      ],
      scripts: [
        'https://cdn.jsdelivr.net/npm/@awesome-webcomponents/webawesome@3.5.0/dist/webawesome.loader.js',
      ],
    },
  })],
});
```

### 项目结构

```
my-app/
├── app/
│   ├── routes/           # 文件路由（自动扫描）
│   │   ├── index.ts      # 首页
│   │   ├── about.ts      # /about
│   │   └── api/
│   │       └── posts.ts  # API 路由（Hono）→ 部署为 Serverless
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
import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'home-page';
export default class HomePage extends LitElement {
  render() {
    return html`
      <h1>Hello KISS!</h1>
      <my-counter></my-counter>
    `;
  }
}
```

### API 路由（Serverless）

```ts
// app/routes/api/posts.ts
import { Hono } from '@kissjs/core';

const app = new Hono();
app.get('/', (c) => c.json({ data: [] }));

export default app;
export type AppType = typeof app;
```

### Island 组件

```ts
// app/islands/my-counter.ts
import { html, LitElement } from '@kissjs/core';

export const tagName = 'my-counter';
export default class MyCounter extends LitElement {
  static properties = { count: { type: Number } };

  constructor() {
    super();
    this.count = 0;
  }

  render() {
    return html`
      <button @click="${() => this.count++}">+</button>
      <span>${this.count}</span>
      <button @click="${() => this.count--}">-</button>
    `;
  }
}
```

### RPC 调用（在 Island 内）

```ts
import { hc } from 'hono/client';
import type { AppType } from '../routes/api/posts';

const client = hc<AppType>('/api/posts');
const res = await client.$post({ json: { title: 'Hello' } });
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
  island: { hydrationStrategy: 'lazy' }, // eager | lazy | idle | visible

  // 构建输出
  build: { outDir: 'dist' },

  // 中间件（构建时 Hono + dev server）
  middleware: {
    cors: true,
    corsOrigin: 'https://example.com',
    securityHeaders: true,
  },
});
```

## 特殊路由文件

### `_renderer.ts` — Layout 渲染器

在路由目录下放置 `_renderer.ts`，可以包裹该目录及子目录下所有页面路由的 SSR 输出。类似 Next.js 的 `layout.tsx` 或 SvelteKit 的 `+layout.svelte`。

```ts
// app/routes/_renderer.ts
import type { KissRenderer } from '@kissjs/core';

const renderer: KissRenderer = {
  wrap(html, ctx) {
    // ctx.req.path 提供当前路径（可用于 active 导航高亮）
    return `<div class="layout">
  <nav>...</nav>
  <main>${html}</main>
</div>`;
  },
};

export default renderer;
```

多层 renderer 从外到内组合（根目录 → 子目录），与 Next.js layout 嵌套一致。

### `_middleware.ts` — 路由中间件

在路由目录下放置 `_middleware.ts`，会作为 Hono middleware 挂载到该目录前缀下的所有路由。类似 Next.js 的 `middleware.ts`。

```ts
// app/routes/api/_middleware.ts
import type { KissMiddleware } from '@kissjs/core';
import type { MiddlewareHandler } from 'hono';

const middleware: MiddlewareHandler = async (c, next) => {
  console.log('API request:', c.req.path);
  await next();
};

export default middleware;
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

生产部署（Jamstack）：
  静态前端 → CDN / GitHub Pages / Nginx（零运行时进程）
  API Routes → Serverless（Deno Deploy / Cloudflare Workers / Vercel Edge）
  DSD 让 Shadow DOM 内容在 JS 加载前可见
```

## 包结构

| 包                                              | 版本  | 说明                                          |
| ----------------------------------------------- | ----- | --------------------------------------------- |
| [@kissjs/core](https://jsr.io/@kissjs/core)     | 0.3.0 | 核心框架 — Vite 插件 + Lit/Hono re-export     |
| [@kissjs/rpc](https://jsr.io/@kissjs/rpc)       | 0.2.1 | RPC 客户端 — Lit ReactiveController           |
| [@kissjs/ui](https://jsr.io/@kissjs/ui)         | 0.3.0 | UI 组件库 — kiss-layout, kiss-theme-toggle 等 |
| [@kissjs/create](https://jsr.io/@kissjs/create) | 0.3.0 | 项目脚手架 — 一键创建 KISS 应用               |

> JSR 上有旧包 `@kissjs/vite` 和 `@kissjs/ssg`，已废弃，请勿使用。

## 文档

[完整文档站](https://kiss.js.org/)

## 技术栈

| 层     | 技术          | 版本   | 用途                                     |
| ------ | ------------- | ------ | ---------------------------------------- |
| 运行时 | Deno          | ^2.x   | 首选运行时                               |
| HTTP   | Hono          | ^4.x   | 构建时路由匹配 + dev server + API Routes |
| UI     | Lit           | ^3.x   | Web Component 渲染引擎                   |
| Build  | Vite          | ^6.x   | 构建工具                                 |
| SSR    | @lit-labs/ssr | ^3.3.x | 构建时渲染 + DSD 输出                    |
| 类型   | TypeScript    | ^5.x   | 端到端类型安全                           |

运行时依赖（5 个）：hono, lit, @lit-labs/ssr, @hono/vite-dev-server, magic-string

> **@hono/vite-dev-server 为什么保留？** → 见 [ADR #0001](docs/decisions/0001-keep-hono-vite-dev-server.md)（零生产足迹、~100行替代代码的 DX 权衡）

## 当前状态

v0.2.0 已发布。包内 Island 自动检测 + kiss-theme-toggle Island。文档站自举验证通过。

## License

MIT

---

KISS — Keep It Simple, Stupid / K·I·S·S Architecture
