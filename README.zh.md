# openElement

[English](./README.md) | 简体中文

**以 Web Components 为原生组件模型的全栈框架，并内置 JSX-first Basic Element
authoring layer。当前包线：`0.41.0-alpha.8`（`v0.41.0-alpha.8` 发布）。已完成执行锚点：v0.41.0-alpha.7 Dogfood、架构收口与采用准备。下一阶段是允许 breaking 的 beta 架构与采用收口；首个完整候选将是 `0.41.0-beta.4`。**

openElement 把 Web Components 当作应用的原生组件模型，使用 JSX/VNode 渲染、渐进式 islands、API routes，以及 Vite + Nitro 输出，构建静态优先的全栈应用。Shadow/DSD 是默认组件渲染模式；light DOM 是显式 opt-in。

强制项目流程见 [`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md)。

## Alpha 包状态

alpha.8 的 11 个包均已带 provenance 发布，但 npm 上的
`@openelement/create@0.41.0-alpha.8` 因 tarball 遗漏模板 `.gitignore` 而无法
完成创建。当前不能把该命令当作 adoption-ready quick start；执行真实发布 CLI
并跑完整生成项目生命周期是 beta 的第一个 P0 gate。

## 产品原则

当前 alpha.8 原则：

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

Beta 目标：

```text
openElement = Web Components-native application framework
authoring modes = Basic Element standalone + full application
default path = DSD/static-first + selective islands + Vite/Nitro
```

| 产品                               | Surface                                   | 角色                                                                    |
| ---------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| Web Components Fullstack Framework | `@openelement/app`, `@openelement/create` | Pages、layouts、routes、islands、app targets，以及官方 stack adapters。 |
| Basic Element                      | `@openelement/element`, `OpenElement`     | JSX-first 原生 Web Components authoring layer，面向 Shadow/DSD 输出。   |

支持包包括 `@openelement/core`、`@openelement/adapter-vite`、`@openelement/signal`、`@openelement/router`、`@openelement/content` 和 `@openelement/ssg`。`@openelement/protocol` 是带少量 host-API-free 运行时值的契约基础，`@openelement/ui` 是 Open Props-backed 参考组件库和 dogfood surface。它们支撑两个主产品，但不是独立的一线产品。

Dogfood apps 用来验证 openElement，不能定义 openElement。Deno Desktop Reader
和 Mastodon Desktop 是 alpha.7 hardening train 已完成的基础证据，不是额外
产品线。其 package-gated 工作已由 alpha.8 发布，外部 adopter pilot #390 保持
开放。AutoFlow3、docs truth、release evidence 和 workflow gates
是项目基础设施，不进入 Framework 产品叙事。

当前 workspace 是 v0.41 的 11 包线。Hub、RPC、CEM、compat-check、Lit/React/vanilla interop adapters，standalone runtime/style-sheet/i18n 包已退出当前包图；`@openelement/protocol` 和 `@openelement/ssg` 保留为 support packages。`@preact/signals-core` 是默认 signal engine。

alpha.7 的 package-gated 工作已由 alpha.8 完整发布，外部 adopter pilot #390
仍然开放。下一阶段 beta 不再是“只复跑”的验证窗口，而是最终 breaking
architecture train：修复真实 npm starter、收窄定位、深化 app/element/build
interfaces、吸收或隐藏 shallow support packages、删除旧代码和冗余，并围绕保留
interfaces 重建验证。npm beta.1–beta.3 已是不完整且不可覆盖的历史发布，因此
首个完整候选必须使用 beta.4。

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
