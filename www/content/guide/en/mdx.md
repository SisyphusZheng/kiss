---
title: 'MDX'
section: 'Guide'
label: 'MDX'
order: 6
---

# MDX

MDX lets you write JSX directly inside Markdown documents. In openElement, MDX is
compiled at build time through the same JSX and DSD renderer as `.tsx` routes.

## Frontmatter

Use YAML frontmatter to set metadata:

```mdx
---
title: 'Hello MDX'
description: 'A page written in MDX'
---
```

## JSX in Markdown

Import and use components just like in a route file:

```mdx
import { Callout } from '../components/callout.tsx';

# Welcome

This is a paragraph.

<Callout kind='info'>
  MDX renders components inline.
</Callout>
```

## Islands

Interactive components can be embedded as islands:

```mdx
import { Counter } from '../islands/counter.tsx';

<Counter hydrate='idle' />
```

## Content Collections

Place MDX files in `app/content` and let the `@openelement/app/vite` content
plugin generate collection pages and individual routes from them.

## Routes

A `.mdx` file can also be imported from a `.tsx` route and rendered inside a
`definePage()` layout:

```tsx
import { definePage } from '@openelement/app';
import Content from '../content/post.mdx';

export default definePage({
  route: { path: '/blog/hello' },
  head: { title: 'Hello MDX' },
  render() {
    return (
      <main>
        <Content />
      </main>
    );
  },
});
```

## Security

MDX does not trust raw HTML by default. Embed raw HTML only through explicit
`trustedHtml` boundaries.
