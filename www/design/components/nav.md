# Navigation 组件规格

## 概述

Sticky 顶部导航栏。56px 高度，透明背景，滚动后加 backdrop-blur。

## 样式规格

| 属性       | 值                                                     |
| ---------- | ------------------------------------------------------ |
| 高度       | 56px                                                   |
| 背景       | `--bg-canvas` (默认透明)                               |
| 底部边框   | 1px solid transparent（默认）                          |
| 滚动后边框 | 1px solid `--color-border`                             |
| 滚动后背景 | `rgba(8, 8, 10, 0.85)` + `backdrop-filter: blur(12px)` |
| 内边距     | 0 32px                                                 |
| 最大宽度   | 1200px（内容区）                                       |

## 布局

```
┌────────────────────────────────────────────────────────────┐
│  openElement    Guide  API  Architecture  Blog    GitHub  [Get started] │
│  (logo)         (links)                           (secondary) (primary)│
└────────────────────────────────────────────────────────────┘
```

### Logo 区域

- 左对齐，32px 左内边距
- 字体：18px, weight 600, letter-spacing -0.02em
- 颜色：`--color-text-primary`

### 导航链接

- 居中偏右
- 字体：14px, weight 400
- 颜色：`--color-text-secondary`
- Hover：`--color-text-primary`
- 链接间距：24px
- 链接列表：Guide, API, Architecture, Blog

### 右侧操作

- "GitHub" 按钮：Secondary 变体
- "Get started" 按钮：Primary 变体

## 状态

| 状态         | 视觉表现                          |
| ------------ | --------------------------------- |
| 默认（顶部） | 透明背景，无边框                  |
| 滚动后       | backdrop-blur，底部 hairline 边框 |
| 链接 Hover   | 文字变亮                          |
| 链接 Active  | 文字保持亮色                      |

## 响应式

| 断点    | 变化                                   |
| ------- | -------------------------------------- |
| Desktop | 完整导航 + 按钮                        |
| Tablet  | 隐藏部分链接，保留 Guide + Get started |
| Mobile  | 汉堡菜单，全屏 overlay 导航            |

## 移动端汉堡菜单

- 图标：三条横线，16×16
- 颜色：`--color-text-secondary`
- 点击后：全屏 overlay，背景 `--overlay`
- 菜单项：24px 字号，垂直排列，居中对齐
- 关闭按钮：X 图标，右上角

## 使用场景

| 页面       | 导航内容        |
| ---------- | --------------- |
| 首页       | 完整导航        |
| 文档页     | 完整导航 + 搜索 |
| 设计系统页 | 完整导航        |

## 注意事项

- **backdrop-blur 在 Safari 需要 `-webkit-backdrop-filter`**
- **z-index 要足够高** — 50+，避免被其他元素覆盖
- **滚动检测用 Intersection Observer 或 scroll event** — 建议 throttle 到 100ms
