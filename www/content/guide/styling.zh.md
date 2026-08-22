---
title: '样式'
lede: '每个页面都渲染在带 declarative shadow DOM 的 custom element 内部——单靠全局样式表无法触及页面内容。'
order: 5
---

## shadow 边界

路由页面渲染在每页一个的 custom element 内（例如 `<page-blog-post>`），服务端以 declarative shadow DOM 输出其内容。页面自己的 `<style>` 与 `StyleSheet` 规则位于 shadow root 中。文档级规则如 `.card { ... }` 或 `h1 { ... }` 被限定在 light DOM，永远到不了页面内容——而且是静默的：没有 console 警告，也没有构建错误。

## 什么能穿过边界

CSS 自定义属性会穿透 shadow 边界继承：在 `:root` 上定义的 `--text-primary`、`--brand` 等在页面内均可读取。`:host` 从内部为页面元素本身设样式；`::slotted()` 作用于投影进 slot 的 light DOM 子节点。可继承的文本属性（`color`、`font-family`、`line-height`）同样能穿过。

## 什么不能

文档样式表中的 class、id 与标签选择器永远无法匹配到 shadow root 内部。全局 reset（`* { margin: 0 }`）、排版规则与工具类体系因此只对文档外壳生效。这是封装的设计意图——也是最常见的第一天陷阱，因为人的第一反应就是全局样式表。

## 两种受支持的写法

其一：scoped `StyleSheet`——`const s = new StyleSheet(); s.replaceSync(...);` 再通过 `defineElement({ styles: [s] })` 或 `definePage(component)` 传入，使其进入 shadow root。其二：在渲染标记中内联 `<style>` 标签。文档级 `<link rel="stylesheet">` 与 head 里的 `<style>` 不会作用于 shadow 内容。

### 文档全局样式表（不会生效）

```css
/* app/styles.css — linked in the document head */
.card { border: 1px solid silver; }  /* never matches page content */
```

### Scoped StyleSheet（生效）

```ts
import { StyleSheet } from '@openelement/element';
import { defineElement } from '@openelement/app';

const styles = new StyleSheet();
styles.replaceSync(`
  :host { display: block; }
  .card {
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 1rem;
    color: var(--text-primary);
  }
`);

defineElement('page-example', {
  styles,
  render() {
    return <section class='card'>Themed through custom properties.</section>;
  },
});
```

## 自定义属性实战

starter 在 `:root` 上定义了一层设计令牌（颜色、字体、间距），正是为了让页面可以完全通过自定义属性来主题化。优先用令牌做主题；组件自身的布局与排版再交给 `StyleSheet`。
