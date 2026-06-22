---
title: 'Core Concepts'
section: 'Guide'
label: 'Core Concepts'
order: 2
---

# Core Concepts

openElement is built around one application model, one renderer pipeline, and
four product surfaces:

```text
openElement = Elements + UI + Framework + Protocols
```

Elements is the native Web Components authoring surface. UI is the first-party
`open-*` component library. Framework owns pages, layouts, islands, API routes,
and Vite + Nitro output. Protocols define replacement boundaries.

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

## Elements And Runtime Primitives

`@openelement/element` is the current Elements product surface and provides the
`OpenElement` base class, signals, and stylesheet helpers:

```tsx
import { OpenElement, signal, StyleSheet } from '@openelement/element';
```

Application routes should normally use `@openelement/app` first.
