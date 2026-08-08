export const meta = { section: 'Reference', label: 'Package Compatibility', order: 90 };

import { defineCustomElement, OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import { contentLocale } from '@openelement/site-ui/locale.ts';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-card';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    h1 .title-accent { display: block; font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: calc(1em * 1.12); line-height: .95; letter-spacing: -.02em; color: var(--violet-8); }

    .compat-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .compat-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
);

const railItems = {
  en:
    '[{"id":"current-contract","label":"Current contract","level":3},{"id":"explicit-admission","label":"Explicit admission","level":3},{"id":"roadmap-diagnostics","label":"Roadmap diagnostics","level":3}]',
  zh:
    '[{"id":"current-contract","label":"当前契约","level":3},{"id":"explicit-admission","label":"显式准入","level":3},{"id":"roadmap-diagnostics","label":"路线图诊断","level":3}]',
} as const;

const content = {
  en: {
    titleBase: 'Package',
    titleAccent: 'Compatibility',
    subtitle:
      'OpenElement treats third-party Custom Elements as standards-based dependencies. Current builds use explicit package-island configuration and available Custom Elements Manifest metadata for SSR admission.',
    panelLabel: 'capability matrix',
    panelMeta: 'current / admitted / planned',
    currentContractTitle: 'Current contract',
    currentContractBody:
      '@openelement/element owns authoring; app and adapter-vite keep application and build behavior separate.',
    explicitAdmissionTitle: 'Explicit admission',
    explicitAdmissionBody:
      'Known packages can be configured as package islands and use available CEM metadata without importing retired package surfaces.',
    roadmapDiagnosticsTitle: 'Roadmap diagnostics',
    roadmapDiagnosticsBody:
      'Universal DSD/light/client-only classification and hydration-mismatch diagnostics are `0.43` roadmap work, not a current market claim.',
  },
  zh: {
    titleBase: 'Package',
    titleAccent: '兼容性',
    subtitle:
      'openElement 把第三方 Custom Elements 视为基于标准的依赖。当前构建通过显式的 package island 配置与可用的 Custom Elements Manifest metadata 完成 SSR 准入。',
    panelLabel: '能力矩阵',
    panelMeta: '当前 / 已准入 / 规划中',
    currentContractTitle: '当前契约',
    currentContractBody:
      '@openelement/element 负责编写体验；app 与 adapter-vite 让应用行为与构建行为保持分离。',
    explicitAdmissionTitle: '显式准入',
    explicitAdmissionBody:
      '已知包可配置为 package island，并利用可用的 CEM metadata，无需引入已退役的包接口。',
    roadmapDiagnosticsTitle: '路线图诊断',
    roadmapDiagnosticsBody:
      '通用的 DSD/light/client-only 分类与 hydration 不匹配诊断属于 `0.43` 路线图工作，并非当前已上市的能力宣称。',
  },
} as const;

export class PackageCompatibilityPage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    const locale = contentLocale(this._getLocale('en'));
    const t = content[locale];
    return (
      <open-reading-shell rail>
        <open-page-rail
          slot='rail'
          items={railItems[locale]}
        >
        </open-page-rail>
        <div class='container'>
          <h1 id='start'>
            {t.titleBase}
            <span class='title-accent'>{t.titleAccent}</span>
          </h1>
          <p class='subtitle'>
            {t.subtitle}
          </p>

          <open-artifact-panel>
            <span slot='label'>{t.panelLabel}</span>
            <span slot='meta'>{t.panelMeta}</span>
            <div class='compat-grid'>
              <open-card variant='artifact'>
                <h3 id='current-contract'>{t.currentContractTitle}</h3>
                <p>
                  {t.currentContractBody}
                </p>
              </open-card>
              <open-card>
                <h3 id='explicit-admission'>{t.explicitAdmissionTitle}</h3>
                <p>
                  {t.explicitAdmissionBody}
                </p>
              </open-card>
              <open-card>
                <h3 id='roadmap-diagnostics'>{t.roadmapDiagnosticsTitle}</h3>
                <p>
                  {t.roadmapDiagnosticsBody}
                </p>
              </open-card>
            </div>
          </open-artifact-panel>
        </div>
      </open-reading-shell>
    );
  }
}

export const tagName = 'package-compatibility-page';
defineCustomElement(tagName, PackageCompatibilityPage);
export default PackageCompatibilityPage;
