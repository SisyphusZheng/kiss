export const meta = { section: 'Core', label: 'API Routes', order: 60 };

import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { linearTokenSheet } from '@openelement/ui';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';
import '@openelement/ui/open-button-linear';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(
  pageStyles + `
    .principle {
      padding: var(--size-4) var(--size-5);
      background: var(--bg-surface);
      border-left: 2px solid var(--border);
      border-radius: 0 var(--radius-1) var(--radius-1) 0;
      margin: var(--size-4) 0;
    }
  `,
);

export class ApiPage extends OpenElement {
  static override styles = [linearTokenSheet, routeSheet];

  override render() {
    return this._getLocale('zh') === 'en' ? this._renderEn() : this._renderZh();
  }

  private _renderZh() {
    return (
      <div class='container'>
        <h1>API Routes</h1>
        <p class='subtitle'>
          openElement 的服务端层基于 Hono。API routes 使用标准 Request/Response 语义，适合部署到
          serverless 或 edge runtime。
        </p>
        <h2>Design Principles</h2>
        <div class='principle'>
          <p>
            <strong>使用平台原语。</strong> 优先使用 Fetch、Request、Response，而不是框架私有传输。
          </p>
          <p>
            <strong>在边界验证。</strong> 请求体应先完成解析和校验，再进入业务逻辑。
          </p>
          <p>
            <strong>显式声明运行时。</strong>{' '}
            静态页面可以调用 API，但 API 本身需要 serverless 或 edge 部署目标。
          </p>
        </div>
        <h2>Create API Routes</h2>
        <p>
          API routes 放在{' '}
          <span class='inline-code'>app/routes/api</span>。复杂 API 可以默认导出 Hono
          app，简单端点可以导出 plain function。
        </p>
        <h2>Static Build Boundary</h2>
        <p>
          SSG 输出是静态文件。API routes 是生成的 Hono app 的一部分，但纯静态托管不会运行它们。
          需要运行时行为时，通过 serverless adapters 或平台函数部署 API routes。
        </p>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/configuration'>Configuration -&gt;</open-button-linear>
        </div>
      </div>
    );
  }

  private _renderEn() {
    return (
      <div class='container'>
        <h1>API Routes</h1>
        <p class='subtitle'>
          openElement's server layer is Hono. API routes use standard Request/Response semantics and
          are suitable for serverless or edge runtime deployment.
        </p>
        <h2>Design Principles</h2>
        <div class='principle'>
          <p>
            <strong>Use platform primitives.</strong>{' '}
            Prefer Fetch, Request, Response over framework-specific transports.
          </p>
          <p>
            <strong>Validate at boundaries.</strong>{' '}
            Parse and validate request bodies before business logic sees the data.
          </p>
          <p>
            <strong>Declare runtime explicitly.</strong>{' '}
            Static pages can call APIs, but the APIs need a serverless or edge deployment target.
          </p>
        </div>
        <h2>Create API Routes</h2>
        <p>
          Place API routes in{' '}
          <span class='inline-code'>app/routes/api</span>. Default-export a Hono app for complex
          APIs, or a plain function <span class='inline-code'>(ctx) =&gt; Response</span>{' '}
          for simple endpoints.
        </p>
        <open-code-block>
          <pre>
            <code>{`// app/routes/api/posts.ts
import { Hono } from 'hono';

const app = new Hono();
app.get('/', (c) => c.json([{ id: 1, title: 'Hello' }]));
app.post('/', async (c) => {
  const body = await c.req.json();
  return c.json({ id: 2, ...body }, 201);
});

export default app;`}</code>
          </pre>
        </open-code-block>
        <open-code-block>
          <pre>
            <code>{`// app/routes/api/health.ts
import type { OpenElementApiContext } from '@openelement/core';

export default function GET(ctx: OpenElementApiContext) {
  return Response.json({ ok: true, mode: ctx.env.MODE ?? 'production' });
}`}</code>
          </pre>
        </open-code-block>
        <h2>Request Validation</h2>
        <p>
          openElement does not mandate a validation library. Zod with{' '}
          <span class='inline-code'>@hono/zod-validator</span> is a practical default.
        </p>
        <h2>Static Build Boundary</h2>
        <p>
          SSG output is static files. API routes are part of the generated Hono app, but static
          hosting will not execute them. Deploy API routes via serverless adapters or platform
          functions when runtime behavior is needed.
        </p>
        <div class='nav-row'>
          <open-button-linear variant='secondary' href='/guide/configuration'>Configuration -&gt;</open-button-linear>
        </div>
      </div>
    );
  }
}

customElements.define('page-api', ApiPage);
export default ApiPage;
export const tagName = 'page-api';
