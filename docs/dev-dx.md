# KISS 开发者体验

> CLI 设计、dev 模式体验、调试工具、错误提示、DX 约定

---

## 1. 设计哲学

> 框架的价值不仅在于运行时能力，更在于开发时体验。一个好的框架让开发者**做更少的事，想更少的坑**。

```
✅ 零配置启动 — deno task dev 即可
✅ 错误即反馈 — 开发模式错误提示直达问题
✅ 约定即文档 — 目录结构就是架构
✅ 渐进发现 — 简单场景简单用，复杂能力按需解锁
```

---

## 2. CLI 设计

### 2.1 create-kiss

```bash
# 交互式创建
deno run -A npm:create-kiss my-app

# 指定模板
deno run -A npm:create-kiss my-app --template minimal    # 纯 SSR
deno run -A npm:create-kiss my-app --template standard   # SSR + Islands（默认）
deno run -A npm:create-kiss my-app --template full       # 全功能

# 静默创建（CI 用）
deno run -A npm:create-kiss my-app --template standard --yes
```

### 2.2 开发命令

```bash
# 开发服务器（HMR + SSR）
deno task dev

# 类型检查
deno task typecheck

# 构建生产产物
deno task build

# 预览生产构建
deno task preview

# 测试
deno task test          # 单元 + 集成
deno task test:watch    # 监听模式

# Lint
deno task lint

# 格式化
deno task fmt
```

---

## 3. Dev 模式体验

### 3.1 启动输出

```
  ╭──────────────────────────────────────╮
  │                                      │
  │   KISS dev server running             │
  │                                      │
  │   ➜  Local:   http://localhost:3000  │
  │   ➜  Network: http://192.168.1.5:3000│
  │                                      │
  │   Routes:                            │
  │     GET  /              (index.ts)    │
  │     GET  /about         (about.ts)   │
  │     GET  /posts/:id     ([id].ts)    │
  │     POST /api/posts     (posts.ts)   │
  │                                      │
  │   Islands:                           │
  │     <my-counter>   (~2KB)            │
  │     <theme-toggle> (~1KB)            │
  │                                      │
  │   SSR: Lit + DSD ✓                   │
  │   Runtime: Deno 2.x                    │
  │                                      │
  ╰──────────────────────────────────────╯
```

### 3.2 请求日志

```
[KISS] GET  /              12ms
[KISS] GET  /about          8ms
[KISS] GET  /posts/123     23ms  (my-counter, theme-toggle)
[KISS] POST /api/posts      5ms  → 201 Created
[KISS] GET  /api/posts/abc  3ms  → 404 Not Found
```

### 3.3 文件变更反馈

```
[KISS] ↻ Route changed: app/routes/about.ts → reloaded
[KISS] ↻ Island changed: app/islands/counter.ts → HMR updated
[KISS] ↻ API changed: app/routes/api/posts.ts → reloaded
[KISS] ✗ Route error: app/routes/broken.ts
       TypeError: Cannot read properties of undefined
       at line 12, column 5
```

---

## 4. 错误覆盖层

### 4.1 SSR 错误

开发模式下 SSR 渲染失败，浏览器显示全屏错误覆盖层：

```
┌──────────────────────────────────────────────────┐
│  ⚠️ SSR Render Error                             │
│                                                    │
│  Route: /dashboard                                 │
│  File: app/routes/dashboard.ts                     │
│  Line: 12, Column: 5                              │
│                                                    │
│  TypeError: Cannot read properties of undefined    │
│    (reading 'name')                                │
│                                                    │
│  Stack:                                            │
│    at render (app/routes/dashboard.ts:12:5)        │
│    at handleSSR (@kiss/core:45:8)                   │
│    at processRequest (@kiss/core:28:4)              │
│                                                    │
│  [Open in Editor]                                  │
└──────────────────────────────────────────────────┘
```

### 4.2 验证错误

```
┌──────────────────────────────────────────────────┐
│  ⚠️ Validation Error                              │
│                                                    │
│  POST /api/posts                                   │
│                                                    │
│  × title: String must contain at least 1 char     │
│  × content: Required                               │
│  × tags[0]: Expected string, received number       │
│                                                    │
│  Request Body:                                     │
│  { "title": "", "tags": [123] }                   │
│                                                    │
│  Expected Schema:                                  │
│  { title: string(1-200), content: string,          │
│    tags?: string[] }                               │
└──────────────────────────────────────────────────┘
```

### 4.3 水合错误

```
┌──────────────────────────────────────────────────┐
│  ⚠️ Hydration Error                               │
│                                                    │
│  Island: <my-counter>                              │
│  Error: Custom element already defined             │
│                                                    │
│  The SSR HTML is still visible (static fallback).  │
│  Interactive features are disabled.                │
│                                                    │
│  [Reload Page]  [Dismiss]                         │
└──────────────────────────────────────────────────┘
```

---

## 5. 编辑器集成

### 5.1 Open in Editor

错误覆盖层的 "Open in Editor" 按钮利用 `launch-editor`：

```typescript
// vite.config.ts
kiss({
  dev: {
    openInEditor: true,  // 默认启用
    editor: 'vscode',    // 'vscode' | 'cursor' | 'webstorm'
  },
})
```

点击后执行：
```
code --goto app/routes/dashboard.ts:12:5
```

### 5.2 TypeScript 支持

```json
// tsconfig.json — 框架脚手架自动生成
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["@kiss/core/client"],   // 框架类型
    "paths": {
      "#imports": ["./app/.kiss/imports"]  // 自动导入
    }
  }
}
```

### 5.3 IDE 类型提示

```typescript
// 框架生成的 .kiss/imports.d.ts
// 提供路由、Island、组件的自动补全：

declare module '#imports' {
  export { default as Counter } from '../islands/counter'
  export { default as Header } from '../components/header'
  // ...
}
```

---

## 6. 调试工具

### 6.1 /__kiss 调试端点

开发模式下访问 `http://localhost:3000/__kiss` 获取框架状态：

```json
{
  "version": "0.0.1",
  "routes": [
    { "path": "/", "file": "index.ts", "type": "page" },
    { "path": "/about", "file": "about.ts", "type": "page" },
    { "path": "/api/posts", "file": "api/posts.ts", "type": "api" }
  ],
  "islands": [
    { "tag": "my-counter", "file": "counter.ts", "size": "2.1KB" },
    { "tag": "theme-toggle", "file": "theme-toggle.ts", "size": "0.8KB" }
  ],
  "ssr": { "engine": "@lit-labs/ssr", "dsd": true },
  "middleware": ["requestId", "logger", "cors", "securityHeaders", "rateLimit"]
}
```

### 6.2 HMR 边界

```typescript
// 框架自动处理 HMR 边界
// 页面组件变更 → 全页重载
// Island 组件变更 → HMR 热更新（保持状态）
// API 路由变更 → 服务端重载
// 布局/中间件变更 → 全页重载

if (import.meta.hot) {
  import.meta.hot.accept('./islands/counter.ts', (newMod) => {
    // Island 热更新逻辑
    if (newMod) {
      customElements.upgrade(newMod.default)
    }
  })
}
```

---

## 7. DX 约定

### 7.1 文件约定 = 架构

```
app/
├── routes/              ← 文件路由（零配置）
│   ├── index.ts         ← /
│   ├── about.ts         ← /about
│   ├── [id].ts          ← /:id（动态）
│   ├── _renderer.ts     ← 布局（自动注入）
│   ├── _middleware.ts   ← 中间件（自动注入）
│   └── api/
│       └── posts.ts     ← /api/posts（API 路由）
├── islands/             ← Island 组件（自动检测 + 水合）
├── components/          ← 普通 Lit 组件（SSR only，不发 JS）
├── server.ts            ← 服务端入口（可选自定义）
└── client.ts            ← 客户端入口（可选自定义）
```

### 7.2 导出约定

```typescript
// 路由文件默认导出 = 页面组件
export default class AboutPage extends LitElement { ... }

// API 路由默认导出 = Hono 实例
export default new Hono().get('/', (c) => c.json({ data: [] }))

// 可选导出
export const meta = { title: 'About', description: '...' }  // SEO meta
export const loader = async () => ({ posts: await getPosts() })  // 数据加载
```

---

## 8. DX 反模式

| ❌ 不要 | ✅ 应该 |
|---------|--------|
| 需要用户手动配置路由 | 文件路由自动扫描 |
| 错误信息只有 stack trace | 结构化错误 + 文件位置 + 修复建议 |
| 改一行代码等 5 秒重载 | HMR 精准热更新 |
| 文档里才说有这个功能 | CLI 启动信息展示所有能力 |
| 强制用户选配置项 | 合理默认值，按需覆盖 |
| 构建错误指向依赖内部 | 错误定位到用户代码行 |

---

*文档版本：v1.0 | 最后更新：2026-04-23*
