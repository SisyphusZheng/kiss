---
title: 'Islands 与 SSR'
section: '指南'
label: 'Islands 与 SSR'
order: 4
---

# Islands 与 SSR

openElement 先渲染页面，再升级交互组件。

## Island 编写

```tsx
import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/element';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
  { hydrate: 'idle', dsd: true },
);
```

## 策略

- `load`：client module 加载后立即升级。
- `idle`：等浏览器空闲时升级。
- `visible`：元素进入视口时升级。
- `only`：只在客户端渲染。

## SSR 边界

SSR admission 必须显式。不能安全服务端渲染的组件应声明为 client-only，而不是静默降级。

## 为什么是 DSD

Declarative Shadow DOM 让服务端渲染的 Web Components 在 JavaScript 创建 shadow root
之前就保留封装 DOM 和样式。
