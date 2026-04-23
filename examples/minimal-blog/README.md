# Minimal Blog - KISS Example

A minimal blog built with KISS framework. Demonstrates:
- File-based routing
- SSR with Lit
- Islands for interactivity
- Progressive enhancement (0 KB JS by default)

## Getting Started

```bash
cd examples/minimal-blog
deno install
deno task dev
```

Open <INTERNAL_HOST_REDACTED> to see the blog.

## Structure

```
minimal-blog/
├── app/
│   ├── routes/
│   │   ├── index.ts          # Home page (list of posts)
│   │   ├── posts/
│   │   │   └── [slug].ts    # Dynamic post page
│   │   └── about.ts          # About page
│   ├── islands/
│   │   └── theme-toggle.ts   # Theme toggle (Island)
│   └── components/
│       ├── header.ts          # Header component
│       └── footer.ts         # Footer component
├── server.ts                  # Server entry
├── vite.config.ts            # KISS plugin config
└── deno.json                 # Deno config
```

## Features

- **0 KB JS by default** - Pure HTML with DSD
- **Theme toggle** - Island component (~6 KB)
- **Markdown support** - Parse markdown in posts
- **Responsive layout** - CSS with Open Props
