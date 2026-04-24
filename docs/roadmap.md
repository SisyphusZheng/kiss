# KISS 实现路线图

> 从 PoC 到 v1.0 的完整实施计划

---

## 里程碑概览

| 阶段 | 名称 | 核心目标 | 时间 | 状态 |
|------|------|----------|------|------|
| **M0** | **PoC** | 技术可行性验证 | 1~2 天 | ✅ 完成 |
| **M1** | **Alpha** | 核心插件包可用 | ~1 周 | ✅ 完成 |
| **M2** | **Beta** | 工程化补齐 + 脚手架 | ~2 周 | 🔲 进行中 |
| **M3** | **RC** | 示例 + 文档完善 | ~3 周 | 🔲 |
| **M4** | **v1.0** | 生产可用 | ~4 周 | 🔲 |

---

## Phase 0：PoC 验证 ✅

> 🎯 目标：验证所有关键技术路径可行

### 完成项

- [x] **Vite SSR + Lit 渲染** — `ssrLoadModule()` + `@lit-labs/ssr` + Declarative Shadow DOM 输出
- [x] **Hono 中间件注入** — `@hono/vite-dev-server` 注册为 Vite 中间件
- [x] **Island 水合** — SSR 输出中检测 Island → 生成水合脚本 → Custom Element 注册
- [x] **双端构建** — SSR build + Client build（仅 Islands）

---

## Phase 1：核心包 ✅

> 🎯 目标：框架核心插件可用，开发者能创建基本项目

### 完成项

- [x] **kiss() 主入口** — 返回 8 个子插件的 Plugin[]
- [x] **虚拟模块系统** — `virtual:kiss-hono-entry` 动态生成 Hono app
- [x] **文件路由扫描** — `route-scanner.ts`，支持 `[param]` 动态路由、`_renderer`、`_middleware`
- [x] **Island 变换** — `island-transform.ts`，注入 `__island` / `__tagName` 标记
- [x] **Island 提取器** — `island-extractor.ts`，构建时依赖分析
- [x] **SSR 处理器** — `ssr-handler.ts`，Lit SSR + DSD + Island 收集
- [x] **SSG 生成** — 自研方案（替代 @hono/vite-ssg），`kiss:ssg` 子插件
- [x] **双端构建** — `build.ts`，SSR + Client 分离构建
- [x] **HTML 模板** — `html-template.ts`，预加载 + 水合注入
- [x] **错误层级** — `errors.ts`，8 个类型化错误类
- [x] **请求上下文** — `context.ts`，SsrContext + extractParams + parseQuery
- [x] **Re-export** — LitElement, html, css, Hono 等，用户只需 `from '@kissjs/core'`
- [x] **UI 插件** — `@kissjs/ui`，WebAwesome CDN 注入（集成到 kiss() 的 ui 选项）
- [x] **headExtras** — kiss() 新增 headExtras 参数 + ui.cdn 自动生成

### 发布

- @kissjs/core@0.1.5 → JSR
- @kissjs/rpc@0.1.2 → JSR
- @kissjs/ui@0.1.2 → JSR

### 测试覆盖

- 5 个测试文件：context, errors, island-transform, route-scanner, ssr-handler
- 未覆盖：build.ts, hono-entry.ts, html-template.ts

---

## Phase 2：工程化补齐 🔲

> 🎯 目标：修已知问题，补齐工程化短板

### P0 修复

- [ ] **删除悬空的 ./client 导出** — package.json 声明了但 src/client/ 为空
- [ ] **修正 CORS process.env** — 改用跨运行时兼容方式（Deno.env.get / env 参数）
- [ ] **清理 JSR 废弃包** — @kissjs/vite (v0.0.3) 和 @kissjs/ssg (v0.1.0) 添加废弃提示

### 测试补齐

- [ ] **hono-entry.ts 集成测试** — 核心管道目前零测试，是最大测试盲区
- [ ] **build.ts 测试** — 双端构建流程测试
- [ ] **@kissjs/rpc 功能测试** — RpcController 集成测试

### CI/CD

- [ ] **测试 CI** — push/PR 时自动运行 `deno test`
- [ ] **Lint/Format CI** — push 时运行 `deno lint` + `deno fmt --check`
- [ ] **JSR 发布 CI** — tag push 自动发布到 JSR

### 代码质量

- [ ] **减少类型断言** — 消除 `as any` / `as unknown as Plugin`
- [ ] **GLOBAL_BUILT 替代方案** — 改用配置传递或 Vite 内置机制防递归
- [ ] **/__kiss debug 端点** — 生产构建中移除或加保护
- [ ] **JSDoc 文档** — 为所有导出符号添加文档注释，提升 JSR 评分到 80%+

---

## Phase 3：`create-kiss` 脚手架 🔲

> 🎯 目标：一行命令创建项目

### 任务清单

- [ ] **CLI 入口** — 命令行参数解析（项目名、模板选择）
- [ ] **项目模板**
  - **minimal** — 纯 SSR（routes + components + server.ts）
  - **standard** — SSR + Islands（routes + islands + client.ts）
  - **full** — 全功能（standard + API routes + @kissjs/rpc）

```bash
deno run -A npm:create-kiss my-app --template standard
cd my-app && deno task dev
```

---

## Phase 4：示例与文档完善 🔲

> 🎯 目标：展示框架能力，降低上手门槛

### 示例应用

- [ ] **blog** — SSG + Islands（Markdown 渲染、代码高亮 Island）
- [ ] **dashboard** — SSR + RPC（数据可视化、实时更新）

### 文档完善

- [ ] **API 参考** — 自动生成（基于 JSDoc + api-extractor）
- [ ] **迁移指南** — 从 Astro / Next.js / Nuxt 迁移
- [ ] **CHANGELOG.md** — 版本变更跟踪

---

## Phase 5：高级功能 🔲

> 🎯 目标：实现 Level 2~4 渐进增强

- [ ] **Level 2: SPA 导航** — 基于 Navigation API / History API 的客户端路由
- [ ] **Level 3: 实时功能** — SSE / WebSocket 支持（Hono WebSocket 中间件）
- [ ] **Level 4: 全页 CSR** — 框架级 escape hatch

---

## 已知技术债

| 问题 | 影响 | 优先级 |
|------|------|--------|
| hono-entry.ts 全字符串拼接代码生成 | 不可测试/不可调试/不可类型检查 | 高 |
| 8 插件闭包共享可变状态 | 无法独立测试插件 | 中 |
| Island 正则匹配 HTML 检测 | 注释/属性中 tag name 会误判 | 中 |
| wrapDocument 硬编码标题和语言 | 不可配置 | 低 |

---

## 架构概览

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
│  1. kiss:core         — configResolved   │
│     + buildStart（路由扫描 + 虚拟模块）  │
│  2. kiss:virtual-entry — 虚拟模块提供    │
│  3. @hono/vite-dev-server — dev 模式     │
│  4. island-transform    — AST 标记       │
│  5. island-extractor    — 构建时依赖分析  │
│  6. html-template       — HTML 注入      │
│  7. kiss:ssg            — 静态站点生成    │
│  8. kiss:build          — 双端构建       │
└──────────────────────────────────────────┘
```

### 包结构

```
kiss/
├── packages/
│   ├── kiss-core/          # @kissjs/core — 核心框架
│   │   └── src/
│   │       ├── index.ts         # 主入口，kiss() 函数
│   │       ├── hono-entry.ts    # Hono app 虚拟模块生成
│   │       ├── ssr-handler.ts   # Lit SSR 渲染协调
│   │       ├── island-transform.ts  # Island AST 检测
│   │       ├── island-extractor.ts  # Island 依赖分析
│   │       ├── route-scanner.ts     # 文件路由扫描
│   │       ├── build.ts            # 双端构建
│   │       ├── html-template.ts    # HTML 文档模板
│   │       ├── context.ts          # 请求上下文
│   │       ├── errors.ts           # 类型化错误层级
│   │       └── types.ts            # 公共类型
│   ├── kiss-rpc/            # @kissjs/rpc — RPC 客户端
│   │   └── src/index.ts         # RpcController + RpcError
│   └── kiss-ui/             # @kissjs/ui — UI 插件
│       └── src/index.ts         # WebAwesome CDN 注入
├── examples/
│   ├── poc/                 # PoC 示例
│   └── minimal-blog/        # 博客示例
├── docs-site/               # 自举文档站（用 KISS 构建）
├── docs/                    # 设计文档
├── deno.json                # Deno workspace 配置
└── README.md
```

---

*路线图版本：v2.0 | 更新日期：2026-04-24 | Phase 0-1 已完成，Phase 2 进行中*
