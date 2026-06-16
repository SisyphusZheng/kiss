export const meta = { section: 'Production', label: 'Deployment', order: 5 };
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui\/open-code-block';
import '@openelement/ui\/open-button-linear';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `

      .platform-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
        gap: var(--size-3);
        margin: var(--size-4) 0 var(--size-6);
      }
      .platform-card {
        padding: var(--size-4);
        border: var(--border-hairline) solid var(--border);
        border-radius: var(--radius-1);
      }
      .platform-card h3 {
        margin: 0 0 0.4rem;
      }
      .platform-card p {
        margin: 0;
        font-size: var(--font-size-1);
      }
    `,
);

export class DeploymentPage extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    const loc = this._getLocale('zh');

    return (
      <div class='container'>
        <h1>部署</h1>
        <p class='subtitle'>
          openElement 优先部署静态文件。运行时 API 路由在应用需要动态行为时，通过 serverless 或 edge
          adapter 单独部署。
        </p>
        <h2>Build Once</h2>
        <open-code-block>
          <pre><code>deno task build</code></pre>
        </open-code-block>
        <p>
          构建输出{' '}
          <span class='inline-code'>dist/</span>：带 Declarative Shadow DOM 的静态 HTML、client
          island chunks 和复制的公开资源。
        </p>
        <h2>Static Hosting</h2>
        <div class='platform-grid'>
          <div class='platform-card'>
            <h3>GitHub Pages</h3>
            <p>部署在仓库子路径下时，设置 Vite base。</p>
          </div>
          <div class='platform-card'>
            <h3>Cloudflare Pages</h3>
            <p>构建命令：deno task build；输出目录：dist。</p>
          </div>
          <div class='platform-card'>
            <h3>Netlify</h3>
            <p>发布目录：dist。</p>
          </div>
          <div class='platform-card'>
            <h3>Vercel</h3>
            <p>使用静态输出，Framework 预设选 "Other"。</p>
          </div>
          <div class='platform-card'>
            <h3>S3 / CloudFront</h3>
            <p>上传 dist 并配置合适的缓存头。</p>
          </div>
        </div>
        <h2>API Deployment</h2>
        <p>
          API 路由属于生成的 Hono app。静态托管不会自动执行它们。当应用需要运行时行为时，通过平台
          adapter 部署 API 路由。
        </p>
        <table>
          <thead>
            <tr>
              <th>Target</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Deno Deploy</td>
              <td>Natural fit</td>
              <td>Closest to the Deno-first development model.</td>
            </tr>
            <tr>
              <td>Cloudflare Workers</td>
              <td>Good fit</td>
              <td>Hono maps well to Workers.</td>
            </tr>
            <tr>
              <td>Vercel / Netlify Functions</td>
              <td>Needs adapter</td>
              <td>Requires documented build output and runtime entry contract.</td>
            </tr>
          </tbody>
        </table>
        <h2>No Production SSR Server by Default</h2>
        <p>
          openElement 主路径不需要长期运行的生产 SSR 服务器。静态页面应保持静态；动态行为应为显式
          API 或未来的 ISR。这使托管便宜、可缓存、运维轻量。
        </p>
        <h2>PWA 支持</h2>
        <p>
          openElement 支持 Progressive Web App。在 <code>public/</code>{' '}
          目录放置 manifest 和 service worker， 构建时会自动复制到输出目录。配置 CSP meta 和 view
          transition 元数据可通过 Vite 插件自动注入。
        </p>
        <open-code-block>
          <pre><code>{`// vite.config.ts
import { openElement } from '@openelement/app/vite';

export default defineConfig({
  plugins: [openElement({
    pwa: {
      injectManifest: true,
    },
  })],
});`}</code></pre>
        </open-code-block>

        <h2>Deployment Checklist</h2>
        <ul>
          <li>在本地或 CI 中运行 deno task build。</li>
          <li>发布前预览 dist/。</li>
          <li>确认部署在子目录下的 base path。</li>
          <li>确认所选托管路径下 CSP/安全头仍然有效。</li>
          <li>如果 island 调用运行时端点，单独部署 API 路由。</li>
        </ul>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/islands-and-ssr'>← Islands 与 SSR</open-button-linear>
          <open-button-linear variant='secondary' href='/roadmap'>开发计划 →</open-button-linear>
        </div>
      </div>
    );
  }

  private _renderEn() {
    const loc = this._getLocale('en');

    return (
      <div class='container'>
        <h1>Deployment</h1>
        <p class='subtitle'>
          openElement prioritizes static file deployment. Runtime API routes are deployed separately
          via serverless or edge adapters when the app needs dynamic behavior.
        </p>
        <h2>Build Once</h2>
        <open-code-block>
          <pre><code>deno task build</code></pre>
        </open-code-block>
        <p>
          The build outputs{' '}
          <span class='inline-code'>dist/</span>: static HTML with Declarative Shadow DOM, client
          island chunks, and copied public assets.
        </p>
        <h2>Static Hosting</h2>
        <div class='platform-grid'>
          <div class='platform-card'>
            <h3>GitHub Pages</h3>
            <p>Set Vite base when deploying under a repo sub-path.</p>
          </div>
          <div class='platform-card'>
            <h3>Cloudflare Pages</h3>
            <p>Build command: deno task build; Output dir: dist.</p>
          </div>
          <div class='platform-card'>
            <h3>Netlify</h3>
            <p>Publish directory: dist.</p>
          </div>
          <div class='platform-card'>
            <h3>Vercel</h3>
            <p>Use static output, Framework preset: "Other".</p>
          </div>
          <div class='platform-card'>
            <h3>S3 / CloudFront</h3>
            <p>Upload dist/ with appropriate cache headers.</p>
          </div>
        </div>
        <h2>API Deployment</h2>
        <p>
          API routes belong to the generated Hono app. Static hosting doesn't execute them. Deploy
          API routes via platform adapters when runtime behavior is needed.
        </p>
        <h2>No Production SSR Server by Default</h2>
        <p>
          openElement's main path doesn't need a long-running production SSR server. Static pages
          stay static; dynamic behavior should be explicit API or future ISR. This keeps hosting
          cheap, cacheable, and operationally lightweight.
        </p>
        <h2>PWA Support</h2>
        <p>
          openElement supports Progressive Web Apps. Place your manifest and service worker in the
          <code>public/</code>{' '}
          directory — they're automatically copied to the output during build. CSP meta and view
          transition metadata can be auto-injected via the Vite plugin.
        </p>
        <open-code-block>
          <pre><code>{`// vite.config.ts
import { openElement } from '@openelement/app/vite';

export default defineConfig({
  plugins: [openElement({
    pwa: {
      injectManifest: true,
    },
  })],
});`}</code></pre>
        </open-code-block>

        <h2>Deployment Checklist</h2>
        <ul>
          <li>
            Run <span class='inline-code'>deno task build</span> locally or in CI.
          </li>
          <li>
            Preview <span class='inline-code'>dist/</span> before publishing.
          </li>
          <li>Confirm base path when deploying to a sub-directory.</li>
          <li>Verify CSP/security headers still apply at the chosen hosting path.</li>
          <li>If islands call runtime endpoints, deploy API routes separately.</li>
        </ul>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/islands-and-ssr'>← Islands &amp; SSR</open-button-linear>
          <open-button-linear variant='secondary' href='/roadmap'>Roadmap →</open-button-linear>
        </div>
      </div>
    );
  }
}

customElements.define('page-deployment', DeploymentPage);
export default DeploymentPage;
export const tagName = 'page-deployment';
