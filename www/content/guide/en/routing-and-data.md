---
title: 'Routing and Data'
section: 'Guide'
label: 'Routing and Data'
order: 3
---

# Routing and Data

Files in `app/routes` become routes. The route module exports a page component,
usually created with `definePage()`, and can export a `loader` for data.

## Static Page

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  render() {
    return <main>Home</main>;
  },
});
```

## Page Metadata

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

## Load Data

```tsx
import { definePage } from '@openelement/app';
import { useLoaderData } from '@openelement/router';
import type { Loader } from '@openelement/app';

export const loader: Loader = async () => {
  return { posts: await fetchPosts() };
};

export default definePage({
  render() {
    const data = useLoaderData<{ posts: Post[] }>();
    return (
      <main>
        {data.posts.map((post) => <article>{post.title}</article>)}
      </main>
    );
  },
});
```

`loader()` receives route params, the request, and runtime context. Use
`useLoaderData()` inside `render()` to access the returned data.

## Rendering Intent

Page descriptors can declare future rendering intent:

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

v0.33 makes this descriptor the only page authoring path. Top-level `title`,
`description`, `rendering`, `streaming`, and `revalidate` are no longer accepted.
