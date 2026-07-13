---
title: 'Routing and Data'
section: 'Guide'
label: 'Routing and Data'
order: 3
---

# Routing and Data

Files in `app/routes` become routes. A route module exports a page component,
usually created with `definePage()`.

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

## Rendering Intent

Page descriptors declare static rendering intent:

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

The canonical descriptor keeps route, head and render behavior together.
Request-time data, forms, actions and revalidation are planned for the `0.42`
WC Application Loop; they are not current stable authoring contracts.
