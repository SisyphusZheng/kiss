---
title: '核心概念'
section: '指南'
label: '核心概念'
order: 2
---

# 核心概念

openElement 围绕一个应用模型、一条渲染管线和四个一级产品面构建：

```text
openElement = Elements + UI + Framework + Protocols
```

Elements 是原生 Web Components 作者层，当前规范作者层为 `@openelement/element`。UI 是第一方 `open-*` 组件库。
Framework 负责 pages、layouts、islands、API routes 以及 Vite + Nitro 输出。
Protocols 定义可替换边界。

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

## Elements 和 Runtime primitives

`@openelement/element` 是当前 Elements 产品面和规范作者层，提供 `OpenElement`
基类：

```tsx
import { OpenElement, signal, StyleSheet } from '@openelement/element';
```

应用路由通常应优先使用 `@openelement/app`。
