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
import { useLoaderData } from '@openelement/router';

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

## `@openelement/app/vite`

```ts
import { openElement } from '@openelement/app/vite';
```

`openElement()` 配置 Vite、route scanning、SSG、islands、AppShell、content 和
i18n。

## 产品和 Runtime packages

- `@openelement/app` 和 `@openelement/create`：Framework 产品面。
- `@openelement/ui`：第一方 UI 产品面。
- `@openelement/protocol`：runtime-free Protocols 产品面。
- `@openelement/element`：当前 Elements 产品面和规范作者层，提供 `OpenElement`、signals 和 stylesheet facade。
- `@openelement/core`：renderer kernel 和 JSX runtime。
- `@openelement/signal`：signal primitives。
- `@openelement/core/style-sheet`：CSSStyleSheet abstraction。
