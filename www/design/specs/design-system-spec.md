# Design System 页面规格

## 概述

设计系统展示页。展示 token、组件、安装说明。标准文档布局（content + TOC）。

## 布局

- 内容区：content-grid（1fr + 220px TOC）
- max-width: 1100px
- Padding: 44px 32px 72px

## 内容结构

### 标题区域

- Headline: "Design System" — 56px, weight 600
- Subtitle: "Two plates. Zero noise." — 20px, weight 400, text-secondary

### 色板区域 (Palettes)

#### Dark 色板

- 背景：surface-2，12px 圆角
- 顶部 edge highlight
- 展示 6 个色块：
  - Base (#08080a)
  - Surface (#0d0f12)
  - Primary (#5c7cfa)
  - Secondary (#adb5bd)
  - Tertiary (#868e96)
  - Muted (#868e96)

#### Light 色板

- 背景：#f8f9fa，12px 圆角
- 展示 6 个色块（对应 light 模式色值）

### 排版区域 (Typography)

- Type scale 展示：从 display-xl 到 caption
- 每个 size：实际渲染 + token 名称 + 数值标注
- 展示负字间距效果

### 组件区域 (Components)

#### Buttons

- 展示 4 种变体：Primary / Secondary / Tertiary / Inverse
- 每个变体：Default + Hover + Focus + Disabled

#### Card

- 标准卡片展示
- 强调顶部 edge highlight
- Hover 状态展示

#### Input

- 标准输入框
- Focus 状态（品牌色 outline）
- 代码命令行输入框（带 Copy 按钮）

#### Badge

- 默认 badge
- 状态 badge（success, error, warning, info）
- "New" badge

### 安装区域 (Install)

- 命令行：`deno add jsr:@openelement/ui`
- 带 Copy 按钮的 code block
- 说明：Deno, Node, Bun. Zero config.

## 响应式

| 断点     | 布局                 |
| -------- | -------------------- |
| ≥ 1100px | 1fr + 220px TOC      |
| < 1100px | 单列，TOC 隐藏或收起 |

## 注意事项

- 色板色值使用 CSS custom properties 动态渲染，不是硬编码
- 组件展示要 dogfood — 使用实际 openElement 组件
- 安装命令可复制，带成功反馈
