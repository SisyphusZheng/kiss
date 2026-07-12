---
title: '路由与数据'
section: '指南'
label: '路由与数据'
order: 3
---

# 路由与数据

`app/routes` 下的文件会成为路由。路由模块导出页面组件，通常由 `definePage()`
创建。

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

## 加载数据

```tsx
import { definePage } from '@openelement/app';
import { useLoaderData } from '@openelement/app';

export const loader = async () => {
  return { posts: await fetchPosts() };
};

export default definePage({
  render() {
    const data = useLoaderData<typeof loader>();
    return (
      <main>
        {data.posts.map((post) => <article>{post.title}</article>)}
      </main>
    );
  },
});
```

`loader` 导出会收到 route params、request 和运行时上下文。返回值通过
`useLoaderData()` 在页面组件中读取。

## Action

路由可以导出 `action` 来处理 mutation 请求：

```tsx
export const action = async ({ request }) => {
  const form = await request.formData();
  await createPost(form);
  return { ok: true };
};
```

## 渲染意图

页面 descriptor 可以声明后续渲染意图：

```tsx
export default definePage({
  route: { path: '/cached' },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: 300,
  },
  render: () => <main>Cached page</main>,
});
```

v0.33 之后这是唯一页面编写路径。顶层 `title`、`description`、`rendering`、
`streaming` 和 `revalidate` 不再被接受。
