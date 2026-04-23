# ADR-001: HVL 硬约束 — 不可违背的设计边界

> **本文档是 HVL 框架的最高优先级约束。任何代码变更、依赖添加、构建配置修改都必须先通过本清单检查。违背任何一条即为 bug。**

---

## 一、构建约束

### C1: 纯 ESM，零 CJS

```
✅ 只输出 ESM 格式（.js + .d.ts）
❌ 不输出 CommonJS（.cjs / .cts / "main" / "require" 字段）
❌ 不使用 tsup（已替换为 Vite library mode）
❌ 不使用 module.exports / require()
```

**理由**：ESM 是 Web 标准。CJS 是遗留格式，违反 "Build=ESM" 原则。

**历史教训**：曾引入 tsup 并输出 CJS 格式，违背了设计哲学。已在减法审计中纠正。

### C2: 构建工具 = Vite，不用第二套

```
✅ Vite library mode 构建库包（vite.config.build.ts）
✅ vite-plugin-dts 生成 .d.ts
❌ 不引入 tsup / rollup 直接调用 / webpack / esbuild 单独使用
```

**理由**：Vite 已经是基于 Rollup 的构建工具，不需要第二套构建系统。

### C3: 不写 patch 脚本修补构建产物

```
✅ 用 Vite/Rollup 原生配置解决问题
❌ 不写 post-build 脚本修改产物（如 patch-node-prefix）
```

**理由**：post-build patch 说明构建配置本身有问题，应该修配置而不是修产物。

**历史教训**：曾写 patch-node-prefix.ts 修补 tsup 产物中的 node: 前缀，换成 Vite 后问题根源消失。

---

## 二、依赖约束

### C4: @hvl/vite 最多 3 个运行时依赖

```
✅ hono      — HTTP 层
✅ @lit-labs/ssr — SSR 渲染
✅ lit       — UI 层
❌ 不添加第 4 个运行时依赖，除非经过 ADR 审查
```

devDependencies 不受此限（如 vite, vite-plugin-dts, @types/node）。

**理由**：3 个依赖 = 3 层 Web Standards 的直接映射。每多一个依赖就多一个供应链风险和体积增量。

### C5: Zod / @hono/zod-validator 不属于框架依赖

```
✅ Zod 属于用户项目层面的选择
✅ @hono/zod-validator 属于用户项目层面的选择
❌ 不在 @hvl/vite 或 @hvl/rpc 的 dependencies 中添加 zod / @hono/zod-validator
```

**理由**：框架只提供 Hono RPC 类型推断能力（`hc<AppType>()`），不强制验证方案。用户可以用 Zod、Valibot、或不验证。

**历史教训**：曾将 zod 和 @hono/zod-validator 列为 @hvl/vite 依赖，实际上框架代码零引用。

### C6: 不引入 connect / picocolors / rimraf 等 Node 遗留依赖

```
✅ Deno 内置 TypeScript 支持（不添加 typescript devDep）
✅ Deno task 内置脚本能力（不添加 rimraf）
✅ Rollup 原生处理 node: 前缀（不添加 connect）
❌ 不为便利引入非标准库依赖
```

---

## 三、配置约束

### C7: 统一由 deno.json 管理，不恢复 tsconfig.json

```
✅ deno.json 作为唯一的 TS/编译配置源
✅ tsconfig.build.json 仅用于 vite-plugin-dts 生成 .d.ts（构建工具内部使用）
❌ 不恢复 tsconfig.base.json / 子包 tsconfig.json
❌ 不恢复 pnpm-workspace.yaml / pnpm-lock.yaml
```

**理由**：Deno 原生识别 deno.json，双份配置 = 维护负担 + 不一致风险。

### C8: 不引入 turbo.json / lerna / nx 等构建编排

```
✅ deno.json tasks 管理构建流程
❌ 不添加构建编排工具
```

**理由**：2 个包的 monorepo 不需要编排工具。

---

## 四、架构约束

### C9: 框架 = 1 个 Vite 插件

```
✅ framework() 返回 Plugin[]
✅ 所有能力通过 Vite 插件钩子实现
❌ 不创建独立的 CLI 工具 / 运行时包装器
❌ 不引入框架专属的配置文件格式（只用 vite.config.ts）
```

### C10: 不创建不存在的文件引用

文档中引用的文件必须实际存在。已删除的文件：

```
❌ plugin.ts       — 从未存在，framework() 在 index.ts 中
❌ build-ssr.ts    — 已合并到 build.ts
❌ build-client.ts — 已合并到 build.ts
❌ ssg.ts          — 从未实现
❌ hono-app.ts 不在 plugin.ts 下 — 它在 dev-server.ts 下
```

如果文档与代码不一致，以代码为准，更新文档。

### C11: 重复定义 = bug

```
✅ 每个类型/接口只在一个文件中定义
✅ 其他文件通过 import/re-export 引用
❌ 不在两个文件中分别定义同名接口
```

**历史教训**：SsrContext 曾在 types.ts 和 context.ts 重复定义，SpecialFileType 曾在 types.ts 和 route-scanner.ts 重复定义。

---

## 五、变更审查清单

每次提交 PR / commit 前，逐条检查：

```
[ ] 新增依赖？→ 是否违反 C4/C5/C6？
[ ] 修改构建配置？→ 是否违反 C1/C2/C3？
[ ] 新增配置文件？→ 是否违反 C7/C8？
[ ] 修改架构？→ 是否违反 C9/C10/C11？
[ ] 文档与代码一致？→ C10
```

---

## 变更日志

| 日期 | 变更 |
|------|------|
| 2026-04-23 | ADR-001 创建，记录减法审计中发现的所有设计违背教训 |

---

*本文档是活文档。每次发现新的设计违背，必须在此追加约束条目。*
