# Card 组件规格

## 概述

Linear 风格的卡片。Surface 层级提升，hairline 边框，顶部边缘高光。

## 结构

```
┌─────────────────────────────┐ ← edge-highlight (1px 白边)
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │  Card Content           │ │
│ │                         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘ ← border (1px rgba(255,255,255,0.06))
```

## 样式规格

| 属性 | 值 |
|------|-----|
| 背景 | `--surface-2` (#16191d) |
| 边框 | 1px solid `--color-border` |
| 圆角 | `--radius-lg` (12px) |
| 内边距 | `--space-lg` (24px) |
| 顶部边缘高光 | 1px solid `--color-edge-highlight` |

## 伪元素实现（DSD / Shadow DOM）

```css
.card-linear {
  position: relative;
  border-radius: var(--card-radius);
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: var(--card-padding);
}

.card-linear::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: var(--edge-highlight);
  border-radius: var(--card-radius) var(--card-radius) 0 0;
  pointer-events: none;
}
```

## 状态

| 状态 | 视觉表现 |
|------|----------|
| Default | 标准样式 |
| Hover | 边框变为 `--color-border-hover`，背景微亮 |
| Active | 无变化（Linear 不做按压效果） |

## 变体

### 标准卡片
- 默认样式，用于 feature grid、docs landing

### 代码面板卡片
- 内边距：12px 16px（顶部标题栏）+ 24px（内容区）
- 包含 macOS 风格三个圆点（红/黄/绿）
- 顶部标题栏分隔线：1px solid `--color-border`

### 精选卡片（Featured）
- 边框变为 `--color-border-hover`
- 背景使用 `--surface-3`
- 用于定价页推荐方案

## 响应式

| 断点 | 变化 |
|------|------|
| Desktop | 多列网格，标准内边距 |
| Tablet | 两列网格 |
| Mobile | 单列，内边距减为 16px |

## 使用场景

| 场景 | 变体 |
|------|------|
| Feature grid | 标准卡片 |
| Docs entry paths | 标准卡片 |
| Code demo | 代码面板卡片 |
| Pricing tier | 精选卡片 |

## 注意事项

- **顶部边缘高光是关键细节** — 这是 Linear 的"像素渲染"感来源
- **hover 不做位移** — 只改变边框和背景色
- **无阴影** — 层级由 surface 差异和 hairline 实现
