# Input 组件规格

## 概述

Linear 风格的输入框。简洁、hairline 边框、聚焦时品牌色 ring。

## 样式规格

| 属性 | 值 |
|------|-----|
| 背景 | `--surface-1` (#0d0f12) |
| 边框 | 1px solid `--color-border` |
| 圆角 | `--radius-md` (8px) |
| 内边距 | 8px 12px |
| 字号 | 14px |
| 字重 | 400 |
| 文字颜色 | `--color-text-primary` |
| 占位符颜色 | `--color-text-muted` |
| 过渡 | border-color 150ms ease |

## 状态

| 状态 | 视觉表现 |
|------|----------|
| Default | 标准样式 |
| Hover | 边框变为 `--color-border-hover` |
| Focus | 边框变为 `--color-brand`，2px outline `--color-brand` at 50% opacity |
| Disabled | opacity 0.5, cursor not-allowed |
| Error | 边框变为 `--color-error` |

## 聚焦样式（CSS）

```css
.input-linear:focus {
  border-color: var(--color-brand);
  outline: 2px solid var(--color-brand);
  outline-offset: -1px;
  outline-opacity: 0.5;
}
```

## 变体

### 标准输入框
- 单行文本输入
- 用于表单、搜索

### 代码命令行输入框
- 等宽字体（JetBrains Mono）
- 用于展示 CLI 命令
- 右侧带 Copy 按钮
- 背景：`--surface-1`

### 搜索输入框
- 左侧带搜索图标（16×16）
- 占位符："Search documentation..."
- 用于搜索 overlay

## 尺寸

| 尺寸 | 内边距 | 字号 |
|------|--------|------|
| Default | 8px 12px | 14px |
| Small | 4px 8px | 12px |
| Large | 12px 16px | 16px |

## 使用场景

| 场景 | 变体 |
|------|------|
| 联系表单 | 标准输入框 |
| CLI 命令展示 | 代码命令行输入框 |
| 文档搜索 | 搜索输入框 |

## 注意事项

- **聚焦无 box-shadow glow** — 只用 outline
- **outline 在边框内部** — outline-offset: -1px
- **占位符颜色要足够暗** — 使用 `--color-text-muted`
