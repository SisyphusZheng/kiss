# KISS 实现路线图

> 从 PoC 到 v1.0 的完整实施计划

---

## 里程碑概览

| 阶段 | 名称 | 核心目标 | 状态 |
|------|------|----------|------|
| **Phase 0** | **PoC** | 技术可行性验证 | ✅ 完成 |
| **Phase 1** | **Alpha** | 核心插件包可用 | ✅ 完成 |
| **Phase 2** | **工程化补齐** | P0/P1 修复 + 架构重构 + 测试 | ✅ 完成 |
| **Phase 3** | **文档整合** | docs-site → docs 重命名 + 冗余清理 | ✅ 完成 |
| **Phase 4** | **生态验证** | examples + v0.2.0 发布 | 🔲 |
| **Phase 5** | **高级功能** | Level 2~4 渐进增强 | 🔲 |

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

---

## Phase 2：工程化补齐 ✅

> 🎯 目标：修已知问题，补齐工程化短板

### P0 修复 ✅

- [x] **删除悬空的 ./client 导出** — package.json 声明了但 src/client/ 为空 → 已删除
- [x] **修正 CORS process.env** — 改用配置驱动 `middleware.corsOrigin`
- [x] **/__kiss debug 端点** — SSG 构建不再包含，仅 dev 模式生效
- [x] **wrapDocument 硬编码** — `lang` 和 `title` 改为可配置
- [x] **源文件注释统一** — @kiss/vite → @kissjs/core（11 个文件）

### P1 架构重构 ✅

- [x] **hono-entry.ts 模板化** — 270 行字符串拼接 → EntryDescriptor 数据模型 + renderEntry 纯函数 + 薄层组合
- [x] **KissBuildContext** — 替代闭包共享可变状态
- [x] **GLOBAL_BUILT 双层检查** — ctx.clientBuildTriggered + 模块级安全网
- [x] **renderSsrError dev/prod** — 支持 dev 模式详细错误 + prod 模式安全错误
- [x] **wrapInDocument lang** — 支持 `lang` 选项，不再硬编码 `en`

### 测试补齐 ✅

- [x] **hono-entry.ts 集成测试** — 19 个新测试
- [x] **修复 2 个坏测试** — ssr-handler + island-transform
- [x] **全量测试通过** — 31 passed / 0 failed

### 未完成项（降级至后续 Phase）

- [ ] **build.ts 测试** — 双端构建流程测试
- [ ] **@kissjs/rpc 功能测试** — RpcController 集成测试
- [ ] **CI/CD** — lint/test/publish 工作流已创建，deploy 需修复
- [ ] **减少类型断言** — 消除 `as any` / `as unknown`
- [ ] **JSDoc 文档** — 为所有导出符号添加文档注释

---

## Phase 3：文档整合 ✅

> 🎯 目标：消除文档双轨制，统一为 docs/（自举文档站）

### 完成项

- [x] **docs-site → docs 重命名** — 消除 docs/ markdown 和 docs-site/ 两套系统的冗余
- [x] **删除 15 个冗余 markdown** — docs/*.md 内容已在文档站页面覆盖
- [x] **配置同步更新** — deno.json workspace/tasks、deploy.yml、deno.lock
- [x] **roadmap.md 移至根目录** — 保留为内部规划文档
- [x] **README.md 链接更新** — docs/*.md 链接改为文档站 URL

### 为什么不需要 create-kiss 脚手架

过五大支柱审查：

| 支柱 | 判断 |
|------|------|
| **最小增幅** | ❌ 新增 npm 包、3 套模板 = 造轮子 |
| **Web Standards** | ⚠️ 不违反，但不增益 |
| **无框架绑定** | ✅ 不影响 |
| **无Runtime绑定** | ✅ 不影响 |
| **渐进增强** | ❌ 脚手架引导一步到位，与渐进增强精神背道而驰 |

KISS 的核心体验是"从零开始，按需增强"。6 行命令就能创建项目，不需要脚手架喂饭。
替代方案：getting-started 页面做好 + README 的 Copy-paste setup 代码块。

---

## Phase 4：生态验证 🔲

> 🎯 目标：用真实场景验证框架能力，发布稳定版本

### 任务清单

- [ ] **blog 示例** — SSG + Islands，Markdown 渲染、代码高亮 Island（KISS 最核心场景）
- [ ] **改进 poc 示例** — 让它能 `deno task dev` 直接跑起来
- [ ] **发布 @kissjs/core@0.2.0** — Phase 2+3 完成后的稳定版本
- [ ] **CHANGELOG.md** — 版本变更跟踪

---

## Phase 5：高级功能 🔲

> 🎯 目标：实现 Level 2~4 渐进增强

- [ ] **Level 2: SPA 导航** — 基于 Navigation API / History API 的客户端路由
- [ ] **Level 3: 实时功能** — SSE / WebSocket 支持（Hono WebSocket 中间件）
- [ ] **Level 4: 全页 CSR** — 框架级 escape hatch

---

## 已知技术债

| 问题 | 影响 | 优先级 | 状态 |
|------|------|--------|------|
| ~~hono-entry.ts 全字符串拼接代码生成~~ | ~~不可测试/不可调试/不可类型检查~~ | ~~高~~ | ✅ 已重构为模板化 |
| ~~8 插件闭包共享可变状态~~ | ~~无法独立测试插件~~ | ~~中~~ | ✅ 已提取 KissBuildContext |
| Island 正则匹配 HTML 检测 | 注释/属性中 tag name 会误判 | 中 | 待改用 AST |
| ~~wrapDocument 硬编码标题和语言~~ | ~~不可配置~~ | ~~低~~ | ✅ 已可配置 |
| 类型断言 `as any` / `as unknown` | 2 处，丢失类型安全 | 低 | 待修复 |
| docs CI 不可用 | GitHub Pages 无法自动部署 | 高 | ✅ 已修复 |

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
│   │       ├── index.ts             # 主入口，kiss() 函数
│   │       ├── hono-entry.ts        # Hono app 虚拟模块生成（薄层）
│   │       ├── entry-descriptor.ts  # EntryDescriptor 数据模型 + builder
│   │       ├── entry-renderer.ts    # EntryDescriptor → 代码字符串（纯函数）
│   │       ├── build-context.ts     # KissBuildContext 插件间共享状态
│   │       ├── ssr-handler.ts       # Lit SSR 渲染协调
│   │       ├── island-transform.ts  # Island AST 检测 + 水合脚本
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
│   └── poc/                 # PoC 示例
├── docs/                    # 自举文档站（用 KISS 构建，兼项目文档）
├── deno.json                # Deno workspace 配置
└── README.md
```

---

*路线图版本：v4.0 | 更新日期：2026-04-24 | Phase 0-2 已完成，Phase 3 进行中*
