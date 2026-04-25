# KISS 实现路线图

> DIA (Declarative Islands Architecture) 从 PoC 到 v1.0

---

## 里程碑概览

| 阶段 | 名称 | 核心目标 | 状态 |
|------|------|----------|------|
| Phase 0 | PoC | 技术可行性验证 | 完成 |
| Phase 1 | Alpha | 核心插件包可用 | 完成 |
| Phase 2 | 工程化补齐 | P0/P1 修复 + 架构重构 | 完成 |
| Phase 3 | 文档整合 | docs-site → docs | 完成 |
| Phase 4 | DIA 落地 | DIA 文档 + Shadow DOM 恢复 + 文档站改造 | 进行中 |
| Phase 5 | 生态验证 | 示例 + @kiss/docs-kit + v0.2.0 | 待开始 |

---

## Phase 0-3：已完成

见 git 历史和 MEMORY.md。

---

## Phase 4：DIA 落地（进行中）

### 4A: 核心 PIA→DIA 合规（已完成）

- [x] **移除 SSR 运行时模式** — 删除 renderPageToString()、build.ts SSR bundle
- [x] **移除 GLOBAL_BUILT** — 仅用 KissBuildContext 实例级标记
- [x] **移除正则 Island 检测** — 改用构建时扫描的 __islandMap
- [x] **解耦 FrameworkOptions.ui** — 新增 inject 通用选项，ui 标记 deprecated
- [x] **移除 ssr.preRender 选项** — DIA 下 SSG 永远开启
- [x] **RPC call() 异常化** — 抛出 RpcError，不再返回 null
- [x] **修复 package.json name** — @kiss/core → @kissjs/core
- [x] **删除 generateServerEntry** — DIA 无运行时服务器

### 4B: DIA 文档建立（已完成）

- [x] **新建 DIA 文档页** — guide/dia.ts，四支柱（声明即内容替代降级即内容）+ 分层原则 + DSD 桥梁 + Island 决策树
- [x] **重写 design-philosophy** — 融入 DIA 引用、分层原则、移除 Level 4 SPA
- [x] **重写 islands** — 移除 Level 4 SPA、加 DSD 说明、加 Island 决策树
- [x] **修改 architecture** — 移除 Dual build、加 DSD 输出说明
- [x] **修改 deployment** — 移除 SSR Deployment，只保留静态部署
- [x] **修改 configuration** — 加 inject 选项、标记 ui deprecated
- [x] **修改 getting-started / ssg / web-awesome** — 更新配置示例（inject 替代 ui）
- [x] **修改 error-handling** — 明确 SSR 仅构建时
- [x] **更新 layout.ts** — footer PIA→DIA、sidebar 加 DIA 链接
- [x] **重写 README.md** — PIA→DIA、四支柱改名、加 DSD + 分层原则
- [x] **重写 ROADMAP.md** — Phase 4B 更新

### 4C: Shadow DOM + DSD 恢复（待开始）

- [ ] **恢复 layout.ts Shadow DOM** — 移除 `createRenderRoot() { return this }`，恢复默认 Shadow DOM
- [ ] **验证 SSG DSD 输出** — 确认 @lit-labs/ssr v3 输出 `<template shadowrootmode="open">`
- [ ] **sidebar 折叠** — 用 `<details>/<summary>` 替代 JS 折叠（L0 分层原则）
- [ ] **sidebar active 高亮** — 构建时输出 `aria-current="page"` + CSS（L0+L1 替代 active-highlight Island）
- [ ] **删除 active-highlight Island** — 被 aria-current + CSS 替代
- [ ] **重构 copy-code Island** — 改为 `<code-block>` Shadow DOM Island + Clipboard API（方案 A）
- [ ] **验证 DSD polyfill** — @webcomponents/template-shadowroot 在旧浏览器回退
- [ ] **无 JS 降级测试** — 禁用 JS 验证 DSD 内容可见

### 4D: 测试与验证（待开始）

- [ ] 更新现有测试适配 DIA 变更
- [ ] SSG 集成测试：构建 → 验证 HTML 输出含 DSD + Island 水合脚本
- [ ] DSD 渲染测试：验证 Shadow DOM 内容在 JS 前可见
- [ ] 分层原则验证：确认无 Island 做了 CSS 能做的事
- [ ] CI 矩阵（Node 20/22 + Deno 2.x）

---

## Phase 5：生态验证

- [ ] **blog 示例** — SSG + Islands，Markdown 渲染
- [ ] **@kiss/docs-kit** — 从文档站抽取 Lit + Open Props 组件库
- [ ] **文档站用 docs-kit 重写** — dogfooding
- [ ] **发布 @kissjs/core@0.2.0** — DIA 合规版本
- [ ] **CHANGELOG.md**

---

## 已解决的技术债

| 问题 | 状态 |
|------|------|
| hono-entry.ts 全字符串拼接 | 已重构为 EntryDescriptor + renderEntry |
| 8 插件闭包共享可变状态 | 已提取 KissBuildContext |
| SSR 运行时模式 | 已移除（DIA） |
| GLOBAL_BUILT 模块级变量 | 已移除 |
| Island 正则检测 | 已改为构建时 map |
| CORS process.env | 已改为配置驱动 |
| RPC call() 返回 null | 已改为抛出 RpcError |
| FrameworkOptions.ui 硬编码 WebAwesome | 已新增 inject 通用选项 |
| PIA "降级即内容" 误读导致 light DOM | DIA "声明即内容" + DSD 纠正（Phase 4C） |

## 仍存在的技术债

| 问题 | 优先级 |
|------|--------|
| entry-renderer.ts 生成的代码仍使用字符串拼接（非 MagicString source map） | 中 |
| html-template.ts 仍使用 declare module 'vite' 扩展 | 低 |
| layout.ts 使用 light DOM（应恢复 Shadow DOM + DSD） | 高（Phase 4C） |
| active-highlight Island 做 CSS 能做的事 | 高（Phase 4C） |
| copy-code Island 突破 Shadow DOM 边界 | 高（Phase 4C） |

---

## 架构概览（DIA）

```
用户视角：vite.config.ts
┌─────────────────────────────────────────┐
│  import { kiss } from '@kissjs/core'     │
│  export default defineConfig({           │
│    plugins: [kiss()]                     │
│  })                                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         @kissjs/core (8 子插件)          │
│                                          │
│  1. kiss:core         — 路由扫描          │
│  2. kiss:virtual-entry — 虚拟模块        │
│  3. @hono/vite-dev-server — dev only     │
│  4. island-transform    — AST 标记       │
│  5. island-extractor    — 依赖分析       │
│  6. html-template       — HTML 注入      │
│  7. kiss:ssg            — DIA 产物生成   │
│  8. kiss:build          — Island 客户端  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────▼──────────┐
    │  dist/ (纯静态)      │
    │  ├── index.html      │ ← 含 DSD
    │  ├── about/          │
    │  │   └── index.html  │ ← 含 DSD
    │  └── client/         │
    │      └── islands/    │ ← Island JS
    └─────────────────────┘
```

### 生产部署流程

```
deno task build
    │
    ├─ @lit-labs/ssr 渲染所有页面 → dist/**/*.html (含 DSD)
    ├─ Island 组件打包            → dist/client/islands/
    └─ 非 Island 组件             → 不输出任何客户端 JS
    │
    ▼
  任何静态托管（CDN / GitHub Pages / Nginx / S3）
  DSD 让 Shadow DOM 内容在 JS 加载前可见
  零运行时进程
```

---

*路线图版本：v6.0 | 更新日期：2026-04-25 | Phase 4 DIA 进行中*
