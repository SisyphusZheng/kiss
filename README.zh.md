# openElement

[English](./README.md) | 简体中文

**以 Web Components 为原生组件契约、static-first 的应用框架。** Custom
Elements 是可长期保存的应用组件模型；JSX 与 Basic Element 是作者层；
Declarative Shadow DOM 是默认服务端表示；交互区域按需升级。

源码包行为 `0.42.0-alpha.11`（`v0.42.0-alpha.11`）——ADR-0119 范围化接口冻结下的
在途五包源码行；已放弃的 beta 命名不再是当前版本线。
npm registry 行为 `v0.42.0-alpha.11`——已发布的五包版本；registry 行允许比
源码行滞后一个 alpha。

## 当前产品

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
official build path = Vite + Nitro
```

当前消费者包图为五包：

| 包                          | 角色                                            |
| --------------------------- | ----------------------------------------------- |
| `@openelement/element`      | Custom Elements、JSX、DSD、hydration 与 signals |
| `@openelement/app`          | 页面、路由、islands 与 request/render 语义      |
| `@openelement/adapter-vite` | Vite、content、静态构建与 Nitro 输出            |
| `@openelement/create`       | 已安装 starter 与零上下文入口                   |
| `@openelement/ui`           | 可选、经过证明的通用 primitives                 |

旧的 `core`、`signal`、`router`、`protocol`、`content` 与 `ssg` 是实现历史，
不再是受支持的消费者导入。

## 为什么使用 openElement

当一个标准 Custom Element 应同时服务于独立组件库和完整应用时，OpenElement
提供统一契约。它把原生元素作者体验、路由、静态生成、DSD、选择性升级和可部署
输出组合在一起，而不把某个框架专有 virtual DOM 变成长期 UI 模型。

“WC 全栈第一”是明确的战略目标，必须通过 WC SSR 兼容性、第三方元素互操作、
可移植部署与外部采用来证明；当前不将其表述为已取得的市场结论。

## 当前发布状态

五包收敛已作为 stable `0.41.0` 发布。npm beta.1 至 beta.3 仍是已撤回的
不完整历史产物，不构成兼容基线。第三轮审计清扫于 alpha.19 完成（ADR-0118），
#390 试点在零招募后由 maintainer 决策退役（ADR-0119）。

request-time data、forms、sessions 与 cache 在 0.42/0.44 前显式不冻结，
仍是后续产品工作；当前承诺是具有
fullstack 输出路径的 static-first 应用，不是泛全栈能力对等宣称。

`1.0.0` 路径是在 Application Loop、WC SSR、Production Runtime 与外部采用证据完成后，
形成稳定的五包产品。

## 开始使用

```sh
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

生成项目提供 `dev`、`check`、`test`、`build` 和 `preview`。

## 文档

| 主题     | 链接                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------- |
| 指南     | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API 参考 | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| 架构     | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |
| 路线图   | [docs/roadmap/ROADMAP.md](./docs/roadmap/ROADMAP.md)                                           |
| 当前状态 | [docs/status/STATUS.md](./docs/status/STATUS.md)                                               |

强制项目流程见
[`docs/governance/PROJECT_WORKFLOW.md`](./docs/governance/PROJECT_WORKFLOW.md)。

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。架构决策在 [docs/adr/](./docs/adr/)；
历史 release 与 audit 记录保留为证据，不再作为当前产品文档。

## 品牌

规范的紧凑标志是 [`www/public/favicon.svg`](./www/public/favicon.svg) 中的深色
`<open/>` SVG（`open-favicon-inverted.svg` 是浅色背景的维护变体）。品牌 SVG
以仓库 MIT 许可证分发；fork 可以署名使用，但不应暗示获得上游背书。

## 许可

MIT
