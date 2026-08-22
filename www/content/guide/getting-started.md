---
title: 'Getting Started'
lede: 'OpenElement is a Web Components-native, static-first application framework. Start with standard Custom Elements, pages, routes, selective upgrades and deployable Vite/Nitro output.'
order: 1
---

> The current source line is `{{OPENELEMENT_VERSION}}`. The published npm line is the stable 0.42 line (dist-tag `latest`); it ships under the ADR-0122 freeze on top of the untouched ADR-0119 static freeze.

## Install

Three commands to a running app:

```bash
deno run -A --minimum-dependency-age 0 npm:@openelement/create my-app
cd my-app
deno task dev
```

The default dist-tag is the stable 0.42 line. `--minimum-dependency-age 0` is needed because Deno's default `minimumDependencyAge` (~24h) refuses packages published within the last day.

> Deno 2.8+ is required — the generated starter writes the `minimumDependencyAge` config key, which older Deno versions do not understand.

## Explore

Read the [docs](/docs), [API reference](/apilist), and [roadmap](/roadmap) as the current product map.

## Build

Run build, package, docs truth, and visual smoke gates before release.
