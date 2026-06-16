# QA 验收清单

## 视觉验收

### 颜色

- [ ] Canvas 背景为 `#08080a`（非纯黑）
- [ ] Surface 阶梯清晰：canvas → surface-1 → surface-2 → surface-3
- [ ] Brand 色为 `#5c7cfa`（Indigo/Lavender）
- [ ] 文字层级清晰：primary → secondary → muted
- [ ] Border 为 `rgba(255,255,255,0.06)`（极细）
- [ ] 无装饰性渐变、无氛围光、无阴影

### 排版

- [ ] Hero 标题使用 80px，weight 600，letter-spacing -0.04em
- [ ] Display 字重不超过 600（无 700+）
- [ ] eyebrow 使用正字间距 +0.04em
- [ ] 正文使用 Inter 字体（从 Google Fonts 加载）
- [ ] 代码使用 JetBrains Mono（从 Google Fonts 加载）

### 组件

- [ ] Button 圆角 8px，padding 8px 14px（非 pill）
- [ ] Card 圆角 12px，padding 24px
- [ ] Card 顶部有 1px edge highlight（`rgba(255,255,255,0.08)`）
- [ ] Card hover 无位移（无 transform/translateY）
- [ ] Input focus 有 2px outline（品牌色，无 box-shadow）
- [ ] Nav 56px 高度，sticky，滚动后 backdrop-blur
- [ ] Badge pill 形状，小尺寸

### 图标

- [ ] 6 个 Feature Card 使用 SVG 图标（非文本缩写）
- [ ] 图标风格统一：Outline, 1.5px stroke, round cap/join
- [ ] 图标颜色：品牌色或 text-secondary

## 布局验收

### 首页

- [ ] Hero 左右分栏（Desktop ≥ 1024px）
- [ ] 右侧代码面板 480px 宽，macOS 风格圆点
- [ ] Feature Grid 3 列（Desktop），2 列（Tablet），1 列（Mobile）
- [ ] Showcase section 背景为 surface-1（层级提升）
- [ ] CTA Banner 有命令行输入框 + Copy 按钮
- [ ] Footer 4 列链接网格

### 文档页

- [ ] Docs landing 2×2 卡片网格
- [ ] 每个卡片有 badge + icon + title + description

### 设计系统页

- [ ] Dark/Light 色板对比展示
- [ ] Type scale 展示（display-xl 到 caption）
- [ ] Button 4 变体展示
- [ ] Card 展示（带 edge highlight）
- [ ] Input 展示（带 focus 状态）
- [ ] Badge 展示

## 响应式验收

- [ ] Desktop (≥ 1024px): 完整布局，代码面板显示
- [ ] Tablet (768-1023px): 2 列 features，hero 堆叠，代码面板隐藏
- [ ] Mobile (< 768px): 单列，简化 nav，减少 padding
- [ ] 移动端 768px 以下：无布局崩坏

## 交互验收

- [ ] Button hover：颜色变化，无位移
- [ ] Card hover：border 变亮，无位移
- [ ] Nav 链接 hover：文字变亮
- [ ] Input focus：品牌色 outline，无 glow
- [ ] 搜索 overlay：Cmd+K 快捷键，Esc 关闭
- [ ] Theme toggle：深色为默认，light 仅用于预览

## 性能验收

- [ ] Lighthouse 性能评分 ≥ 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] DSD 渲染无阻塞
- [ ] 字体预加载（Inter + JetBrains Mono）

## 可访问性验收

- [ ] WCAG 2.1 AA 颜色对比度通过
- [ ] 所有交互元素有 focus-visible 样式
- [ ] 图片有 alt 文本
- [ ] 按钮有 aria-label（图标按钮）
- [ ] 导航有 aria-current（当前页面）
- [ ] 颜色不是唯一信息传递手段（图标 + 文字）

## 浏览器兼容性

- [ ] Chrome 120+
- [ ] Firefox 120+
- [ ] Safari 17+
- [ ] Edge 120+
- [ ] 移动端 Safari (iOS 17+)
- [ ] 移动端 Chrome (Android 14+)

## 检查工具

- [ ] WebAIM Contrast Checker
- [ ] Lighthouse (Chrome DevTools)
- [ ] WAVE (Web Accessibility Evaluation Tool)
- [ ] BrowserStack（跨浏览器测试）
- [ ] Figma 设计稿对比（像素级检查）

## 签字

| 角色     | 姓名 | 日期 | 状态 |
| -------- | ---- | ---- | ---- |
| 设计师   |      |      | ☐    |
| 前端开发 |      |      | ☐    |
| 产品经理 |      |      | ☐    |
| QA       |      |      | ☐    |
