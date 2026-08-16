/**
 * Changelog Page - openElement Framework Version History.
 */
export const meta = { section: '', label: 'Changelog', order: 20 };
import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-button';
import { PUBLISHED_PACKAGE_VERSION } from '../data/version.ts';
import { pageStyles } from '../components/page-styles.js';
import { marked } from 'marked';
// @deno-types="npm:@types/sanitize-html@^2"
import sanitizeHtml from 'sanitize-html';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-reading-shell.tsx';
import '@openelement/site-ui/open-page-rail.tsx';
import { contentLocale } from '@openelement/site-ui/locale.ts';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
  :host { display: block; }
  .title-serif { display: block; color: var(--violet-8); font-family: var(--font-serif); font-size: calc(1em * 1.12); font-style: italic; font-weight: 400; letter-spacing: -.02em; }
  .title-mono { display: block; }

  /* release register: current line highlighted, history on hairlines */
  .register { margin: var(--size-8) 0 var(--size-10); border-block-start: var(--border-size-1) solid var(--border); }
  .reg-row { padding: var(--size-5); border-block-end: var(--border-size-1) solid var(--border); }
  .reg-current { background: var(--brand-subtle); box-shadow: inset var(--size-1) 0 0 var(--brand); }
  .reg-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--size-3); }
  .reg-version { color: var(--text-secondary); font-size: clamp(1.4rem, 2.4vw, 2rem); font-weight: 800; line-height: 1; letter-spacing: -.02em; }
  .reg-current .reg-version { color: var(--text-primary); font-size: clamp(1.9rem, 3.4vw, 2.8rem); }
  .reg-ghost .reg-version { color: transparent; -webkit-text-stroke: 1.5px color-mix(in srgb, var(--violet-5) 55%, transparent); }
  .reg-stamp { padding: var(--size-1) var(--size-3); border-radius: var(--radius-1); background: var(--brand); color: var(--on-brand); font-size: var(--font-size-00); font-weight: var(--font-weight-7); letter-spacing: .08em; text-transform: uppercase; }
  .reg-note { color: var(--text-muted); font-size: var(--font-size-00); }
  .reg-summary { margin: var(--size-2) 0 0; max-width: 640px; overflow: hidden; color: var(--text-secondary); font-size: var(--font-size-00); line-height: var(--font-lineheight-3); text-overflow: ellipsis; white-space: nowrap; }
  .reg-ghost .reg-summary { color: var(--text-muted); }

  .changelog-content { font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--text-primary); }
  .changelog-content h2 { position:relative; font-size: var(--font-size-5); margin: var(--size-10) 0 var(--size-4); border-bottom: 0.5px solid var(--border); padding:0 0 var(--size-4) var(--size-6); }
  .changelog-content h2::before { content:""; position:absolute; inset:0 auto 0 0; width:2px; background:var(--brand); }
  .changelog-content h2:first-child::after { content:"published history"; display:block; margin-top:var(--size-2); color:var(--brand); font-family:var(--font-mono); font-size:var(--font-size-00); text-transform:uppercase; letter-spacing:.08em; }
  .changelog-content h3 { font-size: var(--font-size-3); margin: var(--size-6) 0 var(--size-2); }
  .changelog-content code { font-family: var(--font-mono); background: var(--bg-surface); padding: var(--size-1) var(--size-2); border-radius: var(--radius-1); font-size: var(--font-size-00); }
  .changelog-content pre { background: var(--bg-surface); padding: var(--size-5) var(--size-6); border-radius: var(--radius-2); overflow-x: auto; }
`,
);

const content = {
  en: {
    eyebrow: 'Changelog — release registry',
    titleSerif: 'Every line,',
    titleMono: 'EVIDENCED.',
    lede: 'Published, candidate, withdrawn and historical release evidence for OpenElement.',
    readRoadmap: 'Read roadmap',
    metaLabel: 'Current truth',
    metaPrefix: 'The currently published package line is',
    metaSuffix: '.',
    railItems:
      '[{"id":"published","label":"Published"},{"id":"candidate","label":"Stable line"},{"id":"withdrawn","label":"Withdrawn"},{"id":"historical","label":"Historical archive"}]',
    publishedIntro:
      'The project follows Keep a Changelog and SemVer. Historical entries preserve older names where they describe older releases; current docs use the openElement contract.',
    stampCurrent: 'Current',
    regCurrentSummary:
      'The published five-package line — unified product and website surface, sealed export seams.',
    regArchiveNote: 'archive →',
    regGhostSummary: 'The eleven-package era — JSR-only, before the collapse. Historical record.',
    stableHeading: 'Stable line',
    stableBody:
      'is the published stable line on the 0.42 track — the request-time surfaces froze at 0.42.0 under ADR-0122, on top of the untouched ADR-0119 static freeze. Patches on 0.42.x carry tooling and hygiene fixes only, and the frozen surface changes only with an amendment ADR.',
    withdrawnHeading: 'Withdrawn partial artifacts',
    withdrawnBody:
      'The npm beta.1–beta.3 artifacts are withdrawn partial releases, not supported product lines or upgrade targets.',
    footnote:
      '※ Withdrawn partial artifacts (beta.1–beta.3) stay withdrawn from the active release story. History is kept, not rewritten.',
    loadError:
      '<p>Unable to load the changelog. Read it on <a href="https://github.com/open-element/openelement/blob/main/CHANGELOG.md">GitHub</a>.</p>',
    navRoadmap: 'Roadmap',
    navGettingStarted: 'Getting Started',
  },
  zh: {
    eyebrow: 'Changelog — 发布登记册',
    titleSerif: '每一行，',
    titleMono: '皆有证据。',
    lede: 'openElement 已发布、候选、已撤回与历史版本的发布证据。',
    readRoadmap: '阅读 Roadmap',
    metaLabel: '当前真相',
    metaPrefix: '当前发布的包线版本为',
    metaSuffix: '。',
    railItems:
      '[{"id":"published","label":"已发布"},{"id":"candidate","label":"稳定线"},{"id":"withdrawn","label":"已撤回"},{"id":"historical","label":"历史归档"}]',
    publishedIntro:
      '本项目遵循 Keep a Changelog 与 SemVer。历史条目在描述旧版本时保留旧名称；当前文档使用 openElement 契约。',
    stampCurrent: '当前',
    regCurrentSummary: '已发布的五包线——统一的产品与网站接口面，封口的导出边界。',
    regArchiveNote: '归档 →',
    regGhostSummary: '十一包时代——仅限 JSR，在收拢之前。历史记录。',
    stableHeading: '稳定线',
    stableBody:
      '是 0.42 轨道上已发布的稳定线——请求时接口已在 0.42.0 按 ADR-0122 冻结，叠加在未被触动的 ADR-0119 静态冻结之上。0.42.x 的补丁只带工具与卫生性修复，冻结接口只有修正 ADR 才能变更。',
    withdrawnHeading: '已撤回的残缺产物',
    withdrawnBody:
      'npm 上的 beta.1–beta.3 产物是已撤回的残缺发布，不是受支持的产品线，也不是升级目标。',
    footnote:
      '※ 已撤回的残缺产物（beta.1–beta.3）在活跃发布叙事中保持撤回状态。历史被保留，不被改写。',
    loadError:
      '<p>无法加载 changelog。请到 <a href="https://github.com/open-element/openelement/blob/main/CHANGELOG.md">GitHub</a> 阅读。</p>',
    navRoadmap: 'Roadmap',
    navGettingStarted: '快速开始',
  },
} as const;

export class ChangelogPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const t = content[contentLocale(this._getLocale('en'))];
    // The module runs from www/app/routes in dev but from www/dist/server in
    // the SSG bundle, so locate CHANGELOG.md by walking up from import.meta.url.
    let changelogPath: URL | undefined;
    let cursor = new URL('.', import.meta.url);
    for (let depth = 0; depth < 8 && !changelogPath; depth++) {
      const candidate = new URL('CHANGELOG.md', cursor);
      try {
        Deno.statSync(candidate);
        changelogPath = candidate;
      } catch {
        cursor = new URL('../', cursor);
      }
    }
    let html: string;
    try {
      if (!changelogPath) throw new Error('CHANGELOG.md not found');
      const md = Deno.readTextFileSync(changelogPath);
      const raw = marked.parse(md, { async: false }) as string;
      html = sanitizeHtml(raw, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          'h2',
          'h3',
          'h4',
          'img',
        ]),
        allowedAttributes: { a: ['href', 'target', 'rel'] },
      });
    } catch {
      html = t.loadError;
    }

    return (
      <main>
        <open-page-hero variant='timeline'>
          <span slot='eyebrow'>{t.eyebrow}</span>
          <span slot='title'>
            <span class='title-serif'>{t.titleSerif}</span>
            <span class='title-mono'>{t.titleMono}</span>
          </span>
          <span slot='lede'>
            {t.lede}
          </span>
          <div slot='artifact'>
            <open-button href='/roadmap'>{t.readRoadmap}</open-button>
          </div>
        </open-page-hero>
        <open-reading-shell meta rail footer>
          <div slot='meta'>
            <p class='section-label'>{t.metaLabel}</p>
            <p class='subtitle'>
              {t.metaPrefix} <code>{PUBLISHED_PACKAGE_VERSION}</code>
              {t.metaSuffix}
            </p>
          </div>
          <open-page-rail
            slot='rail'
            items={t.railItems}
          >
          </open-page-rail>
          <p id='published'>
            {t.publishedIntro}
          </p>
          <div class='register' aria-label='Release register'>
            <div class='reg-row reg-current'>
              <div class='reg-head'>
                <span class='reg-version'>{PUBLISHED_PACKAGE_VERSION}</span>
                <span class='reg-stamp'>{t.stampCurrent}</span>
              </div>
              <p class='reg-summary'>
                {t.regCurrentSummary}
              </p>
            </div>
            <div class='reg-row reg-ghost'>
              <div class='reg-head'>
                <span class='reg-version'>0.40.x</span>
                <span class='reg-note'>{t.regArchiveNote}</span>
              </div>
              <p class='reg-summary'>
                {t.regGhostSummary}
              </p>
            </div>
          </div>
          <section id='candidate'>
            <h2>{t.stableHeading}</h2>
            <p>
              <code>{PUBLISHED_PACKAGE_VERSION}</code> {t.stableBody}
            </p>
          </section>
          <section id='withdrawn'>
            <h2>{t.withdrawnHeading}</h2>
            <p>
              {t.withdrawnBody}
            </p>
          </section>
          <p class='reg-note'>
            {t.footnote}
          </p>
          <div id='historical' class='changelog-content' innerHTML={html} trustedHtml />
          <div slot='footer' class='nav-row'>
            <open-button variant='ghost' size='sm' href='/roadmap'>
              {t.navRoadmap}
            </open-button>
            <open-button
              variant='ghost'
              size='sm'
              href='/guide/getting-started'
            >
              {t.navGettingStarted}
            </open-button>
          </div>
        </open-reading-shell>
      </main>
    );
  }
}

export const tagName = 'page-changelog';
defineCustomElement(tagName, ChangelogPage);
export default ChangelogPage;
