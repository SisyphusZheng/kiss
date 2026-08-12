export const meta = { section: 'Guide', label: 'Styling', order: 5 };

import { defineCustomElement } from '@openelement/element';
import { type GuideContent, GuidePage, guideStyles } from '@openelement/site-ui/guide-page.tsx';
import { contentLocale } from '@openelement/site-ui/locale.ts';

const content: Record<'en' | 'zh', GuideContent> = {
  en: {
    breadcrumb: 'Guide',
    title: 'Styling',
    lede:
      'Every page renders inside a custom element with declarative shadow DOM — a global stylesheet alone will not reach it.',
    outline: [
      { id: 'boundary', label: 'The shadow boundary', level: 3 },
      { id: 'crosses', label: "What crosses the boundary", level: 3 },
      { id: 'blocked', label: 'What does not', level: 3 },
      { id: 'patterns', label: 'The two supported patterns', level: 3 },
      { id: 'custom-props', label: 'Custom properties in practice', level: 3 },
    ],
    previous: { href: '/guide/getting-started', label: 'Getting Started' },
    next: { href: '/guide/core-concepts', label: 'Core Concepts' },
    cards: [
      {
        id: 'boundary',
        title: 'The shadow boundary',
        body:
          "Route pages render inside per-page custom elements (for example <page-blog-post>), and the server sends their content inside declarative shadow DOM. The page's own <style> and StyleSheet rules live in the shadow root. A document-level rule like .card { ... } or h1 { ... } is scoped to the light DOM and never reaches page content — silently: no console warning, no build error.",
      },
      {
        id: 'crosses',
        title: 'What crosses the boundary',
        body:
          'CSS custom properties inherit through shadow boundaries: --text-primary, --brand and friends defined on :root are readable inside every page. :host styles the page element itself from inside; ::slotted() styles light-DOM children projected into slots. Inherited text properties (color, font-family, line-height) also pass through.',
      },
      {
        id: 'blocked',
        title: 'What does not',
        body:
          'Class, id, and tag selectors from a document stylesheet never match inside the shadow root. Global resets (margin: 0 on *), typography rules, and utility-class systems therefore apply only to the document shell. This is encapsulation by design — it is also the most common first-day trap, because the instinct is a global stylesheet.',
      },
      {
        id: 'patterns',
        title: 'The two supported patterns',
        body:
          'One: a scoped StyleSheet — const s = new StyleSheet(); s.replaceSync(...); and pass it in defineElement({ styles: [s] }) or definePage(component) so it lands in the shadow root. Two: an inline <style> tag inside the rendered markup. Document-level <link rel="stylesheet"> and <style> in the head do not apply to shadow content.',
      },
      {
        id: 'custom-props',
        title: 'Custom properties in practice',
        body:
          'The starter defines a design-token layer on :root (colors, fonts, spacing) precisely so pages can be themed entirely through custom properties. Theme with tokens first; use the component StyleSheet for the page-internal layout and typography.',
      },
    ],
  },
  zh: {
    breadcrumb: '指南',
    title: '样式',
    lede: '每个页面都渲染在带 declarative shadow DOM 的 custom element 内部——单靠全局样式表无法触及页面内容。',
    outline: [
      { id: 'boundary', label: 'shadow 边界', level: 3 },
      { id: 'crosses', label: '什么能穿过边界', level: 3 },
      { id: 'blocked', label: '什么不能', level: 3 },
      { id: 'patterns', label: '两种受支持的写法', level: 3 },
      { id: 'custom-props', label: '自定义属性实战', level: 3 },
    ],
    previous: { href: '/guide/getting-started', label: '快速开始' },
    next: { href: '/guide/core-concepts', label: '核心概念' },
    cards: [
      {
        id: 'boundary',
        title: 'shadow 边界',
        body:
          '路由页面渲染在每页一个的 custom element 内（例如 <page-blog-post>），服务端以 declarative shadow DOM 输出其内容。页面自己的 <style> 与 StyleSheet 规则位于 shadow root 中。文档级规则如 .card { ... } 或 h1 { ... } 被限定在 light DOM，永远到不了页面内容——而且是静默的：没有 console 警告，也没有构建错误。',
      },
      {
        id: 'crosses',
        title: '什么能穿过边界',
        body:
          'CSS 自定义属性会穿透 shadow 边界继承：在 :root 上定义的 --text-primary、--brand 等在页面内均可读取。:host 从内部为页面元素本身设样式；::slotted() 作用于投影进 slot 的 light DOM 子节点。可继承的文本属性（color、font-family、line-height）同样能穿过。',
      },
      {
        id: 'blocked',
        title: '什么不能',
        body:
          '文档样式表中的 class、id 与标签选择器永远无法匹配到 shadow root 内部。全局 reset（* { margin: 0 }）、排版规则与工具类体系因此只对文档外壳生效。这是封装的设计意图——也是最常见的第一天陷阱，因为人的第一反应就是全局样式表。',
      },
      {
        id: 'patterns',
        title: '两种受支持的写法',
        body:
          '其一：scoped StyleSheet——const s = new StyleSheet(); s.replaceSync(...); 再通过 defineElement({ styles: [s] }) 或 definePage(component) 传入，使其进入 shadow root。其二：在渲染标记中内联 <style> 标签。文档级 <link rel="stylesheet"> 与 head 里的 <style> 不会作用于 shadow 内容。',
      },
      {
        id: 'custom-props',
        title: '自定义属性实战',
        body:
          'starter 在 :root 上定义了一层设计令牌（颜色、字体、间距），正是为了让页面可以完全通过自定义属性来主题化。优先用令牌做主题；组件自身的布局与排版再交给 StyleSheet。',
      },
    ],
  },
};

export class GuideStylingPage extends GuidePage {
  static override styles = [guideStyles()];
  static override guide = { content };

  protected override renderAfterCards(t: GuideContent): unknown {
    const zh = contentLocale(this._getLocale('en')) === 'zh';
    return (
      <>
        <h3>
          {zh ? '文档全局样式表（不会生效）' : 'A document-level stylesheet (does not apply)'}
        </h3>
        <open-code-block>
          <pre><code>{`/* app/styles.css — linked in the document head */
.card { border: 1px solid #ccc; }  /* never matches page content */`}</code></pre>
        </open-code-block>
        <h3>{zh ? 'Scoped StyleSheet（生效）' : 'A scoped StyleSheet (applies)'}</h3>
        <open-code-block>
          <pre><code>{`import { StyleSheet } from '@openelement/element';
import { defineElement } from '@openelement/app';

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: block; }
  .card {
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 1rem;
    color: var(--text-primary);
  }
\`);

defineElement('page-example', {
  styles,
  render() {
    return <section class='card'>Themed through custom properties.</section>;
  },
});`}</code></pre>
        </open-code-block>
      </>
    );
  }
}

export const tagName = 'guide-styling-page';
defineCustomElement(tagName, GuideStylingPage);
export default GuideStylingPage;
