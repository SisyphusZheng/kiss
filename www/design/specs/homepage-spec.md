# Homepage 页面规格

## 概述

openElement 首页。Linear.app 风格深色科技风。单页长滚动，包含 5 个主要 section。

## 布局结构

```
┌────────────────────────────────────────┐
│              Nav (56px)                │ ← Sticky, backdrop-blur on scroll
├────────────────────────────────────────┤
│                                        │
│  Hero Section                          │
│  ├── Eyebrow                           │
│  ├── Headline                          │
│  ├── Subhead                           │
│  ├── CTA Buttons                       │
│  └── Code Panel (right, 480px)         │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  Features Section                      │
│  ├── Eyebrow                           │
│  ├── Headline                          │
│  └── Feature Grid (3×2)                │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  Showcase Section (bg: surface-1)      │
│  ├── Eyebrow                           │
│  ├── Headline                          │
│  └── Demo Panel (code + preview)       │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  CTA Banner                            │
│  ├── Headline                          │
│  ├── Subhead                           │
│  ├── Command Line Input                │
│  └── Button                            │
│                                        │
├────────────────────────────────────────┤
│              Footer                    │
│  ├── Logo + Slogan                     │
│  ├── Link Columns (4×)                 │
│  └── Bottom Bar                        │
└────────────────────────────────────────┘
```

## Section 1: Hero

### 布局
- 全宽，高度 auto
- Padding-top: 120px（为 nav 留空间）
- Padding-bottom: 64px
- 内容区：max-width 1200px，居中
- 左右分栏：左侧文字 + 右侧代码面板（480px 宽）

### 左侧内容

| 元素 | 内容 | 样式 |
|------|------|------|
| Eyebrow | "openElement 0.40.7 / v0.40.7 active" | 13px, weight 500, brand color, letter-spacing +0.04em, uppercase |
| Headline | "THE OPEN" / "ELEMENT." | 80px (clamp), weight 600, letter-spacing -0.04em, line-height 0.95 |
| Headline accent | "ELEMENT." | brand color |
| Subhead | 平台描述 | 18px, weight 400, text-secondary, line-height 1.5, max-width 520px |
| CTA Bar | "Start building" + "Read architecture" | Primary + Secondary button |

### 右侧代码面板
- 宽度：480px
- 背景：surface-2
- 圆角：12px
- 边框：1px solid border
- 顶部 edge highlight
- macOS 风格三个圆点（红/黄/绿）
- 标题栏分隔线
- 内容：Syntax highlighted JSX 代码

### 响应式
- Desktop (≥1024px): 左右分栏
- Tablet (<1024px): 堆叠，代码面板隐藏
- Mobile: 字号缩小，padding 减小

## Section 2: Features

### 布局
- 全宽
- Padding: 96px 32px
- 内容区：max-width 1200px，居中

### 内容

| 元素 | 样式 |
|------|------|
| Eyebrow | "Why openElement" — 13px, brand, uppercase, +0.04em |
| Headline | "Static-first Web Components without duplicate render paths." — 40px, weight 600, -0.02em |
| Feature Grid | 3 列，gap 16px |

### Feature Card
- 每个卡片：surface-2 背景，12px 圆角，1px border
- 顶部 edge highlight
- 24px 内边距
- 内容：32px icon + 22px title + 14px description
- Icon 颜色：brand
- Hover：border 变亮，无位移

### 响应式
- Desktop: 3 列
- Tablet: 2 列
- Mobile: 1 列

## Section 3: Showcase

### 布局
- 全宽，背景 surface-1（提升层级）
- Padding: 96px 32px

### 内容
- Eyebrow: "How it works" — brand color
- Headline: "One pipeline. Zero runtime overhead." — 40px, weight 600
- Demo Panel: 大型卡片，包含代码 + 预览
  - Tab 切换：JSX / DSD / DOM
  - 左侧：syntax highlighted 代码
  - 右侧：实时 DSD 渲染预览

## Section 4: CTA Banner

### 布局
- 全宽
- Padding: 96px 32px

### 内容
- Headline: "Ready to build with Web Standards?" — 40px, weight 600
- Subhead: "Get started in 30 seconds." — 20px, text-secondary
- Command line: `deno run -A jsr:@openelement/create my-app`
  - Input 样式展示，带 Copy 按钮
- Button: "Read the docs" — Primary

## Section 5: Footer

### 布局
- 全宽，背景 canvas
- Padding: 64px 32px
- 顶部 border: 1px solid border

### 内容
- 左侧：Logo + 标语
- 右侧：4 列链接网格
  - Product: Elements, UI, Framework, Protocols
  - Resources: Guide, API, Architecture, Blog
  - Company: GitHub, JSR, Changelog
  - Legal: MIT License, Contributing
- 底部：版权信息

## 响应式断点

| 断点 | 关键变化 |
|------|----------|
| ≥ 1024px | 3 列 features，hero 左右分栏，代码面板显示 |
| 768–1023px | 2 列 features，hero 堆叠，代码面板隐藏 |
| < 768px | 1 列，简化 nav，减少 padding |

## 间距速查

| 区域 | 上内边距 | 下内边距 | 水平内边距 |
|------|----------|----------|------------|
| Hero | 120px | 64px | 32px |
| Features | 96px | 96px | 32px |
| Showcase | 96px | 96px | 32px |
| CTA | 96px | 96px | 32px |
| Footer | 64px | 64px | 32px |

## 注意事项

- 所有 section 之间使用 `96px` 间距（不用分隔线或背景色差异）
- Showcase section 使用 surface-1 背景作为唯一层级提升手段
- 所有文字内容左对齐（非居中），符合 Linear 风格
- 移动端隐藏右侧代码面板（保留 CTA 按钮）
