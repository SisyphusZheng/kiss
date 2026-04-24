import { LitElement, html, css } from '@kissjs/core'
import { pageStyles } from '../../components/page-styles.js'
import '../../components/layout.js'

export class TestingPage extends LitElement {
  static styles = [pageStyles, css`
    :host { display: block; }
    .container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
    h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.5rem; color: #fff; }
    .subtitle { color: #666; margin-bottom: 2.5rem; font-size: 0.9375rem; line-height: 1.6; }
    h2 { font-size: 1.125rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    p { line-height: 1.7; margin: 0.5rem 0; color: #999; }
    pre { background: #111; color: #c8c8c8; padding: 1rem 1.25rem; border-radius: 3px; overflow-x: auto; font-size: 0.8125rem; line-height: 1.6; margin: 0.75rem 0; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .inline-code { background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.875rem; }
    th, td { border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #111; font-weight: 600; color: #ccc; }
    .nav-row { margin-top: 2.5rem; display: flex; justify-content: space-between; }
  `]
  render() {
    return html`
      <app-layout>
        <div class="container">
          <h1>Testing Strategy</h1>
          <p class="subtitle">Test pyramid, framework tests, and user project testing templates.</p>

          <h2>Test Pyramid</h2>
          <table>
            <thead>
              <tr><th>Level</th><th>Ratio</th><th>Speed</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              <tr><td>Unit</td><td>70%</td><td>&lt;10ms</td><td>Isolated functions / component logic</td></tr>
              <tr><td>Integration</td><td>20%</td><td>&lt;100ms</td><td>Route + SSR + rendering</td></tr>
              <tr><td>E2E</td><td>10%</td><td>Seconds</td><td>Critical user flows</td></tr>
            </tbody>
          </table>

          <h2>Testing Framework</h2>
          <p>KISS uses Deno's built-in test runner — zero extra dependencies:</p>
          <pre><code>// __tests__/context_test.ts
import { assertEquals } from 'jsr:@std/assert'
import { extractParams, parseQuery } from '@kissjs/core'

Deno.test('extractParams parses dynamic segments', () => {
  const params = extractParams('/users/:id', '/users/42')
  assertEquals(params, { id: '42' })
})</code></pre>

          <h2>Testing Your KISS App</h2>
          <pre><code>// tests/api_test.ts
import { assertEquals } from 'jsr:@std/assert'

Deno.test('API returns posts', async () => {
  const res = await fetch('http://localhost:3000/api/posts')
  assertEquals(res.status, 200)
  const data = await res.json()
  assertEquals(Array.isArray(data), true)
})</code></pre>

          <h2>CI Integration</h2>
          <pre><code># .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
      - run: deno test --allow-read --allow-write</code></pre>

          <h2>What KISS Tests Internally</h2>
          <ul>
            <li><span class="inline-code">entry-descriptor</span> — EntryDescriptor data model builder</li>
            <li><span class="inline-code">entry-renderer</span> — Code generation from descriptor</li>
            <li><span class="inline-code">route-scanner</span> — File-based route discovery</li>
            <li><span class="inline-code">island-transform</span> — AST marking + hydration detection</li>
            <li><span class="inline-code">ssr-handler</span> — SSR rendering + error handling</li>
            <li><span class="inline-code">context</span> — Request context utilities</li>
            <li><span class="inline-code">errors</span> — Error class hierarchy</li>
          </ul>

          <div class="nav-row">
            <a href="/kiss/guide/security-middleware" class="nav-link">&larr; Security &amp; Middleware</a>
            <a href="/kiss/guide/api-design" class="nav-link">API Design &rarr;</a>
          </div>
        </div>
      </app-layout>
    `
  }
}

customElements.define('page-testing', TestingPage)
export default TestingPage
export const tagName = 'page-testing'
