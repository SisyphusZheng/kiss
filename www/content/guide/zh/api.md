---
title: 'API Reference'
section: 'Reference'
label: 'API'
order: 70
---

# API Reference

## `@openelement/app`

```tsx
import { defineElement, defineIsland, defineLayout, definePage } from '@openelement/app';
```

### `definePage(input)`

声明 route component。

```tsx
import { definePage } from '@openelement/app';
import { useLoaderData } from '@openelement/app';

export const loader = async () => {
  return { message: 'Hello' };
};

export default definePage({
  head: {
    title: 'Home',
  },
  render() {
    const data = useLoaderData<typeof loader>();
    return <main>{data.message}</main>;
  },
});
```

### `defineIsland(tagName, render, options?)`

声明可交互 Custom Element 及其 hydration metadata。

```tsx
export default defineIsland('my-counter', () => <button>Count</button>, {
  hydrate: 'idle',
  dsd: true,
});
```

### `defineElement(tagName, render)`

声明可复用的 Elements-native custom element。Shadow/DSD 是默认渲染模式；
light DOM 必须显式选择。

### `defineLayout(tagName, render)`

声明 layout element。它是 `defineElement()` 的语义别名。

## `@openelement/adapter-vite`

```ts
import { openElement } from '@openelement/adapter-vite';
```

`openElement()` 配置 Vite、route scanning、SSG、islands、AppShell、content 和
i18n。

## 产品包

- `@openelement/element`：JSX、Custom Elements、DSD、hydration、signals 和样式工具。
- `@openelement/app`：pages、routes、loaders、actions 和 islands。
- `@openelement/adapter-vite`：Vite、content、SSG 和 Nitro 集成。
- `@openelement/create`：starter CLI。
- `@openelement/ui`：可选的通用 primitives。
