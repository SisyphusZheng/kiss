---
title: 'MDX'
section: '指南'
label: 'MDX'
order: 6
---

# MDX

MDX 让你可以在 Markdown 中直接使用 JSX 组件。openElement 会把 `app/content`
下的 `.mdx` 文件当作内容路由或页面数据源。

## 基本用法

```mdx
---
title: 'Hello MDX'
---

# {frontmatter.title}

这是一个段落，下面是一个组件：

<MyCounter />
```

## 导入组件

```mdx
import { MyCard } from '../components/MyCard.tsx';

<MyCard title='提示'>
  MDX 中的组件会经过 openElement 的 JSX runtime 渲染。
</MyCard>
```

## 内容集合

把 MDX 文件放在 `app/content/posts/` 下，通过 `openElement()` 的 content
配置生成集合页面和单个页面。

## 安全

MDX 默认不信任原始 HTML。需要嵌入原始 HTML 时，使用 `trustedHtml` 明确标记信任边界。

## 限制

- MDX 只在 build 或请求时执行一次，不支持客户端状态。
- 交互组件应通过 island 在客户端升级。
