# Docs Landing 页面规格

## 概述

文档入口页。四个入口路径卡片，2×2 网格布局。

## 布局

- 全宽
- 内容区：max-width 1120px，居中
- Padding: 44px 32px 72px

## 内容结构

### 标题区域

- Headline: "Docs" — 56px, weight 600, letter-spacing -0.03em
- Lede: "openElement documentation is organized around what you want to do." — 20px, weight 400, text-secondary

### 入口路径网格

- 2×2 网格，gap 16px
- 每个卡片：surface-2 背景，12px 圆角，1px border，24px padding
- 顶部 edge highlight

### 卡片内容

| 卡片                 | Badge      | 标题                 | 描述                                             | 链接                                |
| -------------------- | ---------- | -------------------- | ------------------------------------------------ | ----------------------------------- |
| Build an app         | Entry      | Build an app         | Create a project, write DSD components...        | /guide/getting-started              |
| Learn the engine     | Concepts   | Learn the engine     | Understand DSD rendering, island architecture... | /architecture/dsd                   |
| Integrate packages   | Integrate  | Integrate packages   | Publish Web Components to the Hub...             | /architecture/package-compatibility |
| Maintain openElement | Contribute | Maintain openElement | Read the package graph, ADR decisions...         | /architecture                       |

### 卡片样式

- 左侧：24px icon（brand color）
- 右上角：pill badge（默认样式）
- 标题：22px, weight 500
- 描述：14px, text-secondary, line-height 1.5
- Hover：border 变亮，无位移

## 响应式

| 断点    | 布局     |
| ------- | -------- |
| ≥ 768px | 2×2 网格 |
| < 768px | 1 列堆叠 |

## 注意事项

- 与首页保持一致的 card 样式
- 入口路径清晰，减少用户决策成本
- Badge 使用小写或首字母大写（避免全大写的 shouting）
