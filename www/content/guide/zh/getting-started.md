---
title: '快速开始'
section: '指南'
label: '快速开始'
order: 1
---

# 快速开始

openElement 是 JSX-first 的 Web Components 平台：

```text
openElement = Elements + UI + Framework + Protocols
```

页面使用 JSX 编写。Framework 默认可以用 shadow/DSD 渲染 Web Components，
需要交互的部分再作为 islands 升级。

## 创建项目

```bash
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

## 编写页面

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: {
    title: 'Home',
    description: 'My openElement app',
  },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: false,
  },
  render() {
    return <main>Hello openElement</main>;
  },
});
```

`definePage()` 使用一个 canonical object descriptor。`route` 是意图
metadata；真实路由匹配仍由文件扫描器负责。

## 添加 island

```tsx
import { defineIsland, defineIslandConfig } from '@openelement/app';
import { signal } from '@openelement/element';

export const openElement = defineIslandConfig({
  hydrate: 'idle',
  dsd: true,
  ssr: true,
});

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
  { hydrate: openElement.hydrate, dsd: openElement.dsd, ssr: openElement.ssr },
);
```

## 配置 Vite

```ts
import { defineConfig } from 'vite';
import { openElement } from '@openelement/app/vite';

export default defineConfig({
  plugins: [openElement()],
});
```

根入口 `@openelement/app` 用于应用编写。构建配置入口是
`@openelement/app/vite`。
