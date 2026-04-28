# KISS Framework 当前状态

> 最后更新: 2026-04-28

## JSR 发布状态

| 包             | 版本  | JSR 状态   | 说明                                                |
| -------------- | ----- | ---------- | --------------------------------------------------- |
| @kissjs/core   | 0.3.0 | ⏳ CI 待发 | 核心框架 — hydration 闭环 + KissRenderer + CLI 构建 |
| @kissjs/rpc    | 0.2.1 | ✅ 已发布  | RPC 客户端                                          |
| @kissjs/ui     | 0.3.0 | ⏳ CI 待发 | UI 组件库 — JSR 分发 dist/ 编译产物                 |
| @kissjs/create | 0.2.0 | ⏳ CI 待发 | 项目脚手架                                          |

## v0.3.0 变更

### Breaking Changes

- `@kissjs/ui` JSR 分发 `dist/` 编译产物（不再分发含 decorator 的 `src/`）
- `packageIslands` 现在完全可用 — JSR 消费者不再需要 alias 绕路
- `island-extractor.ts` 已删除（死代码）
- `entry-renderer.ts` hydration 脚本改调 `generateHydrationScript`（含 `hydrate()` + `removeAttribute`）

### 新功能

- **KissRenderer / KissMiddleware 接口**：`_renderer.ts` 和 `_middleware.ts` 有了 TypeScript 接口约束
- **CLI 构建脚本**：`build:client` + `build:ssg` 独立 deno task，支持逐步构建
- **create-kiss 模板**：内置 `packageIslands: ['@kissjs/ui']` 配置

### 修复

- Hydration 闭环完成：`defer-hydration` → `hydrate(el)` → `removeAttribute('defer-hydration')`
- packageIslands JSR 消费者可用（dist 分发解决 decorator 问题）
- docs 站删除 `kiss-theme-toggle.ts` 副本，改用 `packageIslands`
- ssg-integration.test.ts 过时断言已修复

## CI/CD

| 工作流      | 触发条件           | 状态                                        |
| ----------- | ------------------ | ------------------------------------------- |
| deploy.yml  | push main          | ✅ 自动部署到 GitHub Pages                  |
| publish.yml | deno.json 版本变更 | ✅ 自动发布到 JSR（UI 先 build 再 publish） |
| test.yml    | push/PR            | ✅ 测试全绿                                 |
| lint.yml    | push/PR            | ✅ deno lint + fmt                          |

## 技术栈

| 层     | 技术          | 版本   |
| ------ | ------------- | ------ |
| 运行时 | Deno          | ^2.x   |
| HTTP   | Hono          | ^4.x   |
| UI     | Lit           | ^3.x   |
| Build  | Vite          | ^6.x   |
| SSR    | @lit-labs/ssr | ^3.3.x |
| 类型   | TypeScript    | ^5.x   |

## 下一步

- [ ] 添加 docs build smoke test（CI 中验证 SSG 输出含 DSD + hydrate script）
- [ ] kiss-layout GitHub 链接可配置化
- [ ] entry-renderer snapshot 测试
- [ ] 评估 parse5 重构 ssg-postprocess
