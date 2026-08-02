/**
 * @openelement/ui - Web Standards Lab design system page.
 */
export const meta = { section: 'Reference', label: 'Design System', order: 10 };
export const tagName = 'design-system-page';

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/ui/open-input';
import '@openelement/site-ui/open-lab-panel.tsx';
import '@openelement/site-ui/open-lab-stage.tsx';
import '@openelement/site-ui/open-standards-visual.tsx';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';
import '@openelement/site-ui/open-section-frame.tsx';

const pageSheet = new StyleSheet();
pageSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
  }

  .system {
    width: 100%;
    margin-inline: auto;
    padding-block: 0 var(--site-section-block);
  }

  .kicker,
  .label,
  .token-name {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .kicker,
  .label {
    margin: 0 0 var(--size-4);
  }

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  h1 {
    margin-block-end: 0;
    font-size: var(--font-size-6);
    line-height: .92;
    letter-spacing: 0;
    font-weight: var(--font-weight-9);
  }

  .subtitle,
  .rule-list li,
  .component-card p,
  .principle p,
  .token-row span {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .subtitle {
    max-width: 760px;
    margin-block: var(--size-6) 0;
    font-size: var(--font-size-2);
    line-height: 1.24;
  }

  .rule-list {
    margin: 0;
    padding-inline-start: var(--size-5);
  }

  .rule-list li + li {
    margin-block-start: var(--size-2);
  }

  .token-grid,
  .component-grid,
  .principles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--size-4);
  }

  .token-row {
    display: grid;
    grid-template-columns: minmax(150px, .38fr) minmax(0, 1fr);
    gap: var(--size-4);
    align-items: start;
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .token-row:last-child {
    border-block-end: 0;
  }

  .component-card {
    min-height: 220px;
    background: color-mix(in srgb, var(--bg-card) 84%, transparent);
  }

  .component-card h3,
  .principle h3 {
    margin-block: 0 var(--size-3);
    color: var(--text-primary);
    font-size: var(--font-size-3);
    line-height: 1.05;
    letter-spacing: 0;
  }

  .component-card p,
  .principle p {
    margin-block: var(--size-4) 0;
  }

  .button-row,
  .badge-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-2);
  }

  .visual-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(0, .82fr);
    gap: var(--size-5);
  }

  .stage-demo {
    --lab-stage-min-height: 430px;
  }

  .code-sample {
    margin: 0;
    color: var(--code-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: var(--font-lineheight-4);
    white-space: pre-wrap;
  }

  .nav-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-3);
    margin: var(--size-8) var(--size-5) 0;
  }

  @media (max-width: 1120px) {
    .token-grid,
    .component-grid,
    .principles,
    .visual-grid {
      grid-template-columns: 1fr;
    }

  }

  @media (max-width: 620px) {
    .system {
      padding-block-start: var(--size-8);
    }

    h1 {
      font-size: var(--font-size-6);
    }

    .subtitle {
      font-size: var(--font-size-1);
    }

    .token-row {
      grid-template-columns: 1fr;
    }
  }
`);

const tokenRows = [
  ['Canvas', '--bg-base', 'Page background and grid field.'],
  ['Surface', '--bg-card / --bg-elevated', 'Reading surfaces and raised panels.'],
  ['Artifact', '--bg-code / --code-border', 'Code, devtools, route, and package diagrams.'],
  ['Text', '--text-primary / --text-secondary', 'Readable hierarchy in both themes.'],
  ['Action', '--brand / --on-brand', 'Primary command and link emphasis.'],
  [
    'State',
    '--success / --warning / --info / --error',
    'Roadmap, standards, reference, and failure states.',
  ],
];

const principles = [
  [
    'Lead with the product object',
    'Show routes, package graphs, code, browser contracts, or docs structure in the first viewport.',
  ],
  [
    'Use components as the site system',
    'The website dogfoods retained @openelement/ui primitives; UI remains optional for application authors.',
  ],
  [
    'Treat dark mode as parity',
    'Every page and shadow component must resolve through the same semantic tokens.',
  ],
];

const tokenRowsZh = [
  ['Canvas', '--bg-base', '页面背景与网格底场。'],
  ['Surface', '--bg-card / --bg-elevated', '阅读表面与浮层面板。'],
  ['Artifact', '--bg-code / --code-border', '代码、devtools、路由与包结构图。'],
  ['Text', '--text-primary / --text-secondary', '明暗两套主题下都可读的文本层级。'],
  ['Action', '--brand / --on-brand', '主要命令与链接强调。'],
  [
    'State',
    '--success / --warning / --info / --error',
    '路线图、标准、参考与失败状态。',
  ],
];

const principlesZh = [
  [
    '以产品对象开场',
    '在第一个视口展示路由、包图、代码、浏览器契约或文档结构。',
  ],
  [
    '把组件当作站点体系',
    '本站 dogfood 沿用的 @openelement/ui 原语；对应用作者而言 UI 始终是可选的。',
  ],
  [
    '把暗色模式当作对等',
    '每个页面与每个 shadow 组件都必须经由同一套语义 token 解析。',
  ],
];

const content = {
  en: {
    eyebrow: 'Web Standards Lab',
    title: 'Design',
    titleAccent: 'System',
    lede:
      'The active www dogfood contract: audited Open Props tokens, retained UI primitives, product-art diagrams and full dark-mode parity. It is not a framework requirement.',
    rulesLabel: 'rules',
    rules: [
      'Strict Open Props and semantic tokens only.',
      'Only reusable primitives live in `@openelement/ui`; site visuals stay in `www`.',
      'Kinetic motion respects reduced-motion preferences.',
      'No Linear clone, decorative blobs, or local color systems.',
      'Letter spacing remains `0`.',
    ],
    tokenIndex: '01 / token contract',
    tokenTitle: 'Semantic roles mapped to Open Props.',
    tokenCopy:
      'Raw Open Props values stop at the audited token boundary; pages and primitives consume semantic roles.',
    tokenPanelLabel: 'token roles',
    primitivesIndex: '02 / primitives',
    primitivesTitle: 'The site dogfoods optional UI primitives.',
    primitivesCopy:
      'Button, input, badge and card behavior stays reusable; brand and cinematic objects remain private to the website.',
    chainLabel: 'token → recipe → primitive',
    chainMeta: 'ownership chain',
    chainTokenCopy: 'surface, text, brand, focus, motion and elevation roles',
    chainRecipeCopy: 'interactive state, typography and material composition',
    chainPrimitiveCopy: 'ten reusable Web Components with tested semantics',
    buttonsTitle: 'Buttons',
    buttonsCopy: 'Commands use stable dimensions, token colors, and focus-visible states.',
    fieldsTitle: 'Fields',
    fieldsCopy: 'Inputs stay utilitarian and inherit the same Open Props token system.',
    statusTitle: 'Status + motion',
    statusCopy: 'Status labels and motion states are readable text first and color second.',
    artIndex: '03 / product art',
    artTitle: 'Code and diagrams are the visual asset.',
    artCopy:
      'Real standards objects carry the visual identity without stock illustration or framework-shaped decoration.',
    artPanelLabel: 'token board',
    compositionIndex: '04 / composition',
    compositionTitle: 'Composition principles',
    compositionCopy:
      'Each page begins with a product object, preserves dark/light parity and keeps motion subordinate to comprehension.',
    navDocs: 'Docs',
    navArchitecture: 'Architecture',
    navRoadmap: 'Roadmap',
  },
  zh: {
    eyebrow: 'Web 标准实验室',
    title: '设计',
    titleAccent: '体系',
    lede:
      'www 站点当前生效的 dogfood 契约：经过审计的 Open Props token、沿用的 UI 原语、产品化图示，以及完整的暗色模式对等。它不是框架的强制要求。',
    rulesLabel: '规则',
    rules: [
      '只使用严格的 Open Props 与语义化 token。',
      '只有可复用的原语才进入 `@openelement/ui`；站点视觉留在 `www`。',
      '动效尊重 reduced-motion 偏好。',
      '不做 Linear 翻版、装饰性色块或局部色彩体系。',
      'Letter spacing 保持为 `0`。',
    ],
    tokenIndex: '01 / token 契约',
    tokenTitle: '语义角色映射到 Open Props。',
    tokenCopy: '原始的 Open Props 值止步于经过审计的 token 边界；页面与原语只消费语义角色。',
    tokenPanelLabel: 'token 角色',
    primitivesIndex: '02 / 原语',
    primitivesTitle: '本站 dogfood 可选的 UI 原语。',
    primitivesCopy: '按钮、输入框、徽章与卡片的行为保持可复用；品牌与电影感对象仍是本站私有。',
    chainLabel: 'token → 配方 → 原语',
    chainMeta: '所有权链',
    chainTokenCopy: 'surface、text、brand、focus、motion 与 elevation 角色',
    chainRecipeCopy: '交互状态、排版与材质组合',
    chainPrimitiveCopy: '十个语义经过测试的可复用 Web Components',
    buttonsTitle: '按钮',
    buttonsCopy: '命令使用稳定的尺寸、token 颜色与 focus-visible 状态。',
    fieldsTitle: '输入框',
    fieldsCopy: '输入框保持实用，继承同一套 Open Props token 体系。',
    statusTitle: '状态与动效',
    statusCopy: '状态标签与动效状态以可读文本为先，颜色其次。',
    artIndex: '03 / 产品视觉',
    artTitle: '代码与图示就是视觉资产。',
    artCopy: '真实的标准对象承载视觉识别，无需素材插画，也无需框架味的装饰。',
    artPanelLabel: 'token 看板',
    compositionIndex: '04 / 组合',
    compositionTitle: '组合原则',
    compositionCopy: '每个页面都从一个产品对象开始，保持明暗对等，并让动效从属于理解。',
    navDocs: '文档',
    navArchitecture: '架构',
    navRoadmap: '路线图',
  },
} as const;

export class DesignSystemPage extends OpenElement {
  static override styles = [pageSheet];

  override render() {
    const isZh = this._getLocale('en') === 'zh';
    const t = content[isZh ? 'zh' : 'en'];
    const rows = isZh ? tokenRowsZh : tokenRows;
    const principleCards = isZh ? principlesZh : principles;
    return (
      <main class='system'>
        <open-page-hero variant='technical'>
          <span slot='eyebrow'>{t.eyebrow}</span>
          <span slot='title'>{t.title}</span>
          <span slot='title-accent'>{t.titleAccent}</span>
          <span slot='lede'>
            {t.lede}
          </span>
          <open-artifact-panel slot='artifact'>
            <span slot='label'>{t.rulesLabel}</span>
            <span slot='meta'>v3</span>
            <ul class='rule-list'>
              {t.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </open-artifact-panel>
        </open-page-hero>

        <open-section-frame>
          <span slot='index'>{t.tokenIndex}</span>
          <span slot='title'>{t.tokenTitle}</span>
          <span slot='copy'>
            {t.tokenCopy}
          </span>
          <open-lab-panel label={t.tokenPanelLabel} meta='source: openPropsTokenSheet'>
            {rows.map(([role, token, copy]) => (
              <div class='token-row'>
                <strong class='token-name'>{role}</strong>
                <span>
                  <code>{token}</code> - {copy}
                </span>
              </div>
            ))}
          </open-lab-panel>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>{t.primitivesIndex}</span>
          <span slot='title'>{t.primitivesTitle}</span>
          <span slot='copy'>
            {t.primitivesCopy}
          </span>
          <open-artifact-panel>
            <span slot='label'>{t.chainLabel}</span>
            <span slot='meta'>{t.chainMeta}</span>
            <div class='token-row'>
              <strong class='token-name'>Token</strong>
              <span>{t.chainTokenCopy}</span>
            </div>
            <div class='token-row'>
              <strong class='token-name'>Recipe</strong>
              <span>{t.chainRecipeCopy}</span>
            </div>
            <div class='token-row'>
              <strong class='token-name'>Primitive</strong>
              <span>{t.chainPrimitiveCopy}</span>
            </div>
          </open-artifact-panel>
          <div class='component-grid'>
            <open-card class='component-card'>
              <h3>{t.buttonsTitle}</h3>
              <div class='button-row'>
                <open-button variant='primary'>Primary</open-button>
                <open-button>Secondary</open-button>
                <open-button variant='ghost'>Ghost</open-button>
              </div>
              <p>{t.buttonsCopy}</p>
            </open-card>
            <open-card class='component-card'>
              <h3>{t.fieldsTitle}</h3>
              <open-input value='app/routes/index.tsx' readonly></open-input>
              <p>{t.fieldsCopy}</p>
            </open-card>
            <open-card class='component-card'>
              <h3>{t.statusTitle}</h3>
              <div class='badge-row'>
                <open-badge tone='brand'>current</open-badge>
                <open-badge tone='success'>done</open-badge>
                <open-badge tone='warning'>planned</open-badge>
              </div>
              <p>{t.statusCopy}</p>
            </open-card>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>{t.artIndex}</span>
          <span slot='title'>{t.artTitle}</span>
          <span slot='copy'>
            {t.artCopy}
          </span>
          <div class='visual-grid'>
            <open-lab-stage class='stage-demo' emphasis='normal' motion='auto'></open-lab-stage>
            <open-lab-panel label={t.artPanelLabel} meta='Open Props'>
              <open-standards-visual variant='tokens' emphasis='high' motion='auto'>
              </open-standards-visual>
            </open-lab-panel>
          </div>
        </open-section-frame>

        <open-section-frame>
          <span slot='index'>{t.compositionIndex}</span>
          <span slot='title'>{t.compositionTitle}</span>
          <span slot='copy'>
            {t.compositionCopy}
          </span>
          <div class='principles'>
            {principleCards.map(([title, copy], index) => (
              <open-card class='principle'>
                <span class='token-name'>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </open-card>
            ))}
          </div>
        </open-section-frame>

        <nav class='nav-row'>
          <open-button href='/docs'>{t.navDocs}</open-button>
          <open-button href='/architecture/architecture'>{t.navArchitecture}</open-button>
          <open-button href='/roadmap'>{t.navRoadmap}</open-button>
        </nav>
      </main>
    );
  }
}

defineCustomElement(tagName, DesignSystemPage);

export default DesignSystemPage;
