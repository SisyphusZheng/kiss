# Button 组件规格

## 概述

Linear 风格的按钮系统。紧凑、无边框阴影、无悬浮上浮效果。

## 变体

### Primary（主按钮）

| 属性   | 值                                                                    |
| ------ | --------------------------------------------------------------------- |
| 背景   | `--color-brand` (#4263eb)                                             |
| 文字   | `#ffffff`                                                             |
| 圆角   | `--radius-md` (8px)                                                   |
| 内边距 | 8px 14px                                                              |
| 字号   | 14px                                                                  |
| 字重   | 500                                                                   |
| 过渡   | all 150ms ease                                                        |
| Hover  | 背景变为 `--color-brand-hover` (#3b5bdb)                              |
| Focus  | 2px outline, `--color-brand-light` at 50% opacity, outline-offset 2px |
| Active | 背景变为 `--color-brand-hover`                                        |

### Secondary（次按钮）

| 属性   | 值                                                                      |
| ------ | ----------------------------------------------------------------------- |
| 背景   | `--surface-1` (#0d0f12)                                                 |
| 文字   | `--color-text-primary` (#e9ecef)                                        |
| 边框   | 1px solid `--color-border`                                              |
| 圆角   | 8px                                                                     |
| 内边距 | 8px 14px                                                                |
| Hover  | 背景变为 `--color-border-hover` 透明度，边框变为 `--color-border-hover` |
| Focus  | 同上                                                                    |

### Tertiary（文字按钮）

| 属性   | 值                                |
| ------ | --------------------------------- |
| 背景   | transparent                       |
| 文字   | `--color-text-primary`            |
| 圆角   | 8px                               |
| 内边距 | 8px 14px                          |
| Hover  | 背景变为 `rgba(255,255,255,0.04)` |

### Inverse（反色按钮）

| 属性     | 值                      |
| -------- | ----------------------- |
| 背景     | `#ffffff`               |
| 文字     | `--bg-canvas` (#08080a) |
| 圆角     | 8px                     |
| 内边距   | 8px 14px                |
| Hover    | 背景变为 `#f1f3f5`      |
| 使用场景 | 深色背景上的 CTA        |

## 状态

| 状态           | 视觉表现                                      |
| -------------- | --------------------------------------------- |
| Default        | 标准颜色                                      |
| Hover          | 背景微变，边框微亮（无 transform/translateY） |
| Focus          | 2px 品牌色 outline，outline-offset 2px        |
| Active/Pressed | 背景进一步变暗                                |
| Disabled       | opacity 0.5, cursor not-allowed               |

## 尺寸

| 尺寸    | 内边距    | 字号 |
| ------- | --------- | ---- |
| Default | 8px 14px  | 14px |
| Small   | 4px 12px  | 12px |
| Large   | 12px 24px | 16px |

## 使用场景

| 场景           | 推荐变体  |
| -------------- | --------- |
| Hero CTA       | Primary   |
| 次要操作       | Secondary |
| 文字链接式按钮 | Tertiary  |
| 深色背景 CTA   | Inverse   |

## 注意事项

- **不做 pill 形状** — Linear 的按钮圆角为 8px，不是 pill
- **不做悬浮上浮** — hover 时只改变颜色和边框，不做 translateY 位移
- **不做 box-shadow** — 无阴影效果
