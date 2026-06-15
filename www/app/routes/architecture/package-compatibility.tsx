export const meta = { section: 'Compatibility', label: 'Package Compatibility', order: 10 };

import { pageStylesSheet } from '../../components/page-styles.js';
import { OpenElement } from '@openelement/element';
import { daisyClassSheet, openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui\/open-code-block';

const baseStyle = pageStylesSheet;

export class PackageCompatibilityGuidePage extends OpenElement {
  declare locale?: string;

  static override styles = [daisyClassSheet, openPropsTokenSheet, baseStyle];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');
    return (
      <div class='container'>
        <h1>第三方包兼容性</h1>
        <p class='subtitle'>
          v0.18.0 引入的 Universal WC Engine 让 openElement 能自动识别第三方 Web Component
          包的兼容性，安全决定谁可以 SSR、谁只能跑在浏览器。
        </p>

        <h2>核心思路</h2>
        <p>
          第三方 Web Component 包来自不同的生态：有些用 Lit、有些用 Vanilla、有些只能在浏览器运行。
          openElement 不做"一刀切"假设，而是通过读取标准的 <code>custom-elements.json</code>{' '}
          文件来了解每个包。
        </p>
        <h3>但前提是这个包有 CEM 文件</h3>
        <p>
          例如某个未发布 CEM 的第三方包（如{' '}
          <code>@example/third-party-wc</code>）<strong>不发布</strong>
          <code>custom-elements.json</code>。没有 CEM，检测结果为空，这些包会按照{' '}
          <code>packageIslands</code>
          里的显式声明来处理。
        </p>

        <h2>4 级兼容性分类</h2>
        <table class='version-table'>
          <thead>
            <tr>
              <th>等级</th>
              <th>含义</th>
              <th>构建行为</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>ssr-capable</code>
              </td>
              <td>有显式的 openElement SSR 声明或适配器支持</td>
              <td>导入 SSR bundle，参与 DSD 渲染</td>
            </tr>
            <tr>
              <td>
                <code>client-only</code>
              </td>
              <td>
                浏览器专用，或无 SSR 声明<ul>
                  <li>CEM 没有 openElement 扩展</li>
                  <li>
                    显式 <code>ssr: false</code>
                  </li>
                  <li>没有 CEM 时默认</li>
                </ul>
              </td>
              <td>排除出 SSR bundle，生成 client 注册/水合元数据</td>
            </tr>
            <tr>
              <td>
                <code>rejected</code>
              </td>
              <td>无效 manifest、重复 tag、不安全路径</td>
              <td>在代码生成前报错</td>
            </tr>
            <tr>
              <td>
                <code>experimental-dom</code>
              </td>
              <td>可选的 DOM 模拟候选（需要显式开启）</td>
              <td>仅当 flag 开启时渲染，记录所有结果</td>
            </tr>
          </tbody>
        </table>

        <h2>构建时自动检测</h2>
        <p>
          在 Vite 插件的 <code>buildStart()</code> 阶段，openElement 会自动扫描
          <code>node_modules</code> 下的所有包，寻找 <code>custom-elements.json</code>：
        </p>
        <open-code-block>
          <pre><code>{`// 伪代码 - 实际实现在 route-scanner.ts
for (const pkg of node_modules) {
  const cemPath = join(pkg, 'custom-elements.json');
  if (exists(cemPath)) {
    const parsed = parseCem(cemPath);         // CEM 解析器
    const classified = classify(parsed);      // 兼容性分类
    results.push(classified);
  }
}`}</code></pre>
        </open-code-block>

        <h3>特点</h3>
        <ul>
          <li>
            <strong>不执行包代码</strong> - 只读 JSON，安全可靠
          </li>
          <li>
            <strong>支持 scoped 包</strong> - 正确处理 <code>@org/pkg</code> 模式
          </li>
          <li>
            <strong>失败不阻塞</strong> - 某个包 CEM 损坏不会导致构建失败
          </li>
          <li>
            <strong>零配置</strong> - 自动运行，不需要手动声明
          </li>
        </ul>

        <h2>dsd-report 中的兼容性报告</h2>
        <p>
          构建完成后，<code>dsd-report.json</code> 中新增了 <code>cemCompatibility</code> 部分：
        </p>
        <open-code-block>
          <pre><code>{`{
  "reportVersion": "1.1.0",
  "cemCompatibility": {
    "packageCount": 2,
    "packages": [
      {
        "packageName": "@third-party/wc-button",
        "tier": "client-only",
        "reason": "No openElement SSR extension in CEM",
        "componentCount": 5
      }
    ]
  }
}`}</code></pre>
        </open-code-block>
        <p>
          每条记录包含包名、兼容等级、原因说明和组件数量，方便调试和审计。
        </p>

        <h2>当前站点的实际结果</h2>
        <p>
          当前 www 示例站点使用的 <code>@openelement/ui</code> 自带{' '}
          <code>custom-elements.json</code>，因此会被自动检测并分类为{' '}
          <code>ssr-capable</code>。如果引入没有 CEM 的第三方包，则需要通过{' '}
          <code>vite.config.ts</code> 中 <code>packageIslands</code> 显式声明。
        </p>

        <h2>对比：有 CEM vs 无 CEM</h2>
        <table class='version-table'>
          <thead>
            <tr>
              <th>场景</th>
              <th>CEM 检测结果</th>
              <th>默认行为</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>包有 CEM + openElement SSR 扩展</td>
              <td>
                <code>ssr-capable</code>
              </td>
              <td>自动加入 SSR bundle</td>
            </tr>
            <tr>
              <td>包有 CEM + 无 SSR 声明</td>
              <td>
                <code>client-only</code>
              </td>
              <td>安全 fallback，不在服务端渲染</td>
            </tr>
            <tr>
              <td>包无 CEM</td>
              <td>空（检测不到）</td>
              <td>
                通过 <code>packageIslands</code> 手动声明
              </td>
            </tr>
            <tr>
              <td>包无 CEM + 未在 packageIslands</td>
              <td>空</td>
              <td>不注册（需要用户显式引用）</td>
            </tr>
          </tbody>
        </table>

        <h2>路线图展望</h2>
        <ul class='compact-list'>
          <li>
            <strong>v0.18.1</strong>: <code>less validate-manifest</code> CLI - 安装前手动验证
          </li>
          <li>
            <strong>v0.18.2</strong>: <code>open add</code> - 一键安装 + 配置第三方包
          </li>
          <li>
            <strong>v0.18.3</strong>: DOM 模拟 - 实验性尝试渲染 client-only 组件
          </li>
        </ul>

        <nav class='nav-row'>
          <a class='btn btn-ghost' href={`/{loc}/architecture/architecture`}>← Architecture</a>
          <a class='btn btn-ghost' href={`/{loc}/architecture/standards-registry`}>
            Standards & Registry {'->'}
          </a>
        </nav>
      </div>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');
    return (
      <div class='container'>
        <h1>Package Compatibility</h1>
        <p class='subtitle'>
          Introduced in v0.18.0, the Universal WC Engine enables openElement to automatically detect
          and classify third-party Web Component packages - deciding safely which ones can SSR and
          which must stay client-only.
        </p>

        <h2>The Problem</h2>
        <p>
          Third-party Web Components come from different ecosystems. Some use Lit, some use vanilla
          classes, some are browser-only with real-DOM dependencies. openElement no longer assumes
          every package is SSR-safe - it reads their <code>custom-elements.json</code>
          manifest and makes informed decisions.
        </p>
        <h3>Reality check: CEM adoption is still low</h3>
        <p>
          Some third-party Web Component libraries (e.g. <code>@example/third-party-wc</code>)
          <strong>do not ship</strong> a <code>custom-elements.json</code>{' '}
          file. Without CEM, auto-detection returns no results for these packages, and they rely on
          explicit
          <code>packageIslands</code> declarations in <code>vite.config.ts</code>.
        </p>

        <h2>4-Tier Compatibility</h2>
        <table class='version-table'>
          <thead>
            <tr>
              <th>Tier</th>
              <th>Meaning</th>
              <th>Build Behavior</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>ssr-capable</code>
              </td>
              <td>Explicit openElement SSR declaration or adapter support</td>
              <td>Import in SSR bundle, participate in DSD rendering</td>
            </tr>
            <tr>
              <td>
                <code>client-only</code>
              </td>
              <td>
                Browser-only, or no SSR declaration<ul>
                  <li>CEM without Less extension</li>
                  <li>
                    Explicit <code>ssr: false</code>
                  </li>
                  <li>Default when no CEM</li>
                </ul>
              </td>
              <td>Exclude from SSR bundle, emit client registration/hydration metadata</td>
            </tr>
            <tr>
              <td>
                <code>rejected</code>
              </td>
              <td>Invalid manifest, duplicate tags, unsafe paths</td>
              <td>Fail before code generation</td>
            </tr>
            <tr>
              <td>
                <code>experimental-dom</code>
              </td>
              <td>Opt-in DOM simulation candidate</td>
              <td>Render only when flag is enabled, report all results</td>
            </tr>
          </tbody>
        </table>

        <h2>Build-Time Auto-Detection</h2>
        <p>
          During the Vite plugin's <code>buildStart()</code> phase, openElement automatically scans
          <code>node_modules</code> for <code>custom-elements.json</code> files:
        </p>
        <open-code-block>
          <pre><code>{`// Pseudocode - actual implementation in route-scanner.ts
for (const pkg of node_modules) {
  const cemPath = join(pkg, 'custom-elements.json');
  if (exists(cemPath)) {
    const parsed = parseCem(cemPath);         // CEM parser
    const classified = classify(parsed);      // compatibility classifier
    results.push(classified);
  }
}`}</code></pre>
        </open-code-block>

        <h3>Key properties</h3>
        <ul>
          <li>
            <strong>No code execution</strong> - reads JSON only, safe
          </li>
          <li>
            <strong>Scoped package support</strong> - handles <code>@org/pkg</code> patterns
          </li>
          <li>
            <strong>Non-fatal</strong> - a corrupted CEM won't break the build
          </li>
          <li>
            <strong>Zero-config</strong> - automatic, no manual declarations needed
          </li>
        </ul>

        <h2>Compatibility Report in dsd-report.json</h2>
        <p>
          The build report now includes a <code>cemCompatibility</code> section:
        </p>
        <open-code-block>
          <pre><code>{`{
  "reportVersion": "1.1.0",
  "cemCompatibility": {
    "packageCount": 2,
    "packages": [
      {
        "packageName": "@third-party/wc-button",
        "tier": "client-only",
        "reason": "No openElement SSR extension in CEM",
        "componentCount": 5
      }
    ]
  }
}`}</code></pre>
        </open-code-block>
        <p>
          Each entry includes the package name, compatibility tier, reason, and component count for
          debugging and audit purposes.
        </p>

        <h2>Current Site Results</h2>
        <p>
          The www example site now uses <code>@openelement/ui</code>, which ships a{' '}
          <code>custom-elements.json</code> manifest and is auto-detected as{' '}
          <code>ssr-capable</code>. Third-party packages without a CEM still require explicit
          <code>packageIslands</code> declarations in <code>vite.config.ts</code>.
        </p>

        <h2>CEM vs No-CEM Comparison</h2>
        <table class='version-table'>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>CEM Detection</th>
              <th>Behavior</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Has CEM + openElement SSR extension</td>
              <td>
                <code>ssr-capable</code>
              </td>
              <td>Auto-added to SSR bundle</td>
            </tr>
            <tr>
              <td>Has CEM + no SSR declaration</td>
              <td>
                <code>client-only</code>
              </td>
              <td>Safe fallback, no server rendering</td>
            </tr>
            <tr>
              <td>No CEM</td>
              <td>Empty (not detected)</td>
              <td>
                Manual via <code>packageIslands</code>
              </td>
            </tr>
            <tr>
              <td>No CEM + not in packageIslands</td>
              <td>Empty</td>
              <td>Not registered (requires explicit import)</td>
            </tr>
          </tbody>
        </table>

        <h2>Roadmap</h2>
        <ul class='compact-list'>
          <li>
            <strong>v0.18.1</strong>: <code>less validate-manifest</code>{' '}
            CLI - pre-install validation
          </li>
          <li>
            <strong>v0.18.2</strong>: <code>open add</code> - one-click install and configure
          </li>
          <li>
            <strong>v0.18.3</strong>: DOM simulation - experimental client-only component rendering
          </li>
        </ul>

        <nav class='nav-row'>
          <a class='btn btn-ghost' href={`/{loc}/architecture/architecture`}>← Architecture</a>
          <a class='btn btn-ghost' href={`/{loc}/architecture/standards-registry`}>
            Standards & Registry {'->'}
          </a>
        </nav>
      </div>
    );
  }
}

customElements.define('page-guide-pkgcompat', PackageCompatibilityGuidePage);
export default PackageCompatibilityGuidePage;
export const tagName = 'page-guide-pkgcompat';
