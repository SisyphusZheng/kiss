# KISS 设计哲学

> **KISS = Keep It Simple, Stupid.**
> 不是口号，是每个设计决策的过滤器。

---

## 我们相信什么

### 一、Web Standards 优先
「不是用标准，而是就是标准」

大多数框架"支持"Web Standards。KISS"就是"Web Standards。

| 层 | 标准 | KISS 的做法 |
|----|------|-------------|
| HTTP | Fetch API | Hono 直接暴露，不封装 `Request`/`Response` |
| UI | Web Components | Lit 就是标准 Custom Elements，不抽象 |
| 构建 | ESM | Vite 输出纯 ESM，不发明格式 |
| 类型 | TypeScript | 原生 Deno 支持，不额外编译 |

**你的代码不依赖 KISS 抽象。换掉 KISS，Hono/Lit/Vite 代码仍在。**

⚠️ **硬约束**
- 纯 ESM 零 CJS，不输出 `.cjs`/`.cts`
- 不引入第二套构建工具（只用 Vite）
- 不写 patch 脚本修补产物

---

### 二、最小增幅（不重复造轮子）
「框架应该看不见」

KISS 不发明新东西。它只是把已有标准工具，用最小代价连接。

```
大多数框架的做法：
  发明自己的路由 → KISS：用 Hono（已有标准 HTTP 库）
  发明自己的组件模型 → KISS：用 Lit（已有 Web Components 标准）
  发明自己的构建系统 → KISS：用 Vite（已有 ESM 构建标准）
  发明自己的类型方案 → KISS：用 Hono RPC（已有类型推断）
```

**KISS = 1 个 Vite 插件（连接层，非新抽象）**

框架增量：
- 零交互页面：**0 KB** KISS 运行时
- 单 Island：**~6 KB**（Lit 本身，非 KISS 开销）
- 整套框架：**< 20 KB**

⚠️ **硬约束**
- 优先复用 Hono / Vite / Lit 生态，不重复造轮子
- 不写 post-build patch 脚本
- 不发明新抽象层（新增依赖必须有明确理由，并记录于 ADR）
- 新增依赖需审慎评估：是否必要？是否有更轻的替代？能否复用已有生态？

---

### 三、无框架绑定
「推荐，不是强制」

KISS 推荐 Lit，但你可以用别的。

| 选择点 | KISS 推荐 | 你可以换成 |
|---------|-----------|------------|
| UI 框架 | Lit | 原生 Web Components / 其他 |
| 验证 | Zod | Valibot / 不验证 |
| RPC | @kiss/rpc | 直接用 Hono `hc()` |

**你可以只用 `@kiss/core` 做 SSR，不用 Lit。**
**你可以只用 Lit，不用 KISS。**

⚠️ **硬约束**
- 不将 Lit 设为强制 `peerDependency`
- 不强制验证方案（Zod 是用户选择，非框架依赖）

---

### 四、无 Runtime 绑定
「代码一次编写，任意地方运行」

KISS 不绑定任何 JS 运行时。

| 开发时 | 构建产物 | 运行时 |
|--------|---------|--------|
| Deno（类型检查、任务运行） | 纯 ESM | Deno / Node / Bun / CF Workers |

**大多数框架：**
- Next.js → Node.js only
- Remix → Node.js only
- Nuxt → Node.js only

**KISS：** 纯 ESM 产物，任意支持 ESM 的运行时。

⚠️ **硬约束**
- 不写平台专属代码（如 `Deno.serve` 硬编码）
- `deno.json` 是开发工具配置，不是运行时依赖

---

### 五、渐进增强
「用户决定复杂度」

KISS 默认零 JS，按需增强。

| Level | 内容 | JS 体积 | 适用场景 |
|-------|------|---------|----------|
| 0 | 纯 HTML + DSD | **0 KB** | 内容站点 |
| 1 | HTML + 最小增强 | **~2 KB** | 表单交互 |
| 2 | 部分 Island 水合 | **~6 KB/island** | 局部交互 |
| 3 | 全页面水合 | 用户选择 | SPA 体验 |
| 4 | SPA 模式 | 用户选择 | 实时应用 |

**大多数框架：React 应用，100 KB 起。**
**KISS：静态页面，0 KB 起。**

⚠️ **硬约束**
- 不强制任何 Level
- 每层完全可选

---

## 变更审查清单

每次提交前，问自己这五个问题：

```
1. 新增依赖？     → 是否违背「最小增幅」？
2. 修改构建？     → 是否违背「Web Standards 优先」？
3. 新抽象？       → 是否在不必要地重复造轮子？
4. 平台专属代码？ → 是否违背「无 Runtime 绑定」？
5. 强制选择？     → 是否违背「无框架绑定」？
```

**任何一个「是」→ 需要 ADR（Architecture Decision Record）记录理由。**

---

## 和竞品的本质区别

| 框架 | HTTP 层 | UI 层 | 构建输出 | 运行时绑定 | 全链路 Standards |
|------|---------|--------|----------|------------|-----------------|
| Next.js | 自有抽象 | React 强制 | 私有格式 | Node.js | ❌ |
| Remix | Web APIs | React 强制 | 私有格式 | Node.js | ⚠️ 部分 |
| Astro | 自有抽象 | 任意(但抽象) | ESM | 无 | ⚠️ 部分 |
| **KISS** | **Fetch API 直用** | **Web Components 直用** | **纯 ESM** | **无** | **✅ 3/3** |

**KISS 是唯一全链路 Web Standards 的全栈框架。**

---
*本文档是活文档。每次设计决策，先过这五个支柱。*
