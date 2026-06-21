---
title: '设计系统'
section: 'Reference'
label: 'Design System'
order: 10
---

<open-layout
locale=
locales=
navItems=
headerNav=
currentPath=/architecture/design-system`}

    <h1>设计系统</h1>
    <p class='subtitle'>
      <strong>双色板。零噪音。</strong>
      <br />深色和浅色。没有别的。
    </p>
    <div class='section'>
      <div class='section-title'>色板</div>
      <div class='palette-row'>
        <div class='palette-card palette-dark'>
          <div class='palette-name'>深色</div>
          <div class='swatch-grid'>
            <div class='swatch-item'>
              <div class='swatch' style='background:#000'></div>
              <div class='swatch-label'>基底</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#0a0a0a'></div>
              <div class='swatch-label'>表面</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#fff'></div>
              <div class='swatch-label'>主色</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#999'></div>
              <div class='swatch-label'>次色</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#666'></div>
              <div class='swatch-label'>第三色</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#444'></div>
              <div class='swatch-label'>静默</div>
            </div>
          </div>
          <p class='palette-desc'>
            <strong>黑色</strong> 基底。白色强调。灰色分层。
          </p>
        </div>
        <div class='palette-card palette-light'>
          <div class='palette-name'>浅色</div>
          <div class='swatch-grid'>
            <div class='swatch-item'>
              <div class='swatch' style='background:#fff'></div>
              <div class='swatch-label'>基底</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#fafafa'></div>
              <div class='swatch-label'>表面</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#000'></div>
              <div class='swatch-label'>主色</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#555'></div>
              <div class='swatch-label'>次色</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#888'></div>
              <div class='swatch-label'>第三色</div>
            </div>
            <div class='swatch-item'>
              <div class='swatch' style='background:#aaa'></div>
              <div class='swatch-label'>静默</div>
            </div>
          </div>
          <p class='palette-desc'>
            <strong>白色</strong> 基底。黑色强调。灰色分层。
          </p>
        </div>
      </div>
    </div>
    <div class='section'>
      <div class='section-title'>按钮</div>
      <div class='preview-card'>
        <div class='preview-header'>
          <span class='preview-title'>变体</span>
          <span class='preview-badge'>可用</span>
        </div>
        <div class='preview-body'>
          <open-button variant='primary'>主要按钮</open-button>
          <open-button>默认按钮</open-button>
          <open-button variant='ghost'>幽灵按钮</open-button>
        </div>
      </div>
    </div>
    <div class='section'>
      <div class='section-title'>输入框</div>
      <div class='preview-card'>
        <div class='preview-header'>
          <span class='preview-title'>文本输入</span>
          <span class='preview-badge'>可用</span>
        </div>
        <div class='preview-body preview-body-col'>
          <open-input placeholder='输入邮箱...' label='邮箱'></open-input>
          <open-input type='password' placeholder='密码' label='密码' required>
          </open-input>
          <open-input value='hello@openelement.org' label='只读' disabled></open-input>
        </div>
      </div>
    </div>
    <div class='install-section'>
      <h3>安装 @openelement/ui</h3>
      <div class='install-cmd'>
        <span class='prompt'>$</span> npm install @openelement/ui
      </div>
      <p>Deno、Node、Bun。零配置。</p>
    </div>
    <div class='nav-row'>
      <a href=/architecture/architecture`} class='nav-link'>← Architecture</a>
      <a href=/architecture/reference/core`} class='nav-link'>API Reference →</a>
    </div>
