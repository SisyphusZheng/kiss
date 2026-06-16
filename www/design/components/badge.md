# Badge 组件规格

## 概述

Pill 形状的状态标签。小尺寸、低对比度、用于分类和状态标识。

## 样式规格

| 属性   | 值                             |
| ------ | ------------------------------ |
| 背景   | `--surface-1` (#0d0f12)        |
| 文字   | `--color-text-muted` (#868e96) |
| 圆角   | `--radius-pill` (9999px)       |
| 内边距 | 2px 8px                        |
| 字号   | 12px                           |
| 字重   | 400                            |

## 状态

| 状态    | 视觉表现                   |
| ------- | -------------------------- |
| Default | 标准样式                   |
| Hover   | 无变化（徽章通常不可交互） |

## 变体

### 默认徽章

- 用于分类标签（Entry, Concepts, Integrate, Contribute）

### 状态徽章

- 用于系统状态
- 颜色根据状态变化：
  - Success: 背景 `--color-success-subtle`，文字 `--color-success`
  - Error: 背景 `--color-error-subtle`，文字 `--color-error`
  - Warning: 背景 `--color-warning-subtle`，文字 `--color-warning`
  - Info: 背景 `--color-info-subtle`，文字 `--color-info`

### "New" 徽章

- 背景：`--color-text-primary` (#e9ecef)
- 文字：`--bg-canvas` (#08080a)
- 字号：10px
- 用于 Blog 列表最新文章标记

## 使用场景

| 场景         | 变体       |
| ------------ | ---------- |
| 文档入口标签 | 默认徽章   |
| 系统状态     | 状态徽章   |
| 新文章标记   | "New" 徽章 |
| 版本标签     | 默认徽章   |

## 注意事项

- **徽章是只读组件** — 通常不交互
- **保持低对比度** — 不抢夺主内容注意力
- **不要在同一页面使用过多徽章** — 最多 3-4 个颜色变体
