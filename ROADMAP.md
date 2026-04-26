# KISS 实现路线图

> KISS Architecture: Knowledge · Isolated · Semantic · Static — 从 PoC 到 v1.0

---

## 里程碑概览

| 阶段    | 名称                   | 核心目标                                    | 状态   |
| ------- | ---------------------- | ------------------------------------------- | ------ |
| Phase 0 | PoC                    | 技术可行性验证                              | 完成   |
| Phase 1 | Alpha                  | 核心插件包可用                              | 完成   |
| Phase 2 | 工程化补齐             | P0/P1 修复 + 架构重构                       | 完成   |
| Phase 3 | 文档整合               | docs-site → docs                            | 完成   |
| Phase 4 | KISS Architecture 落地 | K·I·S·S 四约束 + Jamstack 对齐 + 文档站改造 | 进行中 |
| Phase 5 | UI 革命                | @kissjs/ui 自有组件库 + 全栈示例            | 待开始 |

---

## Phase 0-3：已完成

见 git 历史和 MEMORY.md。

---

## Phase 4：KISS Architecture 落地（进行中）

### 4A: 核心 DIA 合规（已完成）

- [x] **移除 SSR 运行时模式** — 删除 renderPageToString()、build.ts SSR bundle
- [x] **移除 GLOBAL_BUILT** — 仅用 KissBuildContext 实例级标记
- [x] **移除正则 Island 检测** — 改用构建时扫描的 __islandMap
- [x] **解耦 FrameworkOptions.ui** — 新增 inject 通用选项，ui 标记 deprecated
- [x] **移除 ssr.preRender 选项** — SSG 永远开启
- [x] **RPC call() 异常化** — 抛出 RpcError，不再返回 null
- [x] **修复 package.json name** — @kiss/core → @kissjs/core
- [x] **删除 generateServerEntry** — 无运行时服务器

### 4B: DIA 文档建立（已完成）

- [x] **新建 DIA 文档页** — 四支柱 + 分层原则 + DSD 桥梁 + Island 决策树
- [x] **重写 design-philosophy** — 融入 DIA 引用、分层原则、移除 Level 4 SPA
- [x] **重写 islands** — 移除 Level 4 SPA、加 DSD 说明、加 Island 决策树
- [x] **修改 architecture** — 移除 Dual build、加 DSD 输出说明
- [x] **修改 deployment** — 移除 SSR Deployment，只保留静态部署
- [x] **修改 configuration** — 加 inject 选项、标记 ui deprecated
- [x] **修改 getting-started / ssg / web-awesome** — 更新配置示例
- [x] **更新 layout.ts** — footer 定位更新、sidebar 加 @kissjs/ui 链接
- [x] **重写 README.md** — DIA 五支柱 + Jamstack 对齐
- [x] **重写 ROADMAP.md** — Phase 4B 更新

### 4C: DIA + Jamstack 对齐（已完成）

- [x] **DIA 五支柱更新** — 新增"API 即后端"支柱，与 Jamstack A 对齐
- [x] **dia.ts 重写** — Jamstack 对齐图、JAM↔DIA 映射表、vs 表增加 Next.js 列
- [x] **design-philosophy.ts 更新** — 新增 DIA & Jamstack 章节、vs 表增加 Fresh
- [x] **architecture.ts 更新** — 新增 DIA=Jamstack 章节、全栈部署架构
- [x] **deployment.ts 更新** — 新增 API Routes Serverless 部署、全栈架构表
- [x] **README.md 重写** — DIA=Jamstack 定位、新增 API Routes 示例
- [x] **新增 kiss-ui.ts** — @kissjs/ui 组件库介绍与演进路线
- [x] **sidebar 更新** — 新增 @kissjs/ui 导航项

### 4D: KISS Architecture 重定义（已完成）

- [x] **架构重命名** — DIA → KISS Architecture (K·I·S·S 四约束)
- [x] **双重指代确立** — KISS = Keep It Simple, Stupid (哲学) + Knowledge/Isolated/Semantic/Static (架构)
- [x] **三范式继承文档** — Jamstack + Islands + Progressive Enhancement 继承关系
- [x] **Haskell 比喻** — KISS 架构是 Web 前端的"强类型系统"
- [x] **dia.ts 全面重写** — KISS Architecture 四约束 + 决策树 + 合规审查
- [x] **design-philosophy.ts 更新** — 五哲学支柱 vs KISS Architecture 关系映射
- [x] **architecture.ts 更新** — 插件表增加 KISS 约束列
- [x] **README.md 重写** — KISS Architecture 双重指代 + 四约束 + 三范式继承
- [x] **源码注释更新** — index.ts + build.ts DIA → KISS Architecture
- [x] **layout.ts 更新** — sidebar "KISS Architecture" + footer "K·I·S·S"
- [x] **PIA 残留清零** — 全项目搜索确认无残留

### 4E: Shadow DOM + DSD 恢复（已完成）

- [x] **恢复 layout.ts Shadow DOM** — 已确认恢复（无 createRenderRoot hack）
- [x] **验证 SSG DSD 输出** — 确认 @lit-labs/ssr v3 输出 `<template shadowrootmode="open">`
- [x] **sidebar 折叠** — 用 `<details>/<summary>` 替代 JS 折叠（L0 分层原则）
- [x] **sidebar active 高亮** — SSG post-processing 设置 `aria-current="page"` + CSS（K+S 约束）
- [x] **删除 active-highlight Island** — 已被 aria-current + CSS 替代
- [x] **code-block Island 验证** — Shadow DOM + Clipboard API + DSD 输出 + 客户端构建
- [x] **Island 客户端构建** — 自动生成入口（无需 app/client.ts），SSG 后路径重写
- [x] **验证 DSD polyfill** — @webcomponents/template-shadowroot 条件加载（仅旧浏览器）
- [x] **无 JS 降级测试** — SSG 输出 DSD 内容 JS 加载前可见（S 约束验证通过）

### 4F: 测试与验证（待开始）

- [ ] 更新现有测试适配 KISS Architecture 变更
- [ ] SSG 集成测试：构建 → 验证 HTML 输出含 DSD + Island 水合脚本
- [ ] DSD 渲染测试：验证 Shadow DOM 内容在 JS 前可见（S 约束）
- [ ] 分层原则验证：确认无 Island 做了 CSS 能做的事（I 约束）
- [ ] CI 矩阵（Node 20/22 + Deno 2.x）

---

## Phase 5：UI 革命与生态验证

- [ ] **@kissjs/ui 重构** — 基于 Open Props + Lit 构建自有 Web Components 组件库
  - 设计令牌：颜色、间距、字体（暗黑瑞士国际主义风格）
  - 核心组件：kiss-button, kiss-card, kiss-code-block, kiss-layout
  - KISS Architecture 合规：所有组件输出 DSD，Shadow DOM 封装
- [ ] **文档站用 @kissjs/ui 重写** — dogfooding，替换内联样式
- [ ] **全栈示例** — examples/fullstack，展示 SSG + API Routes + PWA
- [ ] **Hello World 重写** — examples/hello，用新 UI 库
- [ ] **发布 @kissjs/core@0.2.0** — KISS Architecture 合规版本
- [ ] **CHANGELOG.md**

---

## 已解决的技术债

| 问题                                  | 状态                                   |
| ------------------------------------- | -------------------------------------- |
| hono-entry.ts 全字符串拼接            | 已重构为 EntryDescriptor + renderEntry |
| 8 插件闭包共享可变状态                | 已提取 KissBuildContext                |
| SSR 运行时模式                        | 已移除                                 |
| GLOBAL_BUILT 模块级变量               | 已移除                                 |
| Island 正则检测                       | 已改为构建时 map                       |
| CORS process.env                      | 已改为配置驱动                         |
| RPC call() 返回 null                  | 已改为抛出 RpcError                    |
| FrameworkOptions.ui 硬编码 WebAwesome | 已新增 inject 通用选项                 |
| DIA 四支柱 → 五支柱                   | 已更新（新增"API 即后端"）             |
| DIA → KISS Architecture               | 已重定义（K·I·S·S 四约束）             |

## 仍存在的技术债

| 问题                                                                      | 优先级        |
| ------------------------------------------------------------------------- | ------------- |
| entry-renderer.ts 生成的代码仍使用字符串拼接（非 MagicString source map） | 中            |
| html-template.ts 仍使用 declare module 'vite' 扩展                        | 低            |
| 文档站内联样式碎片（每个页面重复 pillar/table/code-block 样式）           | 中（Phase 5） |

---

## 架构概览（KISS Architecture = Jamstack, Web Standards Native）

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
│  1. kiss:core         — 路由扫描 (K)     │
│  2. kiss:virtual-entry — 虚拟模块        │
│  3. @hono/vite-dev-server — dev only     │
│  4. island-transform    — AST 标记 (I)   │
│  5. island-extractor    — 依赖分析 (I)   │
│  6. html-template       — HTML 注入 (I)  │
│  7. kiss:ssg            — SSG 产物 (K+S) │
│  8. kiss:build          — Island JS (I)  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────▼──────────┐
    │  两个独立部署目标     │
    │                      │
    │  dist/ (静态前端)     │ ← K+I+S 约束
    │  ├── index.html      │ ← 含 DSD
    │  ├── about/          │
    │  │   └── index.html  │ ← 含 DSD
    │  └── client/         │
    │      └── islands/    │ ← Island JS (I)
    │                      │
    │  API Routes (Serverless) │ ← S 约束
    │  └── Hono handlers   │ ← 类型安全 RPC
    └──────────────────────┘
```

---

_路线图版本：v9.0 | 更新日期：2026-04-26 | KISS Architecture K·I·S·S_
