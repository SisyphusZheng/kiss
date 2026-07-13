---
title: '路由与数据'
section: '指南'
label: '路由与数据'
order: 3
---

# 路由与数据

`app/routes` 下的文件会成为路由。路由模块导出页面组件，通常由 `definePage()` 创建。

## 静态页面

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  render() {
    return <main>Home</main>;
  },
});
```

## 页面 metadata

```tsx
export default definePage({
  route: { path: '/posts' },
  head: {
    title: 'Posts',
    description: 'Latest posts',
  },
  render() {
    return <main>Posts</main>;
  },
});
```

## 渲染意图

页面 descriptor 可以声明后续渲染意图：

```tsx
export default definePage({
  route: { path: '/cached' },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: false,
  },
  render: () => <main>Cached page</main>,
});
```

canonical descriptor 将 route、head 和 render behavior 放在一起。request-time
data、forms、actions 与 revalidation 属于 `0.42` WC Application Loop，当前不作为
稳定 authoring contract 宣传。
