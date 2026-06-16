# 迁移指南：从旧版到 Linear 风格

## 概述

将 openElement 官网从现有设计（v0.40.7）迁移到 Linear.app 风格（v1.0.0 design）。

## 迁移范围

### 页面

- [ ] 首页（`www/app/routes/index/index.tsx`）
- [ ] 文档入口（`www/app/routes/docs/index.tsx`）
- [ ] 设计系统（`www/app/routes/architecture/design-system.tsx`）
- [ ] 404 页面（`www/app/routes/404.tsx`）
- [ ] 导航栏（`packages/ui/src/open-layout.tsx`）

### 组件

- [ ] 新增 `linear-token-sheet.ts`（token 覆写）
- [ ] 新增 `open-button-linear.tsx`（4 变体）
- [ ] 新增 `open-card-linear.tsx`（带 edge highlight）
- [ ] 新增 `open-input-linear.tsx`（聚焦 ring）
- [ ] 新增 `open-nav-linear.tsx`（sticky + blur）
- [ ] 新增 `open-badge-linear.tsx`（pill 状态）
- [ ] 更新 `open-layout.tsx`（使用新 nav）

## 迁移步骤

### Phase 1: Token 层（1 天）

1. **创建 `linear-token-sheet.ts`**
   - 位置：`packages/ui/src/linear-token-sheet.ts`
   - 内容：覆写所有颜色、字体、间距、圆角 token
   - 导出：`linearTokenSheet`

2. **更新 `vite.config.ts`**
   - 在 `inject.headFragments` 加入 Inter 和 JetBrains Mono 字体 CDN
   - 确保 `--shadow-1` 被覆写为 `none`

3. **验证深色模式为唯一主题**
   - 确认 `theme-init.js` 默认 dark（已满足）
   - light 模式仅用于产品 UI 预览

### Phase 2: 组件层（2 天）

1. **Button 组件**
   - 文件：`packages/ui/src/open-button-linear.tsx`
   - 变体：Primary / Secondary / Tertiary / Inverse
   - 样式：8px 圆角，8px 14px padding，无悬浮上浮

2. **Card 组件**
   - 文件：`packages/ui/src/open-card-linear.tsx`
   - 关键：`::before` 顶部 edge highlight 伪元素
   - Hover：只改变 border/bg，无位移

3. **Input 组件**
   - 文件：`packages/ui/src/open-input-linear.tsx`
   - Focus：2px outline，品牌色，outline-offset -1px
   - 无 box-shadow glow

4. **Nav 组件**
   - 文件：`packages/ui/src/open-nav-linear.tsx`
   - Sticky，56px 高度
   - 滚动后：backdrop-blur + 底部 border

5. **Badge 组件**
   - 文件：`packages/ui/src/open-badge-linear.tsx`
   - Pill 形状，小尺寸

6. **在 `index.ts` 导出所有新组件**

### Phase 3: 页面层（2 天）

1. **首页重写**
   - 新文件：`www/app/routes/index/hero-linear.tsx`
   - 新文件：`www/app/routes/index/features-linear.tsx`
   - 新文件：`www/app/routes/index/showcase-linear.tsx`
   - 新文件：`www/app/routes/index/cta-linear.tsx`
   - 整合到 `index.tsx`

2. **文档入口重写**
   - 更新 `docs/index.tsx`
   - 使用 `open-card-linear` 替代现有卡片

3. **设计系统页重写**
   - 更新 `architecture/design-system.tsx`
   - 展示新组件调色板/排版/组件面板
   - 色值使用 CSS custom properties 动态渲染

4. **404 页重写**
   - 更简洁的 Linear 风格

### Phase 4: 细节打磨（1 天）

1. **Feature Icons**
   - 从 `design/icons/` 复制到 `www/public/assets/icons/`
   - 在 Feature Cards 中使用 SVG 图标替代文本缩写

2. **Typography 调整**
   - 确保中文环境下负字间距不会过度收紧
   - 必要时中文减小负字间距

3. **Hairline 清晰度**
   - 在 Retina 屏验证 1px border 清晰度
   - 必要时使用 `transform: scaleY(0.5)` 或 `0.5px` border

4. **Edge Highlight 验证**
   - 确保在各 surface 层级上可见
   - 测试 hover 状态下的可见性

5. **移动端断点测试**
   - 768px / 1024px
   - 确认代码面板在 tablet 以下隐藏

### Phase 5: 性能与可访问性（0.5 天）

1. **Focus 样式**
   - 所有新组件的 `focus-visible` 符合 Linear 风格
   - 2px outline, 品牌色, outline-offset 2px

2. **Color Contrast**
   - 验证 WCAG 2.1 AA 标准
   - 工具：WebAIM Contrast Checker

3. **DSD 性能**
   - 确认 `contain: layout style` 使用正确
   - 检查 shadow DOM 渲染性能

4. **Theme 默认**
   - 确认 `theme-init.js` 默认 dark

## 回滚计划

如果迁移出现问题，可通过以下方式回滚：

1. Git 回退到迁移前 commit
2. 或保留旧组件，通过 feature flag 切换

## 验收标准

- [ ] 所有页面视觉风格统一（无页面间落差）
- [ ] 首页 hero 右侧有代码演示面板
- [ ] Feature Cards 使用 SVG 图标（非文本缩写）
- [ ] 所有卡片有顶部 edge highlight
- [ ] 按钮 hover 无位移（无 transform）
- [ ] 无装饰性阴影（shadow-1: none）
- [ ] 深色模式为唯一营销主题
- [ ] 移动端 640px 以下布局正常
- [ ] Lighthouse 性能评分 ≥ 90
- [ ] WCAG 2.1 AA 颜色对比度通过
