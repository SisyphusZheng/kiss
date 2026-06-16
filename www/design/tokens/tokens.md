# Design Tokens

## 颜色系统

### 深色模式（默认营销主题）

| Token            | 值                       | 说明               | 对应 Open Props    |
| ---------------- | ------------------------ | ------------------ | ------------------ |
| `bg-canvas`      | `#08080a`                | 页面背景           | `--gray-0`         |
| `surface-1`      | `#0d0f12`                | 导航、次要面板     | `--gray-1`         |
| `surface-2`      | `#16191d`                | 卡片、代码块       | `--gray-2`         |
| `surface-3`      | `#212529`                | 弹出层、下拉菜单   | `--gray-3`         |
| `brand`          | `#4263eb`                | 主色调（Indigo-7） | `--indigo-7`       |
| `brand-hover`    | `#3b5bdb`                | 按钮悬停           | `--indigo-8`       |
| `brand-light`    | `#5c7cfa`                | 焦点环             | `--indigo-5`       |
| `text-primary`   | `#e9ecef`                | 主文字             | `--gray-10`        |
| `text-secondary` | `#adb5bd`                | 次要文字           | `--gray-7`         |
| `text-muted`     | `#868e96`                | 辅助文字           | `--gray-6`         |
| `border`         | `rgba(255,255,255,0.06)` | 细边框             | `--border`         |
| `border-hover`   | `rgba(255,255,255,0.10)` | 悬停边框           | `--border-hover`   |
| `edge-highlight` | `rgba(255,255,255,0.08)` | 卡片顶部高光       | `--edge-highlight` |

### 浅色模式（产品 UI 预览用）

| Token            | 值                       | 说明         |
| ---------------- | ------------------------ | ------------ |
| `bg-canvas`      | `#f8f9fa`                | 页面背景     |
| `surface-1`      | `#ffffff`                | 面板         |
| `surface-2`      | `#f1f3f5`                | 卡片         |
| `surface-3`      | `#e9ecef`                | 提升元素     |
| `brand`          | `#4263eb`                | 主色调       |
| `brand-hover`    | `#3b5bdb`                | 按钮悬停     |
| `brand-light`    | `#5c7cfa`                | 焦点环       |
| `text-primary`   | `#12131a`                | 主文字       |
| `text-secondary` | `#626676`                | 次要文字     |
| `text-muted`     | `#8e92a2`                | 辅助文字     |
| `border`         | `rgba(18,19,26,0.08)`    | 细边框       |
| `border-hover`   | `rgba(18,19,26,0.12)`    | 悬停边框     |
| `edge-highlight` | `rgba(255,255,255,0.50)` | 卡片顶部高光 |

## 排版系统

### 字体栈

- **Sans**: `Inter, SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto, sans-serif`
- **Mono**: `JetBrains Mono, SF Mono, Fira Code, Fira Mono, ui-monospace, monospace`

### 字号阶梯

| Token        | 大小 | 字重 | 行高 | 字间距   | 用途           |
| ------------ | ---- | ---- | ---- | -------- | -------------- |
| `display-xl` | 80px | 600  | 0.95 | -0.04em  | Hero 大标题    |
| `display-lg` | 56px | 600  | 1.05 | -0.03em  | 章节标题       |
| `display-md` | 40px | 600  | 1.05 | -0.02em  | 子章节标题     |
| `headline`   | 28px | 600  | 1.20 | -0.01em  | 定价、CTA 横幅 |
| `card-title` | 22px | 500  | 1.25 | -0.005em | 卡片标题       |
| `subhead`    | 20px | 400  | 1.40 | -0.01em  | 引导段落       |
| `body-lg`    | 18px | 400  | 1.50 | 0        | Hero 副标题    |
| `body`       | 16px | 400  | 1.50 | 0        | 正文           |
| `body-sm`    | 14px | 400  | 1.50 | 0        | 卡片正文、页脚 |
| `caption`    | 12px | 400  | 1.40 | 0        | 说明、元数据   |
| `button`     | 14px | 500  | 1.20 | 0        | 按钮标签       |
| `eyebrow`    | 13px | 500  | 1.30 | +0.04em  | 章节标签       |
| `mono`       | 13px | 400  | 1.50 | 0        | 代码片段       |

> **核心原则**：Display 字重只用 600，从不用 700+。eyebrow 使用正字间距（+0.04em）与 Display 的负字间距形成对比。

## 间距系统

| Token     | 值   | 用途                     |
| --------- | ---- | ------------------------ |
| `xxs`     | 4px  | 微间隙                   |
| `xs`      | 8px  | 按钮垂直内边距、图标间隙 |
| `sm`      | 12px | 按钮间隙、卡片间隙       |
| `md`      | 16px | 标准间隙                 |
| `lg`      | 24px | 卡片内边距、章节间距     |
| `xl`      | 32px | 页面水平内边距           |
| `xxl`     | 48px | 大间距                   |
| `section` | 96px | 章节间距                 |

## 圆角系统

| Token  | 值     | 用途                 |
| ------ | ------ | -------------------- |
| `xs`   | 4px    | 小标签、状态徽章     |
| `sm`   | 6px    | 行内标签             |
| `md`   | 8px    | 按钮、输入框、标签页 |
| `lg`   | 12px   | 卡片、功能卡片       |
| `xl`   | 16px   | 产品面板、代码块     |
| `pill` | 9999px | 状态徽章、标签页切换 |

## 阴影系统

| Token      | 值                                 | 说明                 |
| ---------- | ---------------------------------- | -------------------- |
| `none`     | `none`                             | Linear 无装饰性阴影  |
| `elevated` | `0 0 0 1px rgba(255,255,255,0.06)` | 仅用于提升元素的边框 |

## 响应式断点

| 名称      | 宽度       | 布局变化                     |
| --------- | ---------- | ---------------------------- |
| `desktop` | ≥ 1024px   | 三列功能网格、hero 左右布局  |
| `tablet`  | 768–1023px | 两列功能网格、hero 堆叠      |
| `mobile`  | < 768px    | 单列、简化导航、隐藏代码面板 |
