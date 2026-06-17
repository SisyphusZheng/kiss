/**
 * @openelement/ui - Design System
 * Linear.app-style design system page with tokens, components, and conventions.
 */
export const meta = { section: 'Reference', label: 'Design System', order: 10 };
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-button-linear';
import '@openelement/ui/open-card-linear';
import '@openelement/ui/open-input-linear';
import '@openelement/ui/open-badge-linear';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

      :host {
        display: block;
      }
      .ds-container {
        max-width: 1100px;
        margin: 0 auto;
        padding: 44px 32px 72px;
      }
      .ds-title {
        font-size: 56px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -0.04em;
        color: var(--color-text-primary);
        margin: 0 0 8px;
      }
      .ds-subtitle {
        font-size: 18px;
        color: var(--color-text-secondary);
        margin: 0 0 72px;
      }
      .ds-section {
        margin-bottom: 64px;
      }
      .ds-section-label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-text-muted);
        margin-bottom: 8px;
      }
      .ds-section-heading {
        font-size: 24px;
        font-weight: 600;
        color: var(--color-text-primary);
        margin: 0 0 20px;
      }
      .swatch-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .swatch-card {
        background: var(--surface-2);
        border: 1px solid var(--color-border);
        border-radius: 12px;
        padding: 16px;
        position: relative;
      }
      .swatch-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 12px;
        right: 12px;
        height: 1px;
        background: var(--color-edge-highlight);
        border-radius: 12px 12px 0 0;
        pointer-events: none;
      }
      .swatch {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        border: 1px solid var(--color-border);
        margin-bottom: 8px;
      }
      .swatch-label {
        font-size: 12px;
        color: var(--color-text-muted);
      }
      .type-scale {
        display: flex;
        flex-direction: column;
      }
      .type-row {
        display: flex;
        align-items: baseline;
        gap: 24px;
        padding: 12px 0;
        border-bottom: 1px solid var(--color-border);
      }
      .type-row:last-child {
        border-bottom: none;
      }
      .type-label {
        min-width: 100px;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-text-muted);
        flex-shrink: 0;
      }
      .type-detail {
        font-size: 11px;
        color: var(--color-text-muted);
        min-width: 120px;
        flex-shrink: 0;
      }
      .type-sample {
        color: var(--color-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .component-section {
        margin-bottom: 32px;
      }
      .component-heading {
        font-size: 16px;
        font-weight: 500;
        color: var(--color-text-primary);
        margin: 0 0 16px;
      }
      .component-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }
      .component-row-col {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .light-palette-wrap {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 24px;
      }
      .light-palette-wrap .ds-section-heading {
        color: #12131a;
      }
      .light-palette-wrap .swatch-label {
        color: #626676;
      }
      @media (max-width: 900px) {
        .ds-container {
          padding: 36px 24px 56px;
        }
        .ds-title {
          font-size: 40px;
        }
        .ds-subtitle {
          font-size: 16px;
          margin-bottom: 48px;
        }
        .swatch-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .swatch {
          width: 64px;
          height: 64px;
        }
      }
      @media (max-width: 768px) {
        .ds-container {
          padding: 28px 16px 48px;
        }
        .ds-title {
          font-size: 32px;
        }
        .swatch-grid {
          gap: 8px;
        }
        .swatch {
          width: 56px;
          height: 56px;
        }
        .type-row {
          flex-wrap: wrap;
          gap: 8px;
        }
        .type-label {
          min-width: 80px;
        }
      }
    `,
);

export class UIShowcase extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  /* ─── Dark palette swatches ─── */
  private _darkSwatches = [
    { name: 'Canvas',   color: '#08080a' },
    { name: 'Surface 1', color: '#0d0f12' },
    { name: 'Surface 2', color: '#16191d' },
    { name: 'Surface 3', color: '#212529' },
    { name: 'Brand',    color: '#4263eb' },
    { name: 'Brand light', color: '#5c7cfa' },
  ];

  /* ─── Light palette swatches ─── */
  private _lightSwatches = [
    { name: 'Canvas',   color: '#f8f9fa' },
    { name: 'Surface 1', color: '#ffffff' },
    { name: 'Surface 2', color: '#f1f3f5' },
    { name: 'Surface 3', color: '#e9ecef' },
    { name: 'Brand',    color: '#4263eb' },
    { name: 'Brand light', color: '#5c7cfa' },
  ];

  /* ─── Type scale ─── */
  private _typeScale = [
    { label: 'Display XL',  size: '80px', weight: 600, tracking: '-0.04em', css: { fontSize: '80px', fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 0.95 } },
    { label: 'Display LG',  size: '56px', weight: 600, tracking: '-0.03em', css: { fontSize: '56px', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 } },
    { label: 'Display MD',  size: '40px', weight: 600, tracking: '-0.02em', css: { fontSize: '40px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 } },
    { label: 'Subhead',     size: '20px', weight: 400, tracking: '-0.01em', css: { fontSize: '20px', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.2 } },
    { label: 'Body LG',     size: '18px', weight: 400, tracking: '0',       css: { fontSize: '18px', fontWeight: 400, letterSpacing: '0', lineHeight: 1.5 } },
    { label: 'Body',        size: '16px', weight: 400, tracking: '0',       css: { fontSize: '16px', fontWeight: 400, letterSpacing: '0', lineHeight: 1.5 } },
    { label: 'Body SM',     size: '14px', weight: 400, tracking: '0',       css: { fontSize: '14px', fontWeight: 400, letterSpacing: '0', lineHeight: 1.5 } },
    { label: 'Caption',     size: '12px', weight: 400, tracking: '0',       css: { fontSize: '12px', fontWeight: 400, letterSpacing: '0', lineHeight: 1.5 } },
  ];

  private _renderPaletteSwatches(swatches: Array<{ name: string; color: string }>) {
    return (
      <div class='swatch-grid'>
        {swatches.map(s => (
          <div class='swatch-card'>
            <div class='swatch' style={{ background: s.color }}></div>
            <div class='swatch-label'>{s.name}</div>
          </div>
        ))}
      </div>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');

    return (
      <div class='ds-container'>
        <h1 class='ds-title'>Design System</h1>
        <p class='ds-subtitle'>Tokens, components, and conventions that power openElement.</p>

        {/* ─── Dark Palette ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>Colors</div>
          <h2 class='ds-section-heading'>Dark palette</h2>
          {this._renderPaletteSwatches(this._darkSwatches)}
        </div>

        {/* ─── Light Palette ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>Colors</div>
          <h2 class='ds-section-heading'>Light palette</h2>
          <div class='light-palette-wrap' data-theme='light'>
            <div class='swatch-grid'>
              {this._lightSwatches.map(s => (
                <div class='swatch-card'>
                  <div class='swatch' style={{ background: s.color, borderColor: 'rgba(18,19,26,0.08)' }}></div>
                  <div class='swatch-label'>{s.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Typography ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>Typography</div>
          <h2 class='ds-section-heading'>Type scale</h2>
          <div class='type-scale'>
            {this._typeScale.map(t => (
              <div class='type-row'>
                <span class='type-label'>{t.label}</span>
                <span class='type-detail'>{t.size} / {t.weight} / {t.tracking}</span>
                <span class='type-sample' style={t.css as unknown as Record<string, string>}>
                  The quick brown fox jumps over the lazy dog.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Components ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>Components</div>

          {/* Button */}
          <div class='component-section'>
            <h2 class='ds-section-heading'>Button</h2>
            <div class='component-row'>
              <open-button-linear variant='primary'>Primary</open-button-linear>
              <open-button-linear variant='secondary'>Secondary</open-button-linear>
              <open-button-linear variant='tertiary'>Tertiary</open-button-linear>
              <open-button-linear variant='inverse'>Inverse</open-button-linear>
            </div>
          </div>

          {/* Card */}
          <div class='component-section'>
            <h2 class='ds-section-heading'>Card</h2>
            <open-card-linear variant='standard'>
              <h3 slot='header' style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Card Title</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                This is a standard Linear-style card with edge highlight.
              </p>
            </open-card-linear>
          </div>

          {/* Input */}
          <div class='component-section'>
            <h2 class='ds-section-heading'>Input</h2>
            <div class='component-row component-row-col'>
              <open-input-linear placeholder='Standard input'></open-input-linear>
              <open-input-linear placeholder='Focused input' autofocus></open-input-linear>
            </div>
          </div>

          {/* Badge */}
          <div class='component-section'>
            <h2 class='ds-section-heading'>Badge</h2>
            <div class='component-row'>
              <open-badge-linear>Default</open-badge-linear>
              <open-badge-linear variant='success'>Success</open-badge-linear>
              <open-badge-linear variant='error'>Error</open-badge-linear>
              <open-badge-linear variant='warning'>Warning</open-badge-linear>
              <open-badge-linear variant='info'>Info</open-badge-linear>
              <open-badge-linear variant='new'>New</open-badge-linear>
            </div>
          </div>
        </div>

        {/* ─── Installation ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>Installation</div>
          <h2 class='ds-section-heading'>Installation</h2>
          <open-input-linear
            variant='cli'
            copy
            value='deno add jsr:@openelement/ui'
            style={{ width: '100%', maxWidth: '480px' }}
          ></open-input-linear>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Deno, Node, Bun. Zero config.
          </p>
        </div>

        <div class='nav-row'>
          <a href={`/${loc}/architecture/architecture`} class='btn btn-ghost'>← Architecture</a>
          <a href={`/${loc}/architecture/reference/core`} class='btn btn-ghost'>API Reference →</a>
        </div>
      </div>
    );
  }

  private _renderZh() {
    const loc = this._getLocale('zh');

    return (
      <div class='ds-container'>
        <h1 class='ds-title'>设计系统</h1>
        <p class='ds-subtitle'>Tokens、组件及约定：驱动 openElement 的设计体系。</p>

        {/* ─── 深色板 ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>色彩</div>
          <h2 class='ds-section-heading'>深色板</h2>
          {this._renderPaletteSwatches(this._darkSwatches)}
        </div>

        {/* ─── 浅色板 ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>色彩</div>
          <h2 class='ds-section-heading'>浅色板</h2>
          <div class='light-palette-wrap' data-theme='light'>
            <div class='swatch-grid'>
              {this._lightSwatches.map(s => (
                <div class='swatch-card'>
                  <div class='swatch' style={{ background: s.color, borderColor: 'rgba(18,19,26,0.08)' }}></div>
                  <div class='swatch-label'>{s.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 排印 ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>排印</div>
          <h2 class='ds-section-heading'>字号层级</h2>
          <div class='type-scale'>
            {this._typeScale.map(t => (
              <div class='type-row'>
                <span class='type-label'>{t.label}</span>
                <span class='type-detail'>{t.size} / {t.weight} / {t.tracking}</span>
                <span class='type-sample' style={t.css as unknown as Record<string, string>}>
                  The quick brown fox jumps over the lazy dog.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 组件 ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>组件</div>

          <div class='component-section'>
            <h2 class='ds-section-heading'>按钮</h2>
            <div class='component-row'>
              <open-button-linear variant='primary'>主要</open-button-linear>
              <open-button-linear variant='secondary'>次要</open-button-linear>
              <open-button-linear variant='tertiary'>三级</open-button-linear>
              <open-button-linear variant='inverse'>反色</open-button-linear>
            </div>
          </div>

          <div class='component-section'>
            <h2 class='ds-section-heading'>卡片</h2>
            <open-card-linear variant='standard'>
              <h3 slot='header' style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>卡片标题</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                这是一张标准的 Linear 风格卡片，带有边缘高亮。
              </p>
            </open-card-linear>
          </div>

          <div class='component-section'>
            <h2 class='ds-section-heading'>输入框</h2>
            <div class='component-row component-row-col'>
              <open-input-linear placeholder='标准输入框'></open-input-linear>
              <open-input-linear placeholder='聚焦状态' autofocus></open-input-linear>
            </div>
          </div>

          <div class='component-section'>
            <h2 class='ds-section-heading'>徽标</h2>
            <div class='component-row'>
              <open-badge-linear>默认</open-badge-linear>
              <open-badge-linear variant='success'>成功</open-badge-linear>
              <open-badge-linear variant='error'>错误</open-badge-linear>
              <open-badge-linear variant='warning'>警告</open-badge-linear>
              <open-badge-linear variant='info'>信息</open-badge-linear>
              <open-badge-linear variant='new'>新</open-badge-linear>
            </div>
          </div>
        </div>

        {/* ─── 安装 ─── */}
        <div class='ds-section'>
          <div class='ds-section-label'>安装</div>
          <h2 class='ds-section-heading'>安装</h2>
          <open-input-linear
            variant='cli'
            copy
            value='deno add jsr:@openelement/ui'
            style={{ width: '100%', maxWidth: '480px' }}
          ></open-input-linear>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Deno、Node、Bun。零配置。
          </p>
        </div>

        <div class='nav-row'>
          <a href={`/${loc}/architecture/architecture`} class='btn btn-ghost'>← 架构</a>
          <a href={`/${loc}/architecture/reference/core`} class='btn btn-ghost'>API 参考 →</a>
        </div>
      </div>
    );
  }
}

customElements.define('ui-showcase', UIShowcase);
export default UIShowcase;
export const tagName = 'ui-showcase';
