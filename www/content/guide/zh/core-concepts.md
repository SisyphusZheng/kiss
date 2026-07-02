---
title: '核心概念'
section: '指南'
label: '核心概念'
order: 2
---

# 核心概念

openElement 围绕一个应用模型、一条渲染管线和两个主产品构建：

```text
openElement = Web Components Fullstack Framework + Basic Element
supporting packages = Protocols + UI + official stack adapters
```

Web Components Fullstack Framework 负责 pages、layouts、routes、islands、API
routes、deployment 和 desktop targets。Basic Element 是原生 custom-element
authoring surface。Protocols、UI、SSG、adapter-vite、router、signal、content 和
core 支撑这两个产品，但不是独立的一线产品。

## Application API

```tsx
import { defineElement, defineIsland, definePage } from '@openelement/app';
```

- `definePage()` 声明 route component 和页面 metadata。
- `defineIsland()` 声明可交互 Custom Element。
- `defineElement()` 声明可复用的 Elements-native custom element。
- `defineLayout()` 是 layout element 的语义别名。

## Renderer 管线

JSX 是作者语法。渲染路径是：

```text
JSX -> VNode -> RenderNode -> DSD HTML or DOM
```

应用代码没有并行的 string-template renderer。原始 HTML 只能通过显式
`trustedHtml` 信任边界进入。

## Declarative Shadow DOM

服务端输出可以包含 `<template shadowrootmode="open">`，让浏览器在
JavaScript 升级 island 之前解析 shadow root。

## Islands

静态内容保持静态。交互组件是带显式 hydration 策略的 islands，例如
`load`、`idle`、`visible` 或 `only`。

## Basic Element 和 Runtime primitives

`@openelement/element` 是 Basic Element 产品面，提供 `OpenElement` 基类：

```tsx
import { OpenElement, signal, StyleSheet } from '@openelement/element';
```

应用路由通常应优先使用 `@openelement/app`。
