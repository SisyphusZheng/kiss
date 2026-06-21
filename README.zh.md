# openElement

[English](./README.md) | 简体中文

**JSX-first Web Components 全栈框架。当前包线：`0.40.8`（`v0.40.8`）。当前执行线：Cleanup-Train Patch。**

openElement 使用 Web Components、JSX/VNode 渲染、渐进式 islands、API routes，以及 Vite + Nitro 输出，构建静态优先的全栈应用。Shadow/DSD 是默认组件渲染模式；light DOM 是显式 opt-in。

强制项目流程见 [`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md)。

## 快速开始

```bash
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

## 产品矩阵

```text
openElement = Elements + UI + Framework + Protocols
```

| 产品      | Surface                                   | 角色                                                              |
| --------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Elements  | `@openelement/element`, `OpenElement`     | 原生 Web Components authoring layer，对标 Lit 和 FAST。           |
| UI        | `@openelement/ui`                         | 基于 Elements 模型的一方 `open-*` 组件库。                        |
| Framework | `@openelement/app`, `@openelement/create` | Pages、layouts、islands、API routes、Vite + Nitro build/runtime。 |
| Protocols | `@openelement/protocol`                   | Runtime-free replacement boundaries 和 conformance contracts。    |

支持包包括 `@openelement/core`、`@openelement/adapter-vite`、`@openelement/signal`、`@openelement/router`、`@openelement/content` 和 `@openelement/ssg`。它们支撑四个产品，但不是独立的一线产品。

v0.40.x 当前 workspace 收敛为 11 个包。Hub、RPC、CEM、compat-check、Lit/React/vanilla interop adapters，以及 standalone runtime/style-sheet/i18n 包已退出当前包图；`@openelement/ssg` 保留为 adapter-agnostic SSG engine。`@preact/signals-core` 是默认 signal engine，`alien-signals` 作为可选 engine 保留。

v1.0 目标是稳定的四产品平台，冻结 Elements、UI、Framework、Protocols 的公开契约。

## 示例

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello openElement</main>;
  },
});
```

组件作者优先使用 `@openelement/element`：

```tsx
import { OpenElement, signal, StyleSheet } from '@openelement/element';
```

## 文档

| 主题         | 链接                                                                 |
| ------------ | -------------------------------------------------------------------- |
| 项目状态     | [docs/status/STATUS.md](./docs/status/STATUS.md)                     |
| 路线图       | [docs/roadmap/ROADMAP.md](./docs/roadmap/ROADMAP.md)                 |
| 当前版本计划 | [docs/current/VERSION_PLAN.md](./docs/current/VERSION_PLAN.md)       |
| 包表面       | [docs/current/PACKAGE_SURFACE.md](./docs/current/PACKAGE_SURFACE.md) |
| ADR          | [docs/adr/](./docs/adr/)                                             |

## 许可

MIT
