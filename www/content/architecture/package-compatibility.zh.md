---
title: 'Package 兼容性'
lede: 'openElement 把第三方 Custom Elements 视为基于标准的依赖。当前构建通过显式的 package island 配置与可用的 Custom Elements Manifest metadata 完成 SSR 准入。'
order: 90
---

## 当前契约

`@openelement/element` 负责编写体验；`app` 与 `adapter-vite` 让应用行为与构建行为保持分离。

## 显式准入

已知包可配置为 package island，并利用可用的 CEM metadata，无需引入已退役的包接口。

## 路线图诊断

通用的 DSD/light/client-only 分类与 hydration 不匹配诊断属于 `0.43` 路线图工作，并非当前已上市的能力宣称。
