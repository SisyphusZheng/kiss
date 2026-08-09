# @openelement/create

Project scaffolding CLI for openElement applications.

> 0.42 alpha surface (v0.42.0-alpha.15, unfrozen; ADR-0122 freeze proposed):
> Framework product entry. This package is part of the
> first-run Framework story alongside `@openelement/app` and
> `@openelement/adapter-vite`.

`@openelement/create` generates a new openElement project with the recommended
directory structure, Deno configuration, Vite setup, and starter pages.

## Usage

```bash
deno run -A npm:@openelement/create my-app
cd my-app
deno task dev
```

## What It Creates

- `deno.json` - starter authoring imports and build tasks
- `vite.config.ts` - Vite build configuration with the openElement plugin
- `app/` - application directory with starter pages and islands

The generated import map intentionally keeps protocol and build internals out of
the starter surface. Advanced contracts remain available through the published
workspace packages when a project needs them.

## License

MIT
