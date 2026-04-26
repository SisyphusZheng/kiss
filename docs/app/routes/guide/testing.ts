import { css, html, LitElement } from '@kissjs/core';
import { pageStyles } from '../../components/page-styles.js';
import '../../components/layout.js';
import '../../islands/code-block.js';

export class TestingPage extends LitElement {
  static styles = [
    pageStyles,
    css`
    `,
  ];
  render() {
    return html`
      <app-layout currentPath="/guide/testing">
        <div class="container">
          <h1>Testing Strategy</h1>
          <p class="subtitle">Test pyramid, framework tests, and user project testing templates.</p>

          <h2>Test Pyramid</h2>
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Ratio</th>
                <th>Speed</th>
                <th>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Unit</td>
                <td>70%</td>
                <td>&lt;10ms</td>
                <td>Isolated functions / component logic</td>
              </tr>
              <tr>
                <td>Integration</td>
                <td>20%</td>
                <td>&lt;100ms</td>
                <td>Route + SSR + rendering</td>
              </tr>
              <tr>
                <td>E2E</td>
                <td>10%</td>
                <td>Seconds</td>
                <td>Critical user flows</td>
              </tr>
            </tbody>
          </table>

          <h2>Testing Framework</h2>
          <p>KISS uses Deno's built-in test runner — zero extra dependencies:</p>
          <code-block
          ><pre><code>// __tests__/context_test.ts
            import { assertEquals } from 'jsr:@std/assert'
            import { extractParams, parseQuery } from '@kissjs/core'

            Deno.test('extractParams parses dynamic segments', () => {
              const params = extractParams('/users/:id', '/users/42')
              assertEquals(params, { id: '42' })
            })</code></pre></code-block>

            <h2>Testing Your KISS App</h2>
            <code-block
            ><pre><code>// tests/api_test.ts
              import { assertEquals } from 'jsr:@std/assert'

              Deno.test('API returns posts', async () => {
                const res = await fetch('http://localhost:3000/api/posts')
                assertEquals(res.status, 200)
                const data = await res.json()
                assertEquals(Array.isArray(data), true)
              })</code></pre></code-block>

              <h2>CI Integration</h2>
              <code-block
              ><pre><code># .github/workflows/test.yml
                name: Test
                on: [push, pull_request]
                jobs:
                  test:
                    runs-on: ubuntu-latest
                    steps:
                      - uses: actions/checkout@v4
                      - uses: denoland/setup-deno@v2
                      - run: deno test --allow-read --allow-write</code></pre></code-block>

                      <h2>What KISS Tests Internally</h2>
                      <ul>
                        <li>
                          <span class="inline-code">entry-descriptor</span> — EntryDescriptor data model builder
                        </li>
                        <li><span class="inline-code">entry-renderer</span> — Code generation from descriptor</li>
                        <li><span class="inline-code">route-scanner</span> — File-based route discovery</li>
                        <li><span class="inline-code">island-transform</span> — AST marking + hydration detection</li>
                        <li><span class="inline-code">ssr-handler</span> — SSR rendering + error handling</li>
                        <li><span class="inline-code">context</span> — Request context utilities</li>
                        <li><span class="inline-code">errors</span> — Error class hierarchy</li>
                      </ul>

                      <div class="nav-row">
                        <a href="/guide/security-middleware" class="nav-link">&larr; Security &amp; Middleware</a>
                        <a href="/guide/architecture" class="nav-link">Architecture &rarr;</a>
                      </div>
                    </div>
                  </app-layout>
                `;
              }
            }

            customElements.define('page-testing', TestingPage);
            export default TestingPage;
            export const tagName = 'page-testing';
