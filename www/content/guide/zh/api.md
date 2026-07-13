---
title: 'API Reference'
section: 'Reference'
label: 'API'
order: 70
---

# API Reference

当前公开产品面为五包。大多数作者使用 `@openelement/element`、
`@openelement/app` 与 `@openelement/adapter-vite`；`create` 用于开始项目，
`ui` 是可选项。

## Element 编写

```tsx
import { defineElement, defineLayout } from '@openelement/element';
```

`defineElement()` 声明可复用的原生 custom element。Shadow/DSD 是默认渲染模式；
light DOM 必须显式选择。`defineLayout()` 是 element authoring 的语义 layout
别名。

## 应用编写

```tsx
import { defineApp, defineIsland, definePage } from '@openelement/app';
```

`definePage()` 声明 route、head、render intent、render 与 error 行为组成的页面
descriptor。

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello OpenElement</main>;
  },
});
```

`defineIsland()` 标记需要选择性升级的交互 Custom Element。`defineApp()` 启动
受支持的应用模式，包括选定产品路径中的 SPA mode。

## 构建与 starter

```ts
import { buildApp, openElement } from '@openelement/adapter-vite';
```

`openElement()` 配置官方 Vite 集成。`buildApp()` 负责受支持的构建调用，作者不必
理解 plugin ordering 或内部 manifests。

```sh
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

生成项目提供 `dev`、`check`、`test`、`build` 和 `preview`。

## 后续应用交互

request-time data、progressive forms、actions 与 revalidation 组成的
route-to-action loop 属于 `0.42` WC Application Loop。在当前包线中，它们不被
表述为稳定公开契约。
