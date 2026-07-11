# openElement

[English](./README.md) | 简体中文

**以 Web Components 为原生组件模型的全栈框架，并内置 JSX-first Basic Element
authoring layer。当前包线：`0.41.0-alpha.8`（`v0.41.0-alpha.8` 发布）。当前执行线：v0.41.0-alpha.7 Dogfood、架构收口与采用准备。**

openElement 把 Web Components 当作应用的原生组件模型，使用 JSX/VNode 渲染、渐进式 islands、API routes，以及 Vite + Nitro 输出，构建静态优先的全栈应用。Shadow/DSD 是默认组件渲染模式；light DOM 是显式 opt-in。

强制项目流程见 [`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md)。

## 快速开始

```bash
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

## 产品原则

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

| 产品                               | Surface                                   | 角色                                                                    |
| ---------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| Web Components Fullstack Framework | `@openelement/app`, `@openelement/create` | Pages、layouts、routes、islands、app targets，以及官方 stack adapters。 |
| Basic Element                      | `@openelement/element`, `OpenElement`     | JSX-first 原生 Web Components authoring layer，面向 Shadow/DSD 输出。   |

支持包包括 `@openelement/core`、`@openelement/adapter-vite`、`@openelement/signal`、`@openelement/router`、`@openelement/content` 和 `@openelement/ssg`。`@openelement/protocol` 是带少量 host-API-free 运行时值的契约基础，`@openelement/ui` 是 Open Props-backed 参考组件库和 dogfood surface。它们支撑两个主产品，但不是独立的一线产品。

Dogfood apps 用来验证 openElement，不能定义 openElement。Deno Desktop Reader
和 Mastodon Desktop 是 alpha.7 hardening train 已完成的基础证据，不是额外
产品线。alpha.7 当前负责关闭 dogfood 暴露的架构、浏览器、安全、分发、采用和
release-truth 问题。AutoFlow3、docs truth、release evidence 和 workflow gates
是项目基础设施，不进入 Framework 产品叙事。

当前 workspace 是 v0.41 的 11 包线。Hub、RPC、CEM、compat-check、Lit/React/vanilla interop adapters，standalone runtime/style-sheet/i18n 包已退出当前包图；`@openelement/protocol` 和 `@openelement/ssg` 保留为 support packages。`@preact/signals-core` 是默认 signal engine。

alpha.7 的 21 项退出任务将只读、无账号网络桌面 dogfood 转换成生产构建路径、
更小的 authoring surface、明确的浏览器/安全事实、五分钟 starter、可复现证据和
外部 adopter proof。下一阶段 v0.41.0-beta.1 只重新验证这些已冻结结果，再进入
稳定版 v0.41.0；它不再承接新的实现任务。

v1.0 目标是稳定的 Web Components fullstack framework 和 Basic Element authoring layer，并冻结 supporting UI、Protocols、official adapter contracts。

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
