# Icon 组件规格

## 概述

Lucide 风格的单色图标。简洁线条、无填充、统一 1.5px 描边。

## 规格

| 属性     | 值                                            |
| -------- | --------------------------------------------- |
| 风格     | Outline（空心）                               |
| 描边宽度 | 1.5px                                         |
| 描边线帽 | Round                                         |
| 描边连接 | Round                                         |
| 颜色     | 单色（默认 `--color-text-secondary`，可覆写） |
| 尺寸     | 16×16 / 24×24 / 32×32                         |
| 视图框   | 0 0 24 24（默认）                             |

## 尺寸使用

| 尺寸  | 使用场景                     |
| ----- | ---------------------------- |
| 16×16 | 按钮内图标、行内图标、徽章   |
| 24×24 | 导航图标、卡片图标、功能图标 |
| 32×32 | Hero 区域大图标、空状态图标  |

## 颜色映射

| 场景         | 颜色                      |
| ------------ | ------------------------- |
| 卡片功能图标 | `--color-brand` (#5c7cfa) |
| 导航图标     | `--color-text-secondary`  |
| 按钮内图标   | 继承按钮文字色            |
| 禁用状态     | `--color-text-muted`      |

## Feature 图标清单

| 图标             | 文件名                 | 用途         | 建议 Lucide 名 |
| ---------------- | ---------------------- | ------------ | -------------- |
| Elements-first   | `elements-first.svg`   | Feature card | `layers`       |
| One renderer     | `one-renderer.svg`     | Feature card | `git-branch`   |
| App lifecycle    | `app-lifecycle.svg`    | Feature card | `workflow`     |
| Trusted boundary | `trusted-boundary.svg` | Feature card | `shield`       |
| Gate-proven      | `gate-proven.svg`      | Feature card | `check-circle` |
| Web standards    | `web-standards.svg`    | Feature card | `globe`        |

## SVG 规范

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- icon paths -->
</svg>
```

## 使用方式（openElement）

```tsx
// 作为内联 SVG
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="..."/>
</svg>

// CSS 控制颜色
.icon { color: var(--color-brand); }
```

## 注意事项

- **所有图标使用 currentColor** — 便于通过 CSS 控制颜色
- **不要为不同状态创建多色图标** — 单色即可
- **保持描边宽度一致** — 不要混用 1px 和 2px
- **图标与文字对齐** — 使用 flex align-items: center，gap: 6px
