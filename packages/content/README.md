# @openelement/content

Build-time content pipeline for openElement apps.

> v0.39 surface: advanced Framework feature. Configure it through
> `@openelement/app/vite`; first-run app modules should not import it at
> runtime.

This package owns Markdown, MDX, blog data, navigation metadata, sitemap, and
robots generation. Route components should consume generated virtual modules;
they should not import the content package at runtime.

## Install

```bash
npm install @openelement/content
```

## Recommended Usage

Configure content through the unified Vite facade:

```ts
import { openElement } from '@openelement/app/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    openElement({
      content: {
        blog: { contentDir: 'content/blog', basePath: '/blog' },
        nav: { routesDir: 'app/routes', headerNav: [] },
        sitemap: { hostname: 'https://example.com' },
      },
    }),
  ],
});
```

## Features

- Blog data from Markdown frontmatter.
- Build-time MDX compilation into the openElement JSX runtime.
- Navigation metadata scanning from route files.
- Sitemap and robots generation from SSG output.

## MDX

```ts
import { compileMdx } from '@openelement/content/mdx';

const mod = await compileMdx(source, {
  jsxImportSource: '@openelement/core',
});
```

MDX files compile into the same JSX/DSD path as application code. There is no
browser-side MDX parser and no React provider layer.

## Advanced Direct Use

Direct plugin use is for framework internals and adapter experiments. Normal
applications should configure content through `openElement()` so content, i18n,
route scanning, and SSG share one build context.

## License

MIT
