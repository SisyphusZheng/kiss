# HVL 实现路线图

> 从 PoC 到 v1.0 的完整实施计划

---

## 里程碑概览

| 阶段 | 名称 | 核心目标 | 时间 |
|------|------|----------|------|
| **M0** | **PoC** | 技术可行性验证 | 1~2 天 |
| **M1** | **Alpha** | 核心插件包可用 | ~1 周（累计） |
| **M2** | **Beta** | RPC + 脚手架就绪 | ~2 周（累计） |
| **M3** | **RC** | 示例 + 文档完成 | ~3 周（累计） |
| **M4** | **v1.0.4** | 生产可用 | ~4 周（累计） |

---

## Phase 0：PoC 验证（1~2 天）

> 🎯 目标：验证所有关键技术路径可行

### 任务清单

- [x] **Vite SSR + Lit 渲染**
  - 使用 `server.ssrLoadModule()` 加载 Lit 组件
  - 使用 `@lit-labs/ssr` 渲染为 HTML
  - 输出包含 Declarative Shadow DOM 的完整 HTML

- [x] **Hono 中间件注入**
  - 在 `configureServer` 中注册 Hono 为 Vite 中间件
  - 验证请求能正确转发到 Hono 处理器
  - 验证 Response 能正确回传到浏览器

- [x] **Island 水合**
  - 在 SSR 输出中检测 Island 组件标记
  - 生成水合脚本，按需加载 Island JS
  - 验证 Custom Element 注册和水合流程

- [x] **双端构建**
  - `build.ssr: true` 生成服务端产物
  - `build.rollupOptions.input: client` 生成客户端产物（仅 Islands）
  - 验证两套产物能独立运行

### 产出物

```
pocs/
├── ssr-lit/          # Vite SSR 加载 + Lit 渲染验证
├── hono-middleware/   # Hono 作为 Vite 中间件验证
├── island-hydrate/    # Island 检测 + 水合验证
└── dual-build/        # 双端构建验证
```

### 成功标准

| 指标 | 标准 |
|------|------|
| SSR 渲染 | 能输出带 DSD 的有效 HTML |
| Hono 集成 | API 和页面路由都能正常响应 |
| Island 水合 | 浏览器中 Island 组件可交互 |
| 双端构建 | 服务端和客户端产物分别可用 |

---

## Phase 1：@hvl/vite 核心包（3~5 天）

> 🎯 目标：框架核心插件可用，开发者能创建基本项目

### 模块开发顺序

#### Day 1~2：插件骨架与开发服务器

- [x] **插件入口 (`index.ts`)**
  - 导出 `framework()` 函数
  - 支持配置选项（routesDir, islandsDir 等）
  - 合并所有子插件为 Plugin[]

- [x] **Hono 应用 (`hono-app.ts`)**
  - 创建 Hono 实例
  - 注册中间件链
  - 导出 app 供外部扩展

- [x] **开发服务器 (`dev-server.ts`)**
  - `configureServer` 钩子实现
  - 注入 Hono 到 Vite 中间件栈
  - 处理请求/响应转换（Node.js Request ↔ Hono Request）

- [x] **SSR 处理器 (`ssr-handler.ts`)**
  - 协调 Vite SSR 加载和 Lit 渲染
  - 请求上下文传递（props、params、query）
  - 错误边界处理

#### Day 3~4：路由与 Island 系统

- [x] **文件路由扫描 (`route-scanner.ts`)**
  - 扫描 `app/routes/` 目录
  - 解析文件名生成路径模式（index → /, about.ts → /about, posts/[id].ts → /posts/:id）
  - 生成 `virtual:routes` 虚拟模块
  - 支持 layout（_renderer.ts）、middleware（_middleware.ts）

- [x] **Island 变换 (`island-transform.ts`)**
  - 检测 `/app/islands/` 路径下的组件
  - 注入 `__island` / `__tagName` 导出
  - 自动生成 Custom Element 注册代码
  - 提取 Island 依赖图

- [x] **Island 提取器 (`island-extractor.ts`)**
  - 构建时分析 Island 依赖
  - 生成 Island 映射表（tag name → chunk）
  - 确保仅打包必要的 Island JS

#### Day 5：双端构建与 HTML 模板

- [x] **双端构建 (`build.ts`)**
  - SSR 构建：`ssr: true` + `noExternal` 排除列表
  - 客户端构建：仅 Islands + 水合脚本入口
  - 代码分割策略

- [x] **HTML 模板 (`html-template.ts`)**
  - `transformIndexHtml` 钩子
  - 注入预加载标签、样式链接
  - 条件注入 Island 水合脚本
  - meta 标签管理

### 产出物

```typescript
// 用户使用方式
import framework from '@hvl/vite'

export default defineConfig({
  plugins: [
    framework({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
    })
  ]
})
```

### 成功标准

| 指标 | 标准 |
|------|------|
| 开发服务器 | `vite dev` 启动后页面可访问 |
| 文件路由 | 新增 .ts 文件自动成为路由 |
| SSR | 页面渲染为含 DSD 的 HTML |
| Island | 交互组件正常工作 |
| 构建 | `vite build` 生成双端产物 |

---

## Phase 2：@hvl/rpc（1~2 天）

> 🎯 目标：端到端类型安全的 RPC 通信

### 任务清单

- [x] **RPC 客户端封装**
  - 封装 Hono `hc()` 函数
  - 泛型约束 `hc<AppType>()`
  - 自动推断请求/响应类型

- [x] **Lit ReactiveController 集成**
  - 创建 `RpcController` controller
  - 组件内声明式调用 API
  - loading/error 状态管理

- [ ] **功能测试**
  - @hvl/rpc 独立功能测试（当前只有构建测试）
  - RpcController 集成测试

### 产出物

```typescript
// 服务端
const routes = app.post('/api/posts',
  zValidator('json', z.object({ title: z.string() })),
  (c) => c.json({ ok: true }, 201)
)
export type AppType = typeof routes

// 客户端 — 完全类型安全
import { hc } from '@hvl/rpc'
import type { AppType } from '../server'

const client = hc<AppType>('/')
// client.api.posts.$post({ json: { title: ... } })  ← 自动补全！
```

---

## Phase 3：create-hvl 脚手架（1~2 天）

> 🎯 目标：一行命令创建项目

### 任务清单

- [ ] **CLI 入口 (`index.ts`)**
  - 命令行参数解析（项目名、模板选择）
  - 项目目录初始化
  - Git 初始化

- [ ] **项目模板**

  **minimal 模板（纯 SSR）：**
  ```
  app/routes/index.ts          # 首页
  app/components/header.ts     # Header
  server.ts                    # 服务端入口
  vite.config.ts               # framework() 插件
  ```

  **standard 模板（SSR + Islands）：**
  ```
  app/routes/index.ts          # 首页
  app/routes/about.ts          # 关于页
  app/islands/counter.ts       # 计数器 Island
  app/islands/theme-toggle.ts  # 主题切换 Island
  app/components/              # 布局组件
  server.ts                    # 服务端入口
  client.ts                    # 客户端入口
  ```

  **full 模板（全功能）：**
  ```
  包含 standard 所有内容 +
  app/routes/api/posts.ts      # API 路由
  @hvl/rpc 类型安全集成
  ```

### 产出物

```bash
# 用户使用方式
deno run -A npm:create-hvl my-app --template standard
cd my-app && deno task dev
```

---

## Phase 4：示例应用与文档（2~3 天）

> 🎯 目标：展示框架能力，降低上手门槛

### 示例应用

#### blog（博客 — SSG + Islands）
- Markdown 渲染引擎
- 代码高亮 Island
- 评论系统 Island
- RSS 订阅

#### dashboard（仪表盘 — SSR + RPC）
- 数据可视化图表 Island
- 实时数据更新 (SSE)
- 表格排序/筛选 Island
- 响应式布局

#### todo-app（Todo — 全功能）
- CRUD 操作
- 拖拽排序 Island
- 过滤/搜索
- PWA 离线支持

### 文档

- 快速开始指南
- API 参考
- 迁移指南（从其他框架）
- 部署指南（各平台）
- 最佳实践

---

## 风险缓解计划

| 风险 | 缓解措施 | 应急方案 |
|------|---------|----------|
| `@lit-labs/ssr` 模块解析问题 | 锁定版本 + ssr.noExternal 配置 | 自研轻量 SSR 替代 |
| DSD 兼容性 | 条件加载 polyfill | 降级为 Light DOM 输出 |
| Vite SSR 边缘限制 | 构建时 SSG 预渲染 | Node.js only 部署选项 |
| Island 过度提取 | tree-shaking + 手动标记 | 显式导入声明 |

---

## 资源需求

- **开发环境**：Deno 2.x+、TypeScript 5.x
- **参考项目**：vike（vite-plugin-ssr）、Astro Island 架构、Hono RPC
- **测试环境**：Chrome/Firefox/Safari 最新版、Node.js LTS
- **CI/CD**：GitHub Actions（多运行时矩阵测试）

---

*路线图版本：v1.1 | 创建日期：2026-04-22 | 更新日期：2026-04-23 | Phase 0-1 checkbox 已勾选*
