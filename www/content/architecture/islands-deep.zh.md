---
title: 'Island 深入解析'
lede: 'island 是 openElement 中唯一的客户端 JavaScript 单元。公开模型是 VNode 输出加 JSX 事件处理器；SSR props 单独恢复。'
order: 50
---

## 升级模型

openElement 使用浏览器的 Custom Element upgrade 机制。SSG 先写出 HTML，然后客户端入口只导入当前页面用到的 island 模块。

## 三个层次

### 第 1 层 — `dsd-static` — 无客户端 JavaScript

静态 Web Components 在 SSG 期间渲染为 DSD。即使没有任何客户端模块运行，它们也保持可见且样式完整。

### 第 2 层 — `dsd-interactive` — DSD 加 VNode 事件 hydration

服务端输出 DSD 与 VNode 事件标记。upgrade 时，OpenElement 把这些标记 hydrate 为 JSX 处理器。没有字符串方法查找，也没有 `data-on-*` 事件绑定。

### 第 3 层 — `pure-island` — 客户端拥有的 shadow root

纯浏览器组件可以用 `only` 策略退出 SSR。服务端只输出宿主标签和 `data-ssr-props`；渲染由客户端全权负责。

## 策略

- `load` — 为首屏控件（如导航与主题）立即导入。
- `idle` — 在浏览器空闲时间为非关键交互组件导入。
- `visible` — 当 island 接近视口时导入。
- `only` — 对无法产出可靠 DSD 的纯浏览器组件跳过 SSR。

## SSR Props 不是事件

`bindSsrProps()` 把 `data-ssr-props` 恢复到 upgrade 后的元素中。它不绑定 DOM 事件；事件由 JSX 处理器生成的 VNode 标记负责。

## 动态内容

动态 island 内容应返回 VNode 或 VNode 数组。HTML 注入只保留在显式的 `trustedHtml` 边界之内，且仅用于已消毒、非交互的内容。
