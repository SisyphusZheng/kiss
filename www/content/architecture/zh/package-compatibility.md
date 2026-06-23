---
title: '第三方包兼容性'
section: 'Compatibility'
label: 'Package Compatibility'
order: 10
---

<open-layout
        nav-items='$'
        header-nav='$'
        current-path="/$/architecture/package-compatibility"
        locale="$"
        locales='$'
      >

          <h1>第三方包兼容性</h1>
          <p class="subtitle">
            openElement 通过 `@openelement/protocol` 和 `@openelement/core` 提供的协议面识别第三方 Web Component 包，安全决定谁可以 SSR、谁只能跑在浏览器。
          </p>

          <h2>核心思路</h2>
          <p>
            第三方 Web Component 包来自不同的生态：有些用 Lit、有些用 Vanilla、有些只能在浏览器运行。
            openElement 不做"一刀切"假设，而是通过 `@openelement/protocol` 的包元数据协议和 `@openelement/core`
            的 renderer 适配来了解每个包。
          </p>
          <h3>manifest 或显式声明</h3>
          <p>
            例如某个未发布 manifest 的第三方包（如 <code>@example/third-party-wc</code>）<strong>不发布</strong>
            <code>custom-elements.json</code>。没有 manifest，自动检测返回空，这些包会按照 <code>packageIslands</code>
            里的显式声明来处理。
          </p>

          <h2>4 级兼容性分类</h2>
          <table class="version-table">
            <thead>
              <tr>
                <th>等级</th>
                <th>含义</th>
                <th>构建行为</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>ssr-capable</code></td>
                <td>有显式的 `@openelement/core` SSR 声明或 renderer 适配器支持</td>
                <td>导入 SSR bundle，参与 DSD 渲染</td>
              </tr>
              <tr>
                <td><code>client-only</code></td>
                <td>浏览器专用，或无 SSR 声明<ul><li>CEM 没有 openElement 扩展</li><li>显式 <code>ssr: false</code></li><li>没有 CEM 时默认</li></ul></td>
                <td>排除出 SSR bundle，生成 client 注册/水合元数据</td>
              </tr>
              <tr>
                <td><code>rejected</code></td>
                <td>无效 manifest、重复 tag、不安全路径</td>
                <td>在代码生成前报错</td>
              </tr>
              <tr>
                <td><code>experimental-dom</code></td>
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
          <open-code-block><pre><code>// 伪代码 - 实际实现在 route-scanner.ts

for (const pkg of node_modules)
}</code></pre></open-code-block>

          <h3>特点</h3>
          <ul>
            <li><strong>不执行包代码</strong> - 只读 JSON，安全可靠</li>
            <li><strong>支持 scoped 包</strong> - 正确处理 <code>@org/pkg</code> 模式</li>
            <li><strong>失败不阻塞</strong> - 某个包 CEM 损坏不会导致构建失败</li>
            <li><strong>零配置</strong> - 自动运行，不需要手动声明</li>
          </ul>

          <h2>构建产物中的兼容性报告</h2>
          <p>
            构建完成后，兼容性摘要会写入构建报告（如 <code>manifest.json</code> 或等价的构建产物），包含
            <code>cemCompatibility</code> 部分：
          </p>
          <open-code-block><pre><code>
    ]

}
}</code></pre></open-code-block>

<p>
每条记录包含包名、兼容等级、原因说明和组件数量，方便调试和审计。
</p>

          <h2>当前站点的实际结果</h2>
          <p>
            当前 www 示例站点通过 <code>vite.config.ts</code> 中 <code>packageIslands</code> 显式声明第三方包。
            引入没有 manifest 的第三方包时，必须通过该配置显式声明其行为。
          </p>

          <h2>对比：有 CEM vs 无 CEM</h2>
          <table class="version-table">
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
                <td><code>ssr-capable</code></td>
                <td>自动加入 SSR bundle</td>
              </tr>
              <tr>
                <td>包有 CEM + 无 SSR 声明</td>
                <td><code>client-only</code></td>
                <td>安全 fallback，不在服务端渲染</td>
              </tr>
              <tr>
                <td>包无 CEM</td>
                <td>空（检测不到）</td>
                <td>通过 <code>packageIslands</code> 手动声明</td>
              </tr>
              <tr>
                <td>包无 CEM + 未在 packageIslands</td>
                <td>空</td>
                <td>不注册（需要用户显式引用）</td>
              </tr>
            </tbody>
          </table>

          <h2>路线图展望</h2>
          <ul class="compact-list">
            <li><strong>v0.18.1</strong>: manifest 验证 CLI - 安装前手动验证</li>
            <li><strong>v0.18.2</strong>: <code>openelement add</code> - 一键安装 + 配置第三方包</li>
            <li><strong>v0.18.3</strong>: DOM 模拟 - 实验性尝试渲染 client-only 组件</li>
          </ul>

          <nav class="nav-row">
            <a class="nav-link" href="/$/architecture/architecture">← Architecture</a>
            <a class="nav-link" href="/$/architecture/standards-registry">Standards &amp; Registry -></a>
          </nav>
