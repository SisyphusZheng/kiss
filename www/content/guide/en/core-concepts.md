---
title: 'Core Concepts'
section: 'Guide'
label: 'Core Concepts'
order: 2
---

# Core Concepts

OpenElement is built around one application model and one renderer pipeline:

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
```

The framework owns pages, routes, islands and render semantics; Vite and Nitro
provide the official build and output path. Basic Element is the native
custom-element authoring surface. `element`, `app`, `adapter-vite`, `create` and
optional `ui` are the current consumer packages. Reader, Mastodon Desktop,
AutoFlow3 and docs-truth tooling are evidence or infrastructure, not product
surfaces.

## Application API

```tsx
import { defineElement, defineIsland, definePage } from '@openelement/app';
```

- `definePage()` declares route components and page metadata.
- `defineIsland()` declares interactive Custom Elements.
- `defineElement()` declares reusable Elements-native custom elements.
- `defineLayout()` is a semantic alias for layout elements.

## Renderer Pipeline

JSX is the authoring syntax. The renderer path is:

```text
JSX -> VNode -> RenderNode -> DSD HTML or DOM
```

There is no parallel string-template renderer for application code. Raw HTML is
only accepted through explicit `trustedHtml` boundaries.

## Declarative Shadow DOM

Server output includes `<template shadowrootmode="open">`, so the browser can
parse shadow roots before JavaScript upgrades islands.

## Islands

Static content remains static. Interactive components are isolated islands with
explicit hydration strategy metadata such as `load`, `idle`, `visible`, or
`only`.

## Basic Element And Runtime Primitives

`@openelement/element` is the Basic Element product surface and provides the
`OpenElement` base class, signals, and stylesheet helpers:

```tsx
import { OpenElement, signal, StyleSheet } from '@openelement/element';
```

Application routes should normally use `@openelement/app` first.
