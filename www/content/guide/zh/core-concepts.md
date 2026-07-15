---
title: '核心概念'
section: '指南'
label: '核心概念'
order: 2
---

# 核心概念

openElement 围绕一个应用模型和一条渲染管线构建：

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
```

Framework 负责 pages、routes、islands 与 render semantics；Vite 和 Nitro 是官方
构建与输出路径。Basic Element 是原生 custom-element authoring surface。`element`、
`app`、`adapter-vite`、`create` 与可选 `ui` 是当前消费者包。Reader、Mastodon
Desktop、AutoFlow3 与 docs-truth tooling 是证据或基础设施，不是额外产品面。

## Application API

```tsx
import { defineElement } from '@openelement/element';
import { defineIsland, definePage } from '@openelement/app';
```

- `definePage()` 声明 route component 和页面 metadata。
- `defineIsland()` 声明可交互 Custom Element。
- `defineElement()` 声明可复用的 Elements-native custom element。

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

静态 prop getter 按设计返回响应式 `Signal` 对象，应通过 `.value` 读取或更新。
删除反射属性时会恢复 `static props` 中声明的默认值。
