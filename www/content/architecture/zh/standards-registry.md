---
title: '标准与 Registry 策略'
section: 'Compatibility'
label: 'Standards & Registry'
order: 20
---

<open-layout
        nav-items='$'
        header-nav='$'
        current-path="/$/architecture/standards-registry"
        locale="$"
        locales='$'
      >

          <h1>标准与 Registry 策略</h1>
          <p class="subtitle">
            openElement 的长期方向是 WC SSR/SSG 渲染内核和组件包协议。公共 registry hub 只有在本地索引、
            manifest、验证产物和安全治理成熟后才应该出现。
          </p>

          <h2>一句话边界</h2>
          <p>
            openElement 可以成为 Web Components 的 SSR/SSG 渲染内核和包协议，但不能承诺任意 Web Component
            都能被自动 SSR、自动注册和自动水合。所谓"自动"必须来自 manifest，而不是运行时猜测。
          </p>

          <h2>参考标准与生态</h2>
          <table>
            <thead>
              <tr>
                <th>参考</th>
                <th>openElement 如何使用</th>
                <th>不做什么</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>WHATWG HTML / DSD</td>
                <td>跟随 <code>shadowrootmode</code> 等 template 属性，作为 SSR 输出基础。</td>
                <td>不输出私有 hydration 标记替代平台语义。</td>
              </tr>
              <tr>
                <td>Custom Elements Manifest</td>
                <td>作为 tag、attribute、property、event、slot、part、CSS token 的元数据基础。</td>
                <td>不重新发明一套完全不兼容的组件文档格式。</td>
              </tr>
              <tr>
                <td>Open UI</td>
                <td>借鉴 parts、states、behavior、a11y、form semantics 的组件契约词汇。</td>
                <td>不把 openElement 变成 OpenWC 模板或 Open UI 实现库。</td>
              </tr>
              <tr>
                <td>OpenWC</td>
                <td>学习测试、lint、demo、发布的历史经验。</td>
                <td>不把旧测试栈、Rollup preset 或项目模板作为主路线。</td>
              </tr>
              <tr>
                <td>Lit / FAST</td>
                <td>作为 WC 作者体验和 adapter 输入。</td>
                <td>不把任一作者库绑定成 openElement 的定义。</td>
              </tr>
              <tr>
                <td>Scoped Custom Element Registries</td>
                <td>跟踪未来多版本和同名 tag 隔离能力。</td>
                <td>不在浏览器支持和协议稳定前把它写成当前依赖。</td>
              </tr>
              <tr>
                <td>CSS Houdini</td>
                <td>作为未来样式扩展和 worklet 方向观察。</td>
                <td>不把 Houdini 写入当前渲染核心承诺。</td>
              </tr>
            </tbody>
          </table>

          <h2>自动化必须满足的条件</h2>
          <table>
            <thead>
              <tr>
                <th>能力</th>
                <th>可行条件</th>
                <th>失败时行为</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>一键安装</td>
                <td>包声明 manifest，schema 通过，来源和版本可记录。</td>
                <td>只输出 dry-run diff，不修改配置。</td>
              </tr>
              <tr>
                <td>自动注册</td>
                <td>manifest 声明 tag、module、export 和注册策略。</td>
                <td>跳过重复 define，报告版本冲突。</td>
              </tr>
              <tr>
                <td>自动渲染</td>
                <td>组件声明 <code>ssr.renderable: true</code>，并有可用 adapter。</td>
                <td>降级为 host 元素或 pure island，并记录 diagnostics。</td>
              </tr>
              <tr>
                <td>自动水合</td>
                <td>声明 hydrate strategy、events、selectors 和 cleanup。</td>
                <td>保留静态 DSD HTML，不绑定未知事件。</td>
              </tr>
              <tr>
                <td>Hub 展示</td>
                <td>消费 manifest、SSR/SSG 快照、bundle cost、测试和 a11y 备注。</td>
                <td>隐藏未验证字段，不相信 README 营销文本。</td>
              </tr>
            </tbody>
          </table>

          <h2>建议的 manifest 字段</h2>
          <p>
            v0.16 不应该直接冻结完整生态协议，但应先定义可验证字段：
            package、version、components、tag、module、export、ssr、dsd、hydrate、events、slots、
            parts、states、tokens、diagnostics、validation。
          </p>

          <h2>市场现实</h2>
          <p>
            这个方向有差异化，但不是主流 React/Vue 应用框架替代品。最适合的用户是设计系统作者、 Web
            Components 包作者、文档/产品站团队、Deno/Edge 团队，以及需要内部组件索引和质量审计的组织。
          </p>

          <h2>近期优先级</h2>
          <ol>
            <li>把 renderer protocol、adapter contract 和 DSD diagnostics 文档化并加测试。</li>
            <li>把 <code>PackageIslandMeta</code> 扩展为 CEM-compatible 的包 manifest 草案。</li>
            <li>先做 manifest 验证 CLI，再做 <code>openelement add</code>。</li>
            <li>先做本地 registry index，再做公共 hub。</li>
          </ol>

          <div class="nav-row">
            <a href="/$/architecture/architecture" class="nav-link">&larr; Architecture</a>
            <a href="/roadmap" class="nav-link">Roadmap &rarr;</a>
          </div>
