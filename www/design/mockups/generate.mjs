// ponytail: single script — token-driven mockup SVGs + PNGs
// All design values sourced from tokens.json with Open Props-compatible naming
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '..', 'icons');
const mockupsDir = __dirname;

// ═══ Token loading from tokens.json ═══
const _tokensRaw = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'tokens', 'tokens.json'), 'utf-8'),
);
const _td = _tokensRaw['openelement-linear'].tokens;
const dc = _td.color.dark;
const lc = _td.color.light;

// ponytail: compute RGBA from hex for derived tokens
function _hexRgb(h) {
  const v = parseInt(h.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}
function _rgba(h, a) {
  const { r, g, b } = _hexRgb(h);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

// ═══ Design tokens — sourced from tokens.json (Open Props naming) ═══
function iconBody(name) {
  return readFileSync(resolve(iconsDir, name + '.svg'), 'utf-8')
    .replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').trim();
}

const icons = {
  elementsFirst: iconBody('elements-first'),
  oneRenderer: iconBody('one-renderer'),
  appLifecycle: iconBody('app-lifecycle'),
  trustedBoundary: iconBody('trusted-boundary'),
  gateProven: iconBody('gate-proven'),
  webStandards: iconBody('web-standards'),
};

const T = {
  // ── Surface / Gray (--gray-*) ──
  canvas: dc.canvas.value, // --gray-12  #08080a
  surface1: dc['surface-1'].value, // --gray-11  #0d0f12
  surface2: dc['surface-2'].value, // --gray-10  #16191d
  surface3: dc['surface-3'].value, // --gray-9   #212529
  // ── Brand / Indigo (--indigo-*) ──
  brand: dc.brand.value, // --indigo-7 #4263eb
  brandHover: dc['brand-hover'].value, // --indigo-8 #3b5bdb
  brandLight: dc['brand-light'].value, // --indigo-5 #5c7cfa
  brandPale: dc['brand-pale'].value, // --indigo-4 #748ffc
  brandDeep: dc['brand-deep'].value, //           #26215c
  brandGlow: _rgba(dc.brand.value, 0.12),
  brandSubtle: _rgba(dc.brand.value, 0.08),
  // ── Text ──
  textPrimary: dc['text-primary'].value, // --gray-2  #e9ecef
  textSecondary: dc['text-secondary'].value, // --gray-5  #adb5bd
  textMuted: dc['text-muted'].value, // --gray-6  #868e96
  textInverse: '#12131a',
  // ── Border ──
  border: dc.border.value, // rgba(255,255,255,0.06)
  borderHover: dc['border-hover'].value, // rgba(255,255,255,0.10)
  borderStrong: dc['border-strong'].value, // rgba(255,255,255,0.14)
  edge: dc['edge-highlight'].value, // rgba(255,255,255,0.08)
  // ── Semantic ──
  success: dc.success.value, // --green-6  #4ade80
  successSubtle: dc['success-subtle'].value, // rgba(74,222,128,0.1)
  error: dc.error.value, // --red-5   #f87171
  errorSubtle: dc['error-subtle'].value, // rgba(248,113,113,0.12)
  warning: dc.warning.value, //           #fbbf24
  warningSubtle: dc['warning-subtle'].value, // rgba(251,191,36,0.1)
  info: dc.info.value, //           #60a5fa
  infoSubtle: dc['info-subtle'].value, // rgba(96,165,250,0.1)
  // ── Code syntax ──
  codeKeyword: '#c084fc',
  codeString: dc.success.value,
  codeFn: dc.info.value,
  codeTag: dc.warning.value,
  codeComment: dc['text-muted'].value,
  codeVar: '#fb7185',
  codeType: '#f59e0b',
  // ── Terminal chrome (macOS traffic lights, traditional) ──
  termRed: '#ff5f57',
  termYellow: '#febc2e',
  termGreen: '#28c840',
  // ── Legacy aliases (keep existing code working) ──
  surface0: dc['surface-1'].value,
  successBg: dc['success-subtle'].value,
  errorBg: dc['error-subtle'].value,
  warningBg: dc['warning-subtle'].value,
  infoBg: dc['info-subtle'].value,
  purple: '#c084fc',
  purpleBg: _rgba('#c084fc', 0.08),
  rose: '#fb7185',
  roseBg: _rgba('#fb7185', 0.08),
  edgeBright: dc['border-strong'].value,
};

const W = 1440;

// ── SVG helpers ──
function svgWrap(w, h, body, defs = '') {
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h +
    '" xmlns="http://www.w3.org/2000/svg">\n' +
    '  <defs>\n' +
    '    <style>\n' +
    "      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;display=swap');\n" +
    "      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&amp;display=swap');\n" +
    "      .sans { font-family: 'Inter', -apple-system, system-ui, sans-serif; }\n" +
    "      .mono { font-family: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace; }\n" +
    '    </style>\n' +
    '    <linearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">\n' +
    '      <stop offset="0%" stop-color="' + T.brand + '" />\n' +
    '      <stop offset="100%" stop-color="' + T.brandLight + '" />\n' +
    '    </linearGradient>\n' +
    defs +
    '  </defs>\n' +
    '  <rect width="' + w + '" height="' + h + '" fill="' + T.canvas + '" />\n' +
    body +
    '\n</svg>';
}

function _t(x, y, text, opts = {}) {
  const size = opts.size || 13, weight = opts.weight || 400;
  const fill = opts.fill || T.textPrimary, family = opts.family || 'sans';
  const attrs = [
    'x="' + x + '"',
    'y="' + y + '"',
    'font-size="' + size + '"',
    'font-weight="' + weight + '"',
    'fill="' + fill + '"',
  ];
  if (opts.ls) attrs.push('letter-spacing="' + opts.ls + '"');
  if (opts.lh) attrs.push('line-height="' + opts.lh + '"');
  if (opts.ta) attrs.push('text-anchor="' + opts.ta + '"');
  const cls = family === 'mono' ? 'mono' : 'sans';
  return '<text class="' + cls + '" ' + attrs.join(' ') + '>' + esc(text) + '</text>';
}

function rect(x, y, w, h, opts = {}) {
  const attrs = ['x="' + x + '"', 'y="' + y + '"', 'width="' + w + '"', 'height="' + h + '"'];
  if (opts.rx) attrs.push('rx="' + opts.rx + '"');
  if (opts.fill !== undefined && opts.fill !== 'none') attrs.push('fill="' + opts.fill + '"');
  // fill === undefined means use default (no fill attribute)
  else attrs.push('fill="none"');
  if (opts.stroke) {
    attrs.push('stroke="' + opts.stroke + '"', 'stroke-width="' + (opts.sw || 1) + '"');
  }
  if (opts.opacity !== undefined) attrs.push('opacity="' + opts.opacity + '"');
  return '<rect ' + attrs.join(' ') + ' />';
}

function line(x1, y1, x2, y2, opts = {}) {
  const attrs = [
    'x1="' + x1 + '"',
    'y1="' + y1 + '"',
    'x2="' + x2 + '"',
    'y2="' + y2 + '"',
    'stroke="' + (opts.stroke || T.border) + '"',
    'stroke-width="' + (opts.sw || 1) + '"',
  ];
  if (opts.opacity !== undefined) attrs.push('opacity="' + opts.opacity + '"');
  return '<line ' + attrs.join(' ') + ' />';
}

function circle(cx, cy, r, opts = {}) {
  const attrs = ['cx="' + cx + '"', 'cy="' + cy + '"', 'r="' + r + '"'];
  if (opts.fill && opts.fill !== 'none') attrs.push('fill="' + opts.fill + '"');
  else attrs.push('fill="none"');
  if (opts.stroke) {
    attrs.push('stroke="' + opts.stroke + '"', 'stroke-width="' + (opts.sw || 1) + '"');
  }
  return '<circle ' + attrs.join(' ') + ' />';
}

function dot(x, y, color, r) {
  color = color || T.textMuted;
  r = r || 2;
  return circle(x, y, r, { fill: color });
}

function card(x, y, w, h, opts = {}) {
  const fill = opts.fill || T.surface2;
  const highlight = opts.highlight !== false;
  return '\n    ' + rect(x, y, w, h, { rx: 12, fill: fill, stroke: T.border }) +
    (highlight ? '\n    ' + line(x + 6, y, x + w - 6, y, { stroke: T.edge }) : '');
}

function btn(x, y, label, opts = {}) {
  const variant = opts.variant || 'primary';
  const bw = opts.w || 140, bh = opts.h || 36, size = opts.size || 14;
  const isPrimary = variant === 'primary';
  const bg = isPrimary ? T.brand : T.surface1;
  const fillColor = isPrimary ? '#ffffff' : T.textPrimary;
  let parts = rect(x, y, bw, bh, { rx: 8, fill: bg, stroke: isPrimary ? T.brand : T.border });
  parts += '<text class="sans" x="' + (x + bw / 2) + '" y="' + (y + bh / 2 + size * 0.35) +
    '" font-size="' + size + '" font-weight="500" fill="' + fillColor + '" text-anchor="middle">' +
    esc(label) + '</text>';
  return parts;
}

function badge(x, y, label, opts = {}) {
  const bg = opts.bg || T.surface1, color = opts.color || T.textMuted, size = opts.size || 12;
  const pw = Math.max(36, label.length * 7.5 + 20);
  return '\n    ' + rect(x, y, pw, 24, { rx: 9999, fill: bg, stroke: T.border }) +
    '\n    <text class="sans" x="' + (x + pw / 2) + '" y="' + (y + 16) +
    '" font-size="' + size + '" font-weight="400" fill="' + color + '" text-anchor="middle">' +
    esc(label) + '</text>';
}

// ── Icon library — all icons loaded from www/design/icons/*.svg ──
const I = {
  search: iconBody('search'),
  calendar: iconBody('calendar'),
  clock: iconBody('clock'),
  tag: iconBody('tag'),
  arrowRight: iconBody('arrow-right'),
  externalLink: iconBody('external-link'),
  github: iconBody('github'),
  terminal: iconBody('terminal'),
  check: iconBody('check'),
  file: iconBody('file'),
  folder: iconBody('folder'),
  chevronRight: iconBody('chevron-right'),
  copy: iconBody('copy'),
  package: iconBody('package'),
  zap: iconBody('zap'),
  layers: iconBody('layers'),
  bookmark: iconBody('bookmark'),
};

function inlineIcon(name, x, y, opts) {
  opts = opts || {};
  const color = opts.color || T.textSecondary;
  const raw = I[name];
  if (!raw) return '';
  return '<g transform="translate(' + x + ',' + y + ')" color="' + color + '">' + raw + '</g>';
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(
    /"/g,
    '&quot;',
  );
}

// ── Syntax-highlighted code line ──
function codeLine(x, y, segments) {
  let cx = x, parts = '';
  for (const seg of segments) {
    if (typeof seg === 'string') {
      parts += _t(cx, y, seg, { family: 'mono', size: 13, fill: T.textPrimary });
      cx += seg.length * 7.8;
    } else {
      parts += _t(cx, y, seg.text, { family: 'mono', size: 13, fill: seg.color || T.textPrimary });
      cx += seg.text.length * 7.8;
    }
  }
  return parts;
}

// ── Shared Nav ──
function nav(opts) {
  opts = opts || {};
  const active = opts.active || '';
  const navItems = [
    { label: 'Guide', x: 620 },
    { label: 'API', x: 700 },
    { label: 'Architecture', x: 810 },
    { label: 'Blog', x: 930 },
    { label: 'Changelog', x: 1000 },
  ];
  let svg = '\n    <g id="nav">\n' +
    '      ' + rect(0, 0, W, 56, { fill: T.canvas, opacity: 0.95 }) + '\n' +
    '      ' + line(0, 56, W, 56, { stroke: T.border }) + '\n' +
    '      <g transform="translate(28, 16)">\n' +
    '        ' + rect(0, 0, 24, 24, { rx: 6, fill: T.brand }) + '\n' +
    '        <text x="12" y="17" font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle" font-family="Inter, sans-serif">O</text>\n' +
    '      </g>\n' +
    _t(60, 34, 'openElement', { size: 17, weight: 600 }) + '\n';
  navItems.forEach(function (item) {
    svg += _t(item.x, 34, item.label, {
      size: 13,
      weight: 500,
      fill: active === item.label ? T.textPrimary : T.textSecondary,
      ls: '0.01em',
    });
  });
  // Nav CTA buttons
  svg += btn(1060, 10, 'GitHub', { variant: 'secondary', w: 85, h: 36, size: 13 });
  svg += btn(1155, 10, 'Get started', { variant: 'primary', w: 110, h: 36, size: 13 });
  svg += '\n  </g>';
  return svg;
}

// ── Shared Footer ──
function footer(startY) {
  const columns = [
    { title: 'Product', links: ['Elements', 'UI', 'Framework', 'Protocols'] },
    { title: 'Resources', links: ['Guide', 'API', 'Architecture', 'Blog'] },
    { title: 'Company', links: ['GitHub', 'JSR', 'Changelog'] },
    { title: 'Legal', links: ['MIT License', 'Contributing'] },
  ];
  let svg = '\n    <g id="footer">\n' +
    '      ' + line(64, startY, W - 64, startY, { stroke: T.border }) + '\n' +
    _t(64, startY + 44, 'openElement', { size: 18, weight: 600 }) + '\n' +
    _t(64, startY + 72, 'The Open Element for Web Components', { size: 13, fill: T.textMuted }) +
    '\n';
  let colX = 340;
  columns.forEach(function (col) {
    svg += _t(colX, startY + 44, col.title, { size: 13, weight: 600 }) + '\n';
    col.links.forEach(function (link, li) {
      svg += _t(colX, startY + 72 + li * 22, link, { size: 13, fill: T.textMuted }) + '\n';
    });
    colX += 180;
  });
  svg += '      ' + line(64, startY + 156, W - 64, startY + 156, { stroke: T.border }) + '\n' +
    _t(64, startY + 182, '© 2026 openElement. Built with Web Standards. MIT License.', {
      size: 12,
      fill: T.textMuted,
    }) + '\n' +
    _t(W - 220, startY + 182, 'Powered by Deno & Web Components', { size: 12, fill: T.textMuted }) +
    '\n' +
    '    </g>\n';
  return svg;
}

// ── Sidebar navigation ──
function sidebarNav(x, y, sections) {
  let svg = '<g id="sidebar">\n';
  let cy = y;
  svg += _t(x, cy, 'DOCS', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) + '\n';
  cy += 28;
  sections.forEach(function (section) {
    if (section.heading) {
      svg +=
        _t(x, cy, section.heading, { size: 12, weight: 600, fill: T.textSecondary, ls: '0.02em' }) +
        '\n';
      cy += 26;
    }
    if (section.items) {
      section.items.forEach(function (item) {
        svg += _t(x + 12, cy, item.label, {
          size: 13,
          weight: item.active ? 500 : 400,
          fill: item.active ? T.textPrimary : T.textMuted,
        }) + '\n';
        if (item.active) {
          svg += rect(x - 8, cy - 12, 172, 28, { rx: 6, fill: T.surface3, opacity: 0.5 }) + '\n';
          svg += rect(x - 8, cy - 4, 3, 16, { rx: 2, fill: T.brand }) + '\n';
        }
        if (item.badge) {
          svg += badge(x + 130, cy - 10, item.badge, { bg: T.infoBg, color: T.info, size: 10 }) +
            '\n';
        }
        cy += 24;
      });
    }
    cy += 8;
  });
  svg += '</g>';
  return svg;
}

// ── Page TOC ──
function pageTOC(x, y, items) {
  let svg = '<g id="toc">\n' +
    _t(x, y, 'On this page', { size: 11, weight: 500, fill: T.textMuted, ls: '0.06em' }) + '\n';
  let cy = y + 26;
  items.forEach(function (item) {
    svg += dot(x, cy - 6) + _t(x + 8, cy, item, { size: 13, fill: T.textMuted }) + '\n';
    cy += 24;
  });
  svg += '</g>';
  return svg;
}

// ── Timeline item ──
function timelineItem(x, y, w, opts) {
  opts = opts || {};
  const dotY = y + 12;
  let svg = '\n    <g id="timeline-item">\n' +
    '      <line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 120) + '" stroke="' +
    T.border + '" stroke-width="1" />\n' +
    '      <circle cx="' + x + '" cy="' + dotY + '" r="5" fill="' + (opts.dotColor || T.brand) +
    '" stroke="' + T.canvas + '" stroke-width="2" />\n' +
    '      ' + rect(x + 24, y, w, 100, { rx: 10, fill: T.surface2, stroke: T.border }) + '\n' +
    '      ' + line(x + 30, y, x + 24 + w - 6, y, { stroke: T.edge }) + '\n';
  if (opts.version) {
    svg += badge(x + 40, y + 22, opts.version, {
      bg: opts.badgeBg || T.successBg,
      color: opts.badgeColor || T.success,
      size: 11,
    }) + '\n';
  }
  if (opts.date) {
    svg += _t(x + 24 + w - 170, y + 24, opts.date, { size: 13, fill: T.textMuted }) + '\n';
  }
  svg += _t(x + 40, y + 56, opts.title || '', { size: 18, weight: 600 }) + '\n';
  if (opts.desc) svg += _t(x + 40, y + 80, opts.desc, { size: 14, fill: T.textSecondary }) + '\n';
  svg += '  </g>';
  return svg;
}

// ── Article card ──
function articleCard(x, y, w, opts) {
  opts = opts || {};
  const tagW = (opts.tag || '').length * 7.5 + 20;
  let svg = '\n    <g id="article-card">\n' +
    '      ' + rect(x, y, w, 160, { rx: 12, fill: T.surface2, stroke: T.border }) + '\n' +
    '      ' + line(x + 6, y, x + w - 6, y, { stroke: T.edge }) + '\n';
  if (opts.tag) {
    svg += badge(x + 24, y + 24, opts.tag, { bg: T.brandGlow, color: T.brand, size: 11 }) + '\n';
  }
  if (opts.date) {
    svg +=
      _t(x + 24 + (opts.tag ? tagW + 10 : 0), y + 26, opts.date, { size: 13, fill: T.textMuted }) +
      '\n';
  }
  svg += _t(x + 24, y + 62, opts.title || '', { size: 22, weight: 500 }) + '\n';
  svg += _t(x + 24, y + 96, opts.desc || '', { size: 14, fill: T.textSecondary }) + '\n';
  svg += _t(x + 24, y + 136, opts.author || '', { size: 13, fill: T.textMuted }) + '\n';
  svg += dot(x + 24 + (opts.author || '').length * 7.5 + 10, y + 130) + '\n';
  svg += _t(x + 24 + (opts.author || '').length * 7.5 + 18, y + 136, opts.readTime || '', {
    size: 13,
    fill: T.textMuted,
  }) + '\n';
  svg += '  </g>';
  return svg;
}

// ── Architecture diagram node ──
function archNode(x, y, label, opts) {
  opts = opts || {};
  const variant = opts.variant || 'default';
  const w = opts.w || 160, h = opts.h || 60;
  const fills = { default: T.surface2, brand: T.brand, surface: T.surface1, elevated: T.surface3 };
  const textColors = {
    default: T.textPrimary,
    brand: '#ffffff',
    surface: T.textPrimary,
    elevated: T.textPrimary,
  };
  const fill = fills[variant] || T.surface2;
  const color = textColors[variant] || T.textPrimary;
  let svg = '\n    ' + rect(x, y, w, h, { rx: 8, fill: fill, stroke: T.border }) + '\n' +
    _t(x + w / 2, y + h / 2 + 5, label, { size: 13, weight: 500, fill: color, ta: 'middle' }) +
    '\n';
  if (opts.tag) {
    svg += _t(x + w / 2, y + h + 16, opts.tag, { size: 11, fill: T.textMuted, ta: 'middle' }) +
      '\n';
  }
  return svg;
}

function archEdge(x1, y1, x2, y2) {
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' +
    T.borderStrong + '" stroke-width="1" stroke-dasharray="4,4" />';
}
// ═══════════════════════════════════════════
//  MOCKUP GENERATORS
// ═══════════════════════════════════════════

// ── 01: Homepage Hero (Elevated) ──
function gen01HomeHero() {
  let body = nav({ active: 'Guide' }) +
    '<ellipse cx="720" cy="240" rx="600" ry="280" fill="' + T.brand + '" opacity="0.025" />' +
    // Eyebrow
    _t(80, 130, 'openelement 0.40.7 / v0.40.7 active', {
      size: 13,
      weight: 500,
      fill: T.brand,
      ls: '0.04em',
    }) +
    _t(80, 170, 'THE', { size: 80, weight: 600, ls: '-0.05em' }) +
    _t(80, 260, 'OPEN', { size: 80, weight: 600, ls: '-0.05em' }) +
    _t(318, 260, 'ELEMENT', { size: 80, weight: 600, fill: T.brand, ls: '-0.05em' }) +
    dot(688, 274) +
    _t(696, 284, 'Web Components, reimagined.', {
      size: 16,
      weight: 500,
      fill: T.brandPale,
      ls: '-0.01em',
    }) +
    _t(80, 360, 'A four-product Web Components platform — Elements, UI, App, and Core.', {
      size: 19,
      fill: T.textSecondary,
    }) +
    _t(80, 390, 'JSX pages, one VNode renderer, structured route lifecycle, explicit', {
      size: 19,
      fill: T.textSecondary,
    }) +
    _t(80, 420, 'trusted HTML boundaries, and island JavaScript that upgrades only where needed.', {
      size: 19,
      fill: T.textSecondary,
    }) +
    btn(80, 480, 'Start building', { variant: 'primary', w: 158, h: 44, size: 15 }) +
    btn(254, 480, 'Read architecture', { variant: 'secondary', w: 174, h: 44, size: 15 }) +
    // Stats bar
    _t(80, 560, '14', { size: 32, weight: 600 }) +
    _t(126, 575, 'packages', { size: 13, fill: T.textMuted }) +
    _t(220, 560, '98%', { size: 32, weight: 600 }) +
    _t(282, 575, 'coverage', { size: 13, fill: T.textMuted }) +
    _t(390, 560, '0', { size: 32, weight: 600 }) +
    _t(420, 575, 'runtime deps', { size: 13, fill: T.textMuted }) +
    _t(540, 560, '~12 KB', { size: 32, weight: 600 }) +
    _t(614, 575, 'gzipped', { size: 13, fill: T.textMuted });

  // Code panel (480px wide per spec)
  body += '<g transform="translate(760, 120)">' +
    rect(0, 0, 480, 420, { rx: 12, fill: T.surface1, stroke: T.border }) +
    line(6, 0, 474, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    _t(72, 24, 'app.tsx', { family: 'mono', size: 12, fill: T.textMuted }) +
    line(0, 40, 480, 40) +
    codeLine(20, 66, [
      { text: 'import', color: T.codeKeyword },
      { text: ' { definePage, Layout } ', color: T.textPrimary },
      { text: 'from', color: T.codeKeyword },
      { text: ' ', color: T.textPrimary },
      { text: "'@openelement/app'", color: T.codeString },
      { text: ';', color: T.textPrimary },
    ]) +
    codeLine(20, 86, [{ text: '// @ts-check', color: T.codeComment }]) +
    codeLine(20, 112, [{ text: 'export default definePage({', color: T.textPrimary }]) +
    codeLine(20, 132, [
      { text: '  route', color: T.codeVar },
      { text: ': { ', color: T.textPrimary },
      { text: 'path', color: T.codeVar },
      { text: ': ', color: T.textPrimary },
      { text: "'/'", color: T.codeString },
      { text: ' },', color: T.textPrimary },
    ]) +
    codeLine(20, 152, [
      { text: '  head', color: T.codeVar },
      { text: ': { ', color: T.textPrimary },
      { text: 'title', color: T.codeVar },
      { text: ': ', color: T.textPrimary },
      { text: "'openElement'", color: T.codeString },
      { text: ' },', color: T.textPrimary },
    ]) +
    codeLine(20, 178, [{ text: '  render', color: T.codeFn }, {
      text: '() {',
      color: T.textPrimary,
    }]) +
    codeLine(20, 198, [{ text: '    return (', color: T.textPrimary }]) +
    codeLine(20, 218, [{ text: '      <', color: T.codeTag }, {
      text: 'Layout>',
      color: T.codeTag,
    }]) +
    codeLine(20, 238, [
      { text: '        <', color: T.codeTag },
      { text: 'h1', color: T.codeTag },
      { text: '>Welcome</', color: T.codeTag },
      { text: 'h1', color: T.codeTag },
      { text: '>', color: T.codeTag },
    ]) +
    codeLine(20, 258, [{ text: '      </', color: T.codeTag }, {
      text: 'Layout>',
      color: T.codeTag,
    }]) +
    codeLine(20, 278, [{ text: '    );', color: T.textPrimary }]) +
    codeLine(20, 298, [{ text: '  }', color: T.textPrimary }]) +
    codeLine(20, 318, [{ text: '});', color: T.textPrimary }]) +
    // Preview (moved left for 480px panel)
    rect(290, 180, 170, 120, { rx: 8, fill: T.surface3 }) +
    _t(306, 202, 'Live Preview', { size: 11, fill: T.textMuted }) +
    _t(306, 228, '<h1>', { family: 'mono', size: 12, fill: T.codeTag }) +
    _t(340, 228, 'Welcome', { family: 'mono', size: 12, fill: T.textSecondary }) +
    _t(378, 228, '</h1>', { family: 'mono', size: 12, fill: T.codeTag }) +
    '</g>';

  return svgWrap(1440, 690, body);
}

// ── 02: Features ──
function gen02Features() {
  const features = [
    {
      icon: 'elementsFirst',
      title: 'Elements-first',
      tag: 'Core',
      desc:
        'Web Components as the surface. Shadow DOM and Declarative Shadow DOM remain the default render mode. Every component is a Custom Element.',
    },
    {
      icon: 'oneRenderer',
      title: 'One renderer',
      tag: 'Engine',
      desc:
        'JSX compiles to VNode IR. SSR, CSR, signals, and events share the same structural model — no duplicate render paths.',
    },
    {
      icon: 'appLifecycle',
      title: 'App lifecycle',
      tag: '@openelement/app',
      desc:
        'Route params, load context, redirect, not-found, and error fallback. Structured lifecycle with head management built in.',
    },
    {
      icon: 'trustedBoundary',
      title: 'Trusted boundary',
      tag: 'Security',
      desc:
        'HTML injection is explicit and reserved for pre-sanitized non-interactive content. No raw HTML by default.',
    },
    {
      icon: 'gateProven',
      title: 'Gate-proven',
      tag: 'CI/CD',
      desc:
        'AutoFlow3 guards every merge. Package graph validation, workflow slimming, and CI that fails fast.',
    },
    {
      icon: 'webStandards',
      title: 'Web standards',
      tag: 'Platform',
      desc:
        'Custom Elements, Shadow DOM, CSSStyleSheet, URL, fetch, and Web Streams at the center.',
    },
  ];
  const cardW = 400, cardH = 240, gap = 16;
  const gx = [80, 80 + cardW + gap, 80 + (cardW + gap) * 2];

  let body = nav({ active: 'Guide' }) +
    _t(80, 100, 'Why openElement', { size: 13, weight: 500, fill: T.brand, ls: '0.04em' }) +
    _t(80, 150, 'Static-first Web Components', { size: 40, weight: 600, ls: '-0.02em' }) +
    _t(80, 200, 'without duplicate render paths.', { size: 40, weight: 600, ls: '-0.02em' });

  features.forEach(function (f, i) {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = gx[col], cy = 260 + row * (cardH + gap);
    const d1 = f.desc.slice(0, 55), d2 = f.desc.slice(55, 110), d3 = f.desc.slice(110);
    body += '\n      <g id="feature-' + (i + 1) + '">' +
      card(cx, cy, cardW, cardH) +
      '<g transform="translate(' + (cx + 20) + ',' + (cy + 20) +
      ')"><g transform="scale(1.333)" color="' + T.brand + '">' +
      icons[f.icon] + '</g></g>' +
      _t(cx + 56, cy + 42, f.title, { size: 22, weight: 500 }) +
      badge(cx + cardW - 110, cy + 24, f.tag, { bg: T.brandGlow, color: T.brand, size: 11 }) +
      _t(cx + 24, cy + 80, d1, { size: 14, fill: T.textSecondary }) +
      _t(cx + 24, cy + 102, d2, { size: 14, fill: T.textSecondary }) +
      (d3 ? _t(cx + 24, cy + 124, d3, { size: 14, fill: T.textSecondary }) : '') +
      '</g>';
  });

  return svgWrap(1440, 860, body);
}

// ── 03: Full Homepage ──
function gen03Fullpage() {
  let body = nav({ active: 'Guide' });

  // HERO
  body += '<ellipse cx="720" cy="200" rx="600" ry="250" fill="' + T.brand + '" opacity="0.025" />' +
    // Eyebrow
    _t(80, 90, 'openelement 0.40.7 / v0.40.7 active', {
      size: 13,
      weight: 500,
      fill: T.brand,
      ls: '0.04em',
    }) +
    _t(80, 130, 'THE', { size: 80, weight: 600, ls: '-0.05em' }) +
    _t(80, 218, 'OPEN', { size: 80, weight: 600, ls: '-0.05em' }) +
    _t(318, 218, 'ELEMENT', { size: 80, weight: 600, fill: T.brand, ls: '-0.05em' }) +
    dot(688, 232) +
    _t(696, 242, 'Web Components, reimagined.', {
      size: 16,
      weight: 500,
      fill: T.brandPale,
      ls: '-0.01em',
    }) +
    _t(80, 312, 'A four-product Web Components platform. Elements, UI, App, and Core.', {
      size: 18,
      fill: T.textSecondary,
    }) +
    _t(80, 342, 'JSX pages, one VNode renderer, structured route lifecycle, explicit', {
      size: 18,
      fill: T.textSecondary,
    }) +
    _t(80, 372, 'trusted HTML boundaries, and island JavaScript.', {
      size: 18,
      fill: T.textSecondary,
    }) +
    btn(80, 420, 'Start building', { variant: 'primary', w: 158, h: 42, size: 15 }) +
    btn(254, 420, 'Read architecture', { variant: 'secondary', w: 174, h: 42, size: 15 });

  // Code panel (480px wide per spec)
  body += '<g transform="translate(760, 100)">' +
    rect(0, 0, 480, 300, { rx: 12, fill: T.surface1, stroke: T.border }) +
    line(6, 0, 474, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    _t(72, 24, 'app.tsx', { family: 'mono', size: 12, fill: T.textMuted }) +
    line(0, 40, 480, 40) +
    codeLine(20, 66, [
      { text: 'import', color: T.codeKeyword },
      { text: ' { definePage } ', color: T.textPrimary },
      { text: 'from', color: T.codeKeyword },
      { text: ' ', color: T.textPrimary },
      { text: "'@openelement/app'", color: T.codeString },
      { text: ';', color: T.textPrimary },
    ]) +
    codeLine(20, 92, [{ text: 'export default definePage({', color: T.textPrimary }]) +
    codeLine(20, 112, [{ text: '  route: { path: ', color: T.textPrimary }, {
      text: "'/'",
      color: T.codeString,
    }, { text: ' },', color: T.textPrimary }]) +
    codeLine(20, 132, [
      { text: '  render() { return <', color: T.textPrimary },
      { text: 'Page', color: T.codeTag },
      { text: '>Hello</', color: T.codeTag },
      { text: 'Page', color: T.codeTag },
      { text: '>; }', color: T.textPrimary },
    ]) +
    codeLine(20, 152, [{ text: '});', color: T.textPrimary }]) +
    '</g>';

  // FEATURES section simplified
  const fY = 530;
  const features = [
    { icon: 'elementsFirst', title: 'Elements-first', desc: 'Web Components as the surface.' },
    {
      icon: 'oneRenderer',
      title: 'One renderer',
      desc: 'JSX to VNode IR — SSR and CSR share one model.',
    },
    {
      icon: 'appLifecycle',
      title: 'App lifecycle',
      desc: 'Route params, load context, error fallback.',
    },
    {
      icon: 'trustedBoundary',
      title: 'Trusted boundary',
      desc: 'HTML injection is explicit and safe.',
    },
    { icon: 'gateProven', title: 'Gate-proven', desc: 'AutoFlow3 CI guards the 14-package line.' },
    { icon: 'webStandards', title: 'Web standards', desc: 'Custom Elements, fetch, Web Streams.' },
  ];
  const cardW = 400, cardH = 140, gap = 24;
  const gx = [80, 80 + cardW + gap, 80 + (cardW + gap) * 2];

  body += '<g id="features-section">' +
    _t(80, fY, 'Why openElement', { size: 13, weight: 500, fill: T.brand, ls: '0.04em' }) +
    _t(80, fY + 44, 'Static-first, one render pipeline.', { size: 40, weight: 600, ls: '-0.02em' });

  features.forEach(function (f, i) {
    const col = i % 3, row = Math.floor(i / 3);
    const cx = gx[col], cy = fY + 90 + row * (cardH + gap);
    body += '<g>' + card(cx, cy, cardW, cardH) +
      '<g transform="translate(' + (cx + 20) + ',' + (cy + 20) + ')" color="' + T.brand + '">' +
      icons[f.icon] + '</g>' +
      _t(cx + 52, cy + 38, f.title, { size: 20, weight: 500 }) +
      _t(cx + 20, cy + 72, f.desc, { size: 14, fill: T.textSecondary }) +
      _t(cx + 20, cy + 112, 'Learn more', { size: 13, weight: 500, fill: T.brand }) +
      inlineIcon('arrowRight', cx + 110, cy + 100, { size: 16, color: T.brand }) +
      '</g>';
  });
  body += '</g>';

  // SHOWCASE: package architecture
  const sY = 900;
  body += '<g id="showcase">' +
    rect(0, sY, W, 400, { fill: T.surface1, opacity: 0.3 }) +
    _t(80, sY + 40, 'Architecture', { size: 13, weight: 500, fill: T.brand, ls: '0.04em' }) +
    _t(80, sY + 80, 'How the packages fit together', { size: 36, weight: 600, ls: '-0.02em' });

  const nodes = [
    { x: 80, y: sY + 140, label: '@openelement/core', variant: 'surface', tag: 'VNode engine' },
    {
      x: 310,
      y: sY + 140,
      label: '@openelement/elements',
      variant: 'surface',
      tag: 'Custom Elements',
    },
    { x: 540, y: sY + 140, label: '@openelement/ui', variant: 'surface', tag: 'Components' },
    { x: 770, y: sY + 140, label: '@openelement/app', variant: 'brand', tag: 'App framework' },
    { x: 310, y: sY + 290, label: '@openelement/vnode', variant: 'elevated', tag: 'SSR + CSR' },
    { x: 770, y: sY + 290, label: '@openelement/cli', variant: 'elevated', tag: 'Tooling' },
  ];
  nodes.forEach(function (n) {
    body += archNode(n.x, n.y, n.label, { variant: n.variant, tag: n.tag });
  });
  body += archEdge(240, sY + 170, 310, sY + 170);
  body += archEdge(470, sY + 170, 540, sY + 170);
  body += archEdge(700, sY + 170, 770, sY + 170);
  body += archEdge(310, sY + 200, 310, sY + 290);
  body += archEdge(770, sY + 200, 770, sY + 290);
  body += '</g>';

  // CTA
  const cY = 1380;
  body += '<g id="cta">' +
    _t(80, cY, 'Ready to build with Web Standards?', { size: 40, weight: 600, ls: '-0.02em' }) +
    _t(80, cY + 56, 'Get started in 30 seconds.', { size: 20, fill: T.textSecondary }) +
    rect(80, cY + 96, 600, 42, { rx: 8, fill: T.surface2, stroke: T.border }) +
    _t(96, cY + 123, 'deno run -A jsr:@openelement/create my-app', { family: 'mono', size: 14 }) +
    btn(696, cY + 99, 'Copy', { variant: 'secondary', w: 72, h: 36, size: 13 }) +
    btn(80, cY + 162, 'Read the docs', { variant: 'primary', w: 158, h: 42, size: 15 }) +
    '</g>';

  body += footer(cY + 240);

  return svgWrap(1440, 1820, body);
}

// ── 04: Docs Landing ──
function gen04DocsLanding() {
  const docs = [
    {
      badge: 'Entry',
      title: 'Build an app',
      desc: 'Create a project, write DSD components, and ship a static site in under a minute.',
      link: '/guide/getting-started',
      icon: 'elementsFirst',
    },
    {
      badge: 'Concepts',
      title: 'Learn the engine',
      desc: 'Understand DSD rendering, island architecture, and the VNode pipeline.',
      link: '/architecture/dsd',
      icon: 'oneRenderer',
    },
    {
      badge: 'Integrate',
      title: 'Integrate packages',
      desc: 'Publish Web Components to the Hub and compose with existing libraries.',
      link: '/architecture/package-compatibility',
      icon: 'appLifecycle',
    },
    {
      badge: 'Contribute',
      title: 'Maintain openElement',
      desc: 'Read the package graph, ADR decisions, and contribution workflow.',
      link: '/architecture',
      icon: 'webStandards',
    },
  ];
  const cardW = 480, cardH = 190, gap = 16;
  const gx = [80, 80 + cardW + gap];

  let body = nav({ active: 'Guide' }) +
    _t(80, 96, 'Docs', { size: 56, weight: 600, ls: '-0.03em' }) +
    _t(80, 152, 'openElement documentation is organized around what you want to do.', {
      size: 18,
      fill: T.textSecondary,
    });

  // Search
  body += rect(80, 190, 560, 42, { rx: 8, fill: T.surface2, stroke: T.border }) +
    inlineIcon('search', 96, 199, { size: 20, color: T.textMuted }) +
    _t(124, 216, 'Search documentation...', { size: 14, fill: T.textMuted });

  docs.forEach(function (d, i) {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = gx[col], cy = 280 + row * (cardH + gap);
    body += '\n      <g id="doc-card-' + (i + 1) + '">' +
      card(cx, cy, cardW, cardH) +
      '<g transform="translate(' + (cx + 24) + ',' + (cy + 24) + ')" color="' + T.brand + '">' +
      icons[d.icon] + '</g>' +
      _t(cx + 56, cy + 42, d.title, { size: 22, weight: 500 }) +
      badge(cx + cardW - 130, cy + 24, d.badge, { bg: T.brandGlow, color: T.brand, size: 11 }) +
      _t(cx + 24, cy + 80, d.desc, { size: 14, fill: T.textSecondary }) +
      _t(cx + 24, cy + 142, 'Read docs', { size: 13, weight: 500, fill: T.brand }) +
      inlineIcon('arrowRight', cx + 110, cy + 130, { size: 16, color: T.brand }) +
      '</g>';
  });

  return svgWrap(1440, 600, body);
}

// ── 05: Design System (Gallery) ──
function gen05DesignSystem() {
  let body = nav();
  let y = 80;
  body += _t(80, y, 'Design System', { size: 56, weight: 600, ls: '-0.03em' }) +
    _t(80, y + 56, 'Two plates. Zero noise. Built on Linear-inspired tokens.', {
      size: 18,
      fill: T.textSecondary,
    });

  // COLOR GALLERY
  y = 210;
  body += _t(80, y, 'COLOR', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) +
    _t(80, y + 22, 'Dark Palette', { size: 24, weight: 600 });

  const swatches = [
    { label: 'Canvas', hex: T.canvas, c: T.textMuted, desc: 'Page bg' },
    { label: 'Surface 1', hex: T.surface1, c: T.textMuted, desc: 'Nav, panels' },
    { label: 'Surface 2', hex: T.surface2, c: T.textMuted, desc: 'Cards, code' },
    { label: 'Surface 3', hex: T.surface3, c: T.textMuted, desc: 'Elevated' },
    { label: 'Brand', hex: T.brand, c: '#ffffff', desc: 'Primary' },
    { label: 'Brand Light', hex: T.brandLight, c: '#ffffff', desc: 'Focus ring' },
    { label: 'Brand Pale', hex: T.brandPale, c: T.textInverse, desc: 'Subtle' },
  ];
  const sw = 136, sh = 90;
  let sx = 80;
  swatches.forEach(function (s) {
    body += rect(sx, y + 50, sw, sh, {
      rx: 10,
      fill: s.hex,
      stroke: s.hex === T.canvas ? T.border : 'none',
    }) +
      _t(sx + 14, y + 106, s.label, { size: 12, weight: 500, fill: s.c }) +
      _t(sx + 14, y + 122, s.hex, {
        size: 11,
        fill: s.c === '#ffffff' ? 'rgba(255,255,255,0.7)' : T.textMuted,
        family: 'mono',
      }) +
      _t(sx + 14, y + 135, s.desc, {
        size: 10,
        fill: s.c === '#ffffff' ? 'rgba(255,255,255,0.5)' : T.textMuted,
      });
    sx += sw + 12;
  });

  // Light Palette
  y = 370;
  const lightSwatches = [
    { label: 'Canvas', hex: lc.canvas.value, c: T.textInverse, desc: 'Page bg' },
    { label: 'Surface 1', hex: lc['surface-1'].value, c: T.textInverse, desc: 'Nav, panels' },
    { label: 'Surface 2', hex: lc['surface-2'].value, c: T.textInverse, desc: 'Cards, code' },
    { label: 'Surface 3', hex: lc['surface-3'].value, c: T.textInverse, desc: 'Elevated' },
    { label: 'Brand', hex: lc.brand.value, c: '#ffffff', desc: 'Primary' },
    { label: 'Brand Light', hex: lc['brand-light'].value, c: '#ffffff', desc: 'Focus ring' },
  ];
  body += _t(80, y, 'LIGHT PALETTE', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) +
    _t(80, y + 22, 'Light Palette', { size: 24, weight: 600 });
  sx = 80;
  lightSwatches.forEach(function (s) {
    body += rect(sx, y + 50, sw, sh, {
      rx: 10,
      fill: s.hex,
      stroke: s.hex === lc.canvas.value ? T.border : 'none',
    }) +
      _t(sx + 14, y + 106, s.label, { size: 12, weight: 500, fill: s.c }) +
      _t(sx + 14, y + 122, s.hex, {
        size: 11,
        fill: s.c === '#ffffff' ? 'rgba(255,255,255,0.7)' : T.textMuted,
        family: 'mono',
      }) +
      _t(sx + 14, y + 135, s.desc, {
        size: 10,
        fill: s.c === '#ffffff' ? 'rgba(255,255,255,0.5)' : T.textMuted,
      });
    sx += sw + 12;
  });

  // Semantic colors
  y = 560;
  body += _t(80, y, 'SEMANTIC', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) +
    _t(80, y + 22, 'Status Colors', { size: 24, weight: 600 });
  const statuses = [
    { label: 'Success', hex: T.success, bg: T.successBg, color: T.success },
    { label: 'Error', hex: T.error, bg: T.errorBg, color: T.error },
    { label: 'Warning', hex: T.warning, bg: T.warningBg, color: T.warning },
    { label: 'Info', hex: T.info, bg: T.infoBg, color: T.info },
    { label: 'Purple', hex: T.purple, bg: T.purpleBg, color: T.purple },
    { label: 'Rose', hex: T.rose, bg: T.roseBg, color: T.rose },
  ];
  sx = 80;
  statuses.forEach(function (s) {
    body += rect(sx, y + 50, sw, sh, { rx: 10, fill: s.bg, stroke: T.border }) +
      circle(sx + sw / 2, y + 72, 18, { fill: s.hex }) +
      _t(sx + sw / 2, y + 112, s.label, { size: 12, weight: 500, fill: s.color, ta: 'middle' }) +
      _t(sx + sw / 2, y + 128, s.hex, {
        size: 10,
        fill: T.textMuted,
        ta: 'middle',
        family: 'mono',
      });
    sx += sw + 12;
  });

  // TYPOGRAPHY GALLERY
  y = 740;
  body += _t(80, y, 'TYPOGRAPHY', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) +
    _t(80, y + 22, 'Type Scale', { size: 24, weight: 600 }) +
    rect(80, y + 48, 1280, 340, { rx: 12, fill: T.surface2, stroke: T.border }) +
    line(86, y + 48, 1354, y + 48, { stroke: T.edge }) +
    _t(104, y + 100, 'Display XL', { size: 80, weight: 600, ls: '-0.04em' }) +
    _t(104, y + 148, '80px / 600 / -0.04em / 0.95', {
      size: 12,
      fill: T.textMuted,
      family: 'mono',
    }) +
    _t(104, y + 188, 'Display MD', { size: 40, weight: 600, ls: '-0.02em' }) +
    _t(104, y + 208, '40px / 600 / -0.02em / 1.05', {
      size: 12,
      fill: T.textMuted,
      family: 'mono',
    }) +
    _t(104, y + 250, 'Card Title', { size: 22, weight: 500 }) +
    _t(
      104,
      y + 272,
      'Body — Inter. Body SM is 14px used for descriptions and footer links. Note the generous line-height.',
      { size: 14, fill: T.textSecondary },
    ) +
    _t(104, y + 300, 'EYEBROW LABEL', { size: 13, weight: 500, fill: T.brand, ls: '0.04em' }) +
    _t(104, y + 326, 'const foo: Type = "monospace"', { size: 13, fill: T.codeFn, family: 'mono' });

  // COMPONENT GALLERY
  y = 1170;
  body += _t(80, y, 'COMPONENTS', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) +
    _t(80, y + 22, 'Component Gallery', { size: 24, weight: 600 });

  // Button row
  body += rect(80, y + 48, 620, 100, { rx: 12, fill: T.surface2, stroke: T.border }) +
    _t(104, y + 70, 'Button', { size: 16, weight: 500 }) +
    _t(104, y + 92, 'Primary · Secondary · Tertiary · Inverse', { size: 12, fill: T.textMuted }) +
    btn(104, y + 104, 'Primary', { variant: 'primary', w: 100, h: 32, size: 13 }) +
    btn(218, y + 104, 'Secondary', { w: 100, h: 32, size: 13 }) +
    _t(332, y + 123, 'Tertiary', { size: 13, weight: 500, fill: T.textSecondary }) +
    rect(410, y + 104, 90, 32, { rx: 8, fill: '#ffffff' }) +
    _t(455, y + 125, 'Inverse', { size: 13, weight: 500, fill: T.canvas, ta: 'middle' });

  // Badge row
  body += rect(720, y + 48, 640, 100, { rx: 12, fill: T.surface2, stroke: T.border }) +
    _t(744, y + 70, 'Badge', { size: 16, weight: 500 }) +
    _t(744, y + 92, 'Pill variants with semantic colors', { size: 12, fill: T.textMuted }) +
    badge(744, y + 104, 'Default', { bg: T.surface3, color: T.textSecondary, size: 11 }) +
    badge(830, y + 104, 'New', { bg: T.brandGlow, color: T.brand, size: 11 }) +
    badge(896, y + 104, 'Success', { bg: T.successBg, color: T.success, size: 11 }) +
    badge(982, y + 104, 'Error', { bg: T.errorBg, color: T.error, size: 11 });

  // Card + Input
  y = 1350;
  body += rect(80, y, 620, 90, { rx: 12, fill: T.surface2, stroke: T.border }) +
    _t(104, y + 28, 'Card', { size: 16, weight: 500 }) +
    rect(104, y + 44, 130, 30, { rx: 8, fill: T.surface3, stroke: T.border }) +
    _t(169, y + 64, 'Default', { size: 13, fill: T.textSecondary, ta: 'middle' }) +
    rect(250, y + 44, 130, 30, { rx: 8, fill: T.surface3, stroke: T.borderHover }) +
    _t(315, y + 64, 'Hover', { size: 13, fill: T.textSecondary, ta: 'middle' }) +
    rect(396, y + 44, 130, 30, { rx: 8, fill: T.surface3, stroke: T.brand, sw: 1.5 }) +
    _t(461, y + 64, 'Selected', { size: 13, weight: 500, ta: 'middle' });

  body += rect(720, y, 640, 90, { rx: 12, fill: T.surface2, stroke: T.border }) +
    _t(744, y + 28, 'Input', { size: 16, weight: 500 }) +
    rect(744, y + 44, 200, 30, { rx: 8, fill: T.surface1, stroke: T.border }) +
    _t(756, y + 63, 'placeholder', { size: 13, fill: T.textMuted }) +
    rect(960, y + 44, 200, 30, { rx: 8, fill: T.surface1, stroke: T.brand, sw: 1.5 }) +
    _t(972, y + 63, 'Focus state', { size: 13 });

  // Radii
  y += 140;
  body += _t(80, y, 'SPATIAL', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) +
    _t(80, y + 22, 'Radii', { size: 24, weight: 600 }) +
    rect(80, y + 48, 640, 70, { rx: 12, fill: T.surface2, stroke: T.border });
  const radiuses = [
    { r: 4, l: '4px' },
    { r: 6, l: '6px' },
    { r: 8, l: '8px' },
    { r: 12, l: '12px' },
    { r: 16, l: '16px' },
    { r: 9999, l: 'pill' },
  ];
  let rx = 104;
  radiuses.forEach(function (r) {
    body += rect(rx, y + 60, 80, 46, { rx: r.r, fill: T.surface3, stroke: T.borderHover }) +
      _t(rx + 40, y + 76, r.l, { size: 11, fill: T.textSecondary, ta: 'middle' });
    rx += 100;
  });

  // ICONS
  y += 155;
  body += _t(80, y, 'ICONOGRAPHY', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) +
    _t(80, y + 22, 'Icons', { size: 24, weight: 600 }) +
    rect(80, y + 48, 1280, 80, { rx: 12, fill: T.surface2, stroke: T.border });
  const iNames = [
    'search',
    'calendar',
    'clock',
    'tag',
    'arrowRight',
    'terminal',
    'check',
    'file',
    'folder',
    'package',
    'bookmark',
    'zap',
  ];
  let ix = 104;
  iNames.forEach(function (n) {
    body += inlineIcon(n, ix, y + 62, { size: 22, color: T.textSecondary }) +
      _t(ix + 44, y + 93, n, { size: 10, fill: T.textMuted, ta: 'middle' });
    ix += 98;
  });

  // INSTALLATION
  y += 160;
  body += _t(80, y, 'INSTALLATION', { size: 11, weight: 500, fill: T.textMuted, ls: '0.08em' }) +
    _t(80, y + 22, 'Installation', { size: 24, weight: 600 }) +
    '<g transform="translate(80,' + (y + 50) + ')">' +
    rect(0, 0, 600, 70, { rx: 10, fill: T.surface1, stroke: T.border }) +
    line(6, 0, 594, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    _t(72, 24, 'Terminal', { family: 'mono', size: 12, fill: T.textMuted }) +
    line(0, 40, 600, 40) +
    _t(20, 64, '$', { family: 'mono', size: 13, fill: T.success }) +
    _t(34, 64, ' deno add jsr:@openelement/ui', { family: 'mono', size: 13, fill: T.textPrimary }) +
    btn(490, 18, 'Copy', { variant: 'secondary', w: 72, h: 32, size: 12 }) +
    '</g>' +
    _t(80, y + 146, 'Deno, Node, Bun. Zero config.', { size: 14, fill: T.textSecondary });

  return svgWrap(1440, y + 180, body);
}
// ── 06: Guide Page ──
function gen06GuidePage() {
  const sidebarSections = [
    {
      heading: 'Getting Started',
      items: [
        { label: 'Introduction', active: false },
        { label: 'Installation', active: false },
        { label: 'Quick start', active: true, badge: '5 min' },
        { label: 'Project structure', active: false },
      ],
    },
    {
      heading: 'Core Concepts',
      items: [
        { label: 'DSD Rendering', active: false },
        { label: 'JSX & VNode', active: false },
        { label: 'Routing', active: false },
        { label: 'Head management', active: false },
        { label: 'Trusted types', active: false, badge: 'new' },
      ],
    },
    {
      heading: 'Components',
      items: [
        { label: 'Custom Elements', active: false },
        { label: 'Shadow DOM', active: false },
        { label: 'CSSStyleSheet', active: false },
        { label: 'Island JS', active: false },
      ],
    },
    {
      heading: 'Deployment',
      items: [
        { label: 'Static export', active: false },
        { label: 'Deno Deploy', active: false },
        { label: 'Cloudflare', active: false },
      ],
    },
  ];

  let body = nav({ active: 'Guide' });
  body += sidebarNav(64, 80, sidebarSections);

  const mx = 280, cw = 780;
  body += _t(mx, 100, 'Quick Start', { size: 40, weight: 600, ls: '-0.02em' }) +
    _t(mx, 148, 'Build your first openElement app in under a minute.', {
      size: 18,
      fill: T.textSecondary,
    });

  // Meta bar
  body += rect(mx, 184, cw, 36, { rx: 8, fill: T.surface2, stroke: T.border }) +
    inlineIcon('clock', mx + 16, 190, { size: 16, color: T.textMuted }) +
    _t(mx + 40, 207, '5 min read', { size: 13, fill: T.textMuted }) +
    inlineIcon('calendar', mx + 140, 190, { size: 16, color: T.textMuted }) +
    _t(mx + 164, 207, 'Updated June 2026', { size: 13, fill: T.textMuted });

  let py = 250;
  body += _t(mx, py, 'Step 1 — Scaffold', { size: 24, weight: 500 }) + '\n';
  py += 40;
  body += _t(
    mx,
    py,
    'Run the project generator with Deno. It creates a fully structured app with routing, DSD rendering, and TypeScript configured.',
    { size: 15, fill: T.textSecondary },
  ) + '\n';

  py += 40;
  // Terminal
  body += '<g transform="translate(' + mx + ',' + py + ')">' +
    rect(0, 0, cw, 100, { rx: 10, fill: T.surface1, stroke: T.border }) +
    line(6, 0, cw - 6, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    _t(72, 24, 'Terminal', { family: 'mono', size: 12, fill: T.textMuted }) +
    line(0, 40, cw, 40) +
    _t(20, 66, '$', { family: 'mono', size: 13, fill: T.success }) +
    _t(34, 66, ' deno run -A jsr:@openelement/create my-app', {
      family: 'mono',
      size: 13,
      fill: T.textPrimary,
    }) +
    _t(20, 88, 'Creating project in ./my-app... done', {
      family: 'mono',
      size: 13,
      fill: T.textMuted,
    }) +
    '</g>';

  py += 130;
  body += _t(mx, py, 'Step 2 — Your first page', { size: 24, weight: 500 }) + '\n';
  py += 40;
  body += _t(
    mx,
    py,
    'Each page is a function that returns JSX. openElement compiles to VNode IR and renders via DSD.',
    { size: 15, fill: T.textSecondary },
  ) + '\n';

  py += 36;
  // Code block
  body += '<g transform="translate(' + mx + ',' + py + ')">' +
    rect(0, 0, cw, 260, { rx: 10, fill: T.surface1, stroke: T.border }) +
    line(6, 0, cw - 6, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    _t(72, 24, 'pages/index.tsx', { family: 'mono', size: 12, fill: T.textMuted }) +
    line(0, 40, cw, 40) +
    codeLine(20, 66, [
      { text: 'import', color: T.codeKeyword },
      { text: ' { definePage } from ', color: T.textPrimary },
      { text: "'@openelement/app'", color: T.codeString },
      { text: ';', color: T.textPrimary },
    ]) +
    codeLine(20, 92, [{ text: 'export default definePage({', color: T.textPrimary }]) +
    codeLine(20, 112, [{ text: '  route: { path: ', color: T.textPrimary }, {
      text: "'/'",
      color: T.codeString,
    }, { text: ' },', color: T.textPrimary }]) +
    codeLine(20, 132, [
      { text: '  head: () => <', color: T.textPrimary },
      { text: 'title', color: T.codeTag },
      { text: '>My App</', color: T.codeTag },
      { text: 'title', color: T.codeTag },
      { text: '>,', color: T.textPrimary },
    ]) +
    codeLine(20, 158, [{ text: '  render() {', color: T.textPrimary }]) +
    codeLine(20, 178, [
      { text: '    return <', color: T.codeTag },
      { text: 'main', color: T.codeTag },
      { text: '><', color: T.codeTag },
      { text: 'h1', color: T.codeTag },
      { text: '>Hello openElement</', color: T.codeTag },
      { text: 'h1', color: T.codeTag },
      { text: '></', color: T.codeTag },
      { text: 'main', color: T.codeTag },
      { text: '>;', color: T.textPrimary },
    ]) +
    codeLine(20, 198, [{ text: '  },', color: T.textPrimary }]) +
    codeLine(20, 218, [{ text: '});', color: T.textPrimary }]) +
    '</g>';

  py += 300;
  body += _t(mx, py, 'Step 3 — Run the dev server', { size: 24, weight: 500 }) + '\n';
  py += 40;
  body += _t(mx, py, 'open', { size: 15, fill: T.textSecondary }) +
    _t(mx + 36, py, 'http://localhost:8000', { size: 15, fill: T.brand, family: 'mono' }) +
    _t(mx + 220, py, 'to see your app live.', { size: 15, fill: T.textSecondary }) + '\n';

  py += 36;
  body += '<g transform="translate(' + mx + ',' + py + ')">' +
    rect(0, 0, cw, 70, { rx: 10, fill: T.surface1, stroke: T.border }) +
    line(6, 0, cw - 6, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    line(0, 40, cw, 40) +
    _t(20, 64, '$', { family: 'mono', size: 13, fill: T.success }) +
    _t(34, 64, ' deno task dev', { family: 'mono', size: 13, fill: T.textPrimary }) +
    '</g>';

  // TOC
  body += pageTOC(1160, 100, [
    'Step 1 — Scaffold',
    'Step 2 — Your first page',
    'Step 3 — Run the dev server',
    'Next steps',
  ]);

  py += 100;
  body += line(mx, py, mx + cw, py, { stroke: T.border }) +
    _t(mx, py + 28, '← Introduction', { size: 14, weight: 500, fill: T.textSecondary }) +
    _t(mx + cw - 100, py + 28, 'Project Structure →', {
      size: 14,
      weight: 500,
      fill: T.brand,
      ta: 'end',
    });

  return svgWrap(1440, py + 70, body);
}

// ── 07: Architecture Page ──
function gen07Architecture() {
  const sidebarSections = [
    {
      heading: 'Architecture',
      items: [
        { label: 'Overview', active: true },
        { label: 'Package graph', active: false },
        { label: 'DSD Rendering', active: false },
        { label: 'VNode pipeline', active: false, badge: 'deep' },
        { label: 'Island JS', active: false },
        { label: 'Trust model', active: false },
      ],
    },
    {
      heading: 'ADR',
      items: [
        { label: 'ADR-001: JSX', active: false },
        { label: 'ADR-002: DSD', active: false },
        { label: 'ADR-003: Signals', active: false },
      ],
    },
  ];

  let body = nav({ active: 'Architecture' });
  body += sidebarNav(64, 80, sidebarSections);

  const mx = 280, cw = 780;
  body += _t(mx, 100, 'Architecture Overview', { size: 40, weight: 600, ls: '-0.02em' }) +
    _t(mx, 152, 'How the 14 packages compose into a Web Components platform.', {
      size: 18,
      fill: T.textSecondary,
    });

  // Package graph diagram
  let py = 200;
  body += rect(mx, py, cw, 380, { rx: 12, fill: T.surface2, stroke: T.border }) +
    _t(mx + 24, py + 24, 'Package Graph', { size: 16, weight: 500 }) +
    _t(mx + 24, py + 46, '14 packages with clean dependency boundaries.', {
      size: 13,
      fill: T.textMuted,
    });

  const gx = mx + 40, gy = py + 70;
  body += archNode(gx, gy, 'types', { variant: 'surface', tag: '@openelement' }) +
    archNode(gx + 200, gy, 'jsx', { variant: 'surface', tag: '@openelement' }) +
    archNode(gx - 40, gy + 100, 'vnode', { variant: 'surface', tag: '@openelement' }) +
    archNode(gx + 160, gy + 100, 'signals', { variant: 'surface', tag: '@openelement' }) +
    archEdge(gx + 80, gy + 60, gx + 40, gy + 100) +
    archEdge(gx + 280, gy + 60, gx + 240, gy + 100) +
    archNode(gx + 60, gy + 200, 'core', { variant: 'elevated', tag: 'VNode engine' }) +
    archEdge(gx + 40, gy + 160, gx + 140, gy + 200) +
    archEdge(gx + 240, gy + 160, gx + 140, gy + 200) +
    archNode(gx - 100, gy + 300, 'elements', { variant: 'surface', tag: 'Custom Elements' }) +
    archNode(gx + 60, gy + 300, 'ui', { variant: 'surface', tag: 'Components' }) +
    archNode(gx + 220, gy + 300, 'app', { variant: 'brand', tag: 'App framework' }) +
    archEdge(gx + 140, gy + 260, gx - 20, gy + 300) +
    archEdge(gx + 140, gy + 260, gx + 140, gy + 300) +
    archEdge(gx + 140, gy + 260, gx + 300, gy + 300);

  // Pipeline below
  py = 620;
  body += _t(mx, py, 'Render Pipeline', { size: 24, weight: 500 }) + '\n';
  py += 34;
  body += _t(
    mx,
    py,
    'openElement renders pages at build time via Declarative Shadow DOM. No JavaScript needed for initial paint.',
    { size: 15, fill: T.textSecondary },
  ) + '\n';

  py += 36;
  body += '<g transform="translate(' + mx + ',' + py + ')">' +
    rect(0, 0, cw, 120, { rx: 12, fill: T.surface2, stroke: T.border }) +
    line(6, 0, cw - 6, 0, { stroke: T.edge });
  const stages = ['JSX', 'VNode IR', 'DSD String', 'Shadow DOM'];
  let bx = 40;
  stages.forEach(function (s, si) {
    body += rect(bx, 40, 140, 46, {
      rx: 8,
      fill: si === 0 ? T.brand : T.surface3,
      stroke: si === 0 ? T.brand : T.border,
    }) +
      _t(bx + 70, 68, s, {
        size: 14,
        weight: 500,
        fill: si === 0 ? '#ffffff' : T.textPrimary,
        ta: 'middle',
      });
    if (si < 3) body += _t(bx + 146, 68, '→', { size: 18, fill: T.textMuted });
    bx += 172;
  });
  body += _t(40, 108, 'SSR and CSR share the same VNode IR. No duplicate render paths.', {
    size: 13,
    fill: T.textMuted,
  }) +
    '</g>';

  py += 170;
  body += _t(mx, py, 'Trust Model', { size: 24, weight: 500 }) + '\n';
  py += 34;
  body += _t(
    mx,
    py,
    'openElement enforces Trusted Types at the framework boundary. Raw HTML strings cannot be injected without explicit sanitization.',
    { size: 15, fill: T.textSecondary },
  ) + '\n';

  py += 36;
  body += '<g transform="translate(' + mx + ',' + py + ')">' +
    rect(0, 0, cw, 60, { rx: 8, fill: T.surface2, stroke: T.border }) +
    codeLine(20, 28, [{
      text: '// ❌ TypeScript error — no raw HTML allowed',
      color: T.codeComment,
    }]) +
    codeLine(20, 48, [{ text: 'element.innerHTML = userInput; ', color: T.textPrimary }, {
      text: '// TypeError',
      color: T.error,
    }]) +
    '</g>';

  body += pageTOC(1160, 100, [
    'Package graph',
    'Render pipeline',
    'Trust model',
    'Island hydration',
  ]);

  return svgWrap(1440, py + 130, body);
}

// ── 08: Blog Index ──
function gen08BlogIndex() {
  let body = nav({ active: 'Blog' }) +
    _t(80, 100, 'Blog', { size: 52, weight: 600, ls: '-0.03em' }) +
    _t(80, 156, 'Engineering notes from the openElement team.', {
      size: 18,
      fill: T.textSecondary,
    });

  // Featured article
  body += rect(80, 210, 1280, 260, { rx: 14, fill: T.surface2, stroke: T.border }) +
    line(86, 210, 1354, 210, { stroke: T.edge }) +
    rect(80, 210, 460, 260, { rx: 14, fill: T.surface3 }) +
    rect(80, 450, 460, 20, { fill: T.surface2 }) +
    _t(560, 244, 'FEATURED', { size: 11, weight: 500, fill: T.brand, ls: '0.06em' }) +
    badge(672, 240, 'Architecture', { bg: T.brandGlow, color: T.brand, size: 11 }) +
    _t(560, 300, 'How DSD Rendering Eliminates FOUC', { size: 34, weight: 600, ls: '-0.02em' }) +
    _t(
      560,
      358,
      'Declarative Shadow DOM renders Web Components on the server, so the browser paints',
      { size: 15, fill: T.textSecondary },
    ) +
    _t(560, 382, 'them before JavaScript even loads. Here is how the pipeline works.', {
      size: 15,
      fill: T.textSecondary,
    }) +
    _t(560, 432, 'Sarah Chen · Jun 12, 2026 · 8 min read', { size: 14, fill: T.textMuted });

  // Article list
  const articles = [
    {
      tag: 'Release',
      title: 'openElement 0.40 — DSD Islands, AutoFlow3, CLI',
      desc: 'The v0.40 release ships declarative shadow DOM islands, AutoFlow3 CI, and a new CLI.',
      date: 'Jun 8, 2026',
      author: 'Mike Ross',
      readTime: '6 min read',
    },
    {
      tag: 'Engineering',
      title: 'Building a Package Graph Validator in 120 Lines',
      desc:
        'AutoFlow3 validates inter-package dependencies before merge. How the graph validator catches violations.',
      date: 'May 28, 2026',
      author: 'Sarah Chen',
      readTime: '10 min read',
    },
    {
      tag: 'Tutorial',
      title: 'From Zero to Web Component in 60 Seconds',
      desc: 'Scaffold, write a DSD component, and ship to production — all in under a minute.',
      date: 'May 15, 2026',
      author: 'Alex Kim',
      readTime: '5 min read',
    },
    {
      tag: 'Design',
      title: "Why We Chose Linear's Design Language",
      desc:
        'No decorative shadows. Hairline borders. Edge highlights. A design system for clarity.',
      date: 'Apr 22, 2026',
      author: 'Mike Ross',
      readTime: '7 min read',
    },
  ];

  articles.forEach(function (a, i) {
    body += articleCard(80, 510 + i * 184, 1280, {
      title: a.title,
      desc: a.desc,
      date: a.date,
      tag: a.tag,
      author: a.author,
      readTime: a.readTime,
    });
  });

  return svgWrap(1440, 510 + articles.length * 184 + 60, body);
}

// ── 09: Blog Post ──
function gen09BlogPost() {
  let body = nav({ active: 'Blog' });
  const mx = 300, cw = 680;

  body += badge(mx, 96, 'Architecture', { bg: T.brandGlow, color: T.brand, size: 11 }) +
    _t(mx, 140, 'How DSD Rendering Eliminates FOUC', { size: 44, weight: 600, ls: '-0.03em' }) +
    _t(
      mx,
      210,
      'Declarative Shadow DOM renders Web Components on the server, so the browser paints them before JavaScript loads.',
      { size: 19, fill: T.textSecondary },
    );

  // Author row
  body += circle(mx, 268, 16, { fill: T.brand }) +
    _t(mx + 40, 278, 'Sarah Chen', { size: 14, weight: 500 }) +
    _t(mx + 140, 278, '· Jun 12, 2026 · 8 min read', { size: 14, fill: T.textMuted }) +
    badge(mx + 370, 268, 'DSD', { bg: T.surface3, color: T.textSecondary, size: 11 }) +
    badge(mx + 426, 268, 'Web Components', { bg: T.surface3, color: T.textSecondary, size: 11 }) +
    badge(mx + 568, 268, 'performance', { bg: T.surface3, color: T.textSecondary, size: 11 });

  body += line(mx, 312, mx + cw, 312, { stroke: T.border });

  let py = 340;
  body += _t(
    mx,
    py,
    "FOUC — the Flash of Unstyled Content — has been the web's most persistent rendering problem since Web Components were introduced. Custom elements need JavaScript to define themselves. Until that script loads and executes, the browser displays unknown HTML tags as generic inline elements.",
    { size: 16, fill: T.textSecondary, lh: '1.7' },
  );

  py += 120;
  body += _t(mx, py, 'The Problem', { size: 26, weight: 600 }) + '\n';
  py += 40;
  body += _t(mx, py, 'Traditional Web Components follow this path:', {
    size: 16,
    fill: T.textSecondary,
  }) + '\n';

  py += 40;
  body += '<g transform="translate(' + mx + ',' + py + ')">' +
    rect(0, 0, cw, 56, { rx: 8, fill: T.surface2, stroke: T.border }) +
    _t(20, 22, '1. Browser parses <my-element> as unknown inline element', {
      family: 'mono',
      size: 13,
      fill: T.textSecondary,
    }) +
    _t(20, 42, '2. JS defines the class → browser upgrades → FOUC on slow connections', {
      family: 'mono',
      size: 13,
      fill: T.textSecondary,
    }) +
    '</g>';

  py += 90;
  body += _t(mx, py, 'The Solution: Declarative Shadow DOM', { size: 26, weight: 600 }) + '\n';
  py += 40;
  body += _t(
    mx,
    py,
    'DSD flips the model. Instead of waiting for JavaScript, the shadow DOM structure is declared in the HTML itself using the shadowrootmode attribute.',
    { size: 16, fill: T.textSecondary },
  ) + '\n';

  py += 36;
  body += '<g transform="translate(' + mx + ',' + py + ')">' +
    rect(0, 0, cw, 150, { rx: 10, fill: T.surface1, stroke: T.border }) +
    line(6, 0, cw - 6, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    _t(72, 24, 'output.html', { family: 'mono', size: 12, fill: T.textMuted }) +
    line(0, 40, cw, 40) +
    codeLine(20, 66, [{ text: '<', color: T.codeTag }, { text: 'my-counter', color: T.codeTag }, {
      text: '>',
      color: T.codeTag,
    }]) +
    codeLine(20, 86, [
      { text: '  <', color: T.codeTag },
      { text: 'template', color: T.codeTag },
      { text: ' shadowrootmode=', color: T.codeVar },
      { text: '"open"', color: T.codeString },
      { text: '>', color: T.codeTag },
    ]) +
    codeLine(20, 106, [
      { text: '    <', color: T.codeTag },
      { text: 'button', color: T.codeTag },
      { text: '>Count: 0</', color: T.codeTag },
      { text: 'button', color: T.codeTag },
      { text: '>', color: T.codeTag },
    ]) +
    codeLine(20, 126, [{ text: '  </', color: T.codeTag }, { text: 'template', color: T.codeTag }, {
      text: '>',
      color: T.codeTag,
    }]) +
    codeLine(20, 146, [{ text: '</', color: T.codeTag }, { text: 'my-counter', color: T.codeTag }, {
      text: '>',
      color: T.codeTag,
    }]) +
    '</g>';

  py += 190;
  body += _t(
    mx,
    py,
    'openElement generates DSD output at build time. Every page is pre-rendered to static HTML with full shadow DOM structure. JavaScript upgrades happen asynchronously via islands — only interactive bits hydrate.',
    { size: 16, fill: T.textSecondary, lh: '1.7' },
  );

  body += pageTOC(1080, 100, [
    'The problem',
    'Why FOUC matters',
    'DSD explained',
    'Build-time generation',
    'Island hydration',
  ]);

  return svgWrap(1440, py + 120, body);
}

// ── 10: Changelog ──
function gen10Changelog() {
  let body = nav({ active: 'Changelog' }) +
    _t(80, 100, 'Changelog', { size: 52, weight: 600, ls: '-0.03em' }) +
    _t(80, 156, 'Every release, every change. Keeping the 14-package line honest.', {
      size: 18,
      fill: T.textSecondary,
    });

  const releases = [
    {
      version: 'v0.40.7',
      date: 'June 14, 2026',
      type: 'latest',
      title: 'Package graph fix + workflow improvements',
      desc:
        'Fixed a circular dependency detection in AutoFlow3. Slimmed CI workflow from 18 to 8 jobs.',
      dot: T.brand,
      bc: T.brand,
      bb: T.brandGlow,
    },
    {
      version: 'v0.40.6',
      date: 'June 10, 2026',
      type: 'patch',
      title: 'DSD attribute serialization fix',
      desc:
        'Fixed boolean attribute handling in DSD output. Boolean attributes now serialize correctly.',
      dot: T.textMuted,
      bc: T.textMuted,
      bb: T.surface3,
    },
    {
      version: 'v0.40.0',
      date: 'June 1, 2026',
      type: 'minor',
      title: 'DSD Islands, AutoFlow3, new CLI',
      desc: 'Major release. DSD islands with selective hydration. AutoFlow3 CI pipeline. New CLI.',
      dot: T.success,
      bc: T.success,
      bb: T.successBg,
    },
    {
      version: 'v0.39.2',
      date: 'May 15, 2026',
      type: 'patch',
      title: 'Signal subscription memory fix',
      desc: 'Fixed a memory leak in signal subscriptions when components unmount.',
      dot: T.textMuted,
      bc: T.textMuted,
      bb: T.surface3,
    },
    {
      version: 'v0.39.0',
      date: 'April 28, 2026',
      type: 'minor',
      title: 'Trusted Types enforcement',
      desc:
        'All HTML injection paths now require TrustedHTML objects. Added @openelement/sanitize package.',
      dot: T.success,
      bc: T.success,
      bb: T.successBg,
    },
    {
      version: 'v0.38.1',
      date: 'April 10, 2026',
      type: 'patch',
      title: 'CSSStyleSheet adopt fix',
      desc: 'Fixed CSSStyleSheet adoption in shadow roots for nested components.',
      dot: T.textMuted,
      bc: T.textMuted,
      bb: T.surface3,
    },
  ];

  const tlx = 320;
  releases.forEach(function (r, i) {
    body += timelineItem(tlx, 230 + i * 150, 860, {
      version: r.version,
      date: r.date,
      title: r.title,
      desc: r.desc,
      badgeColor: r.bc,
      badgeBg: r.bb,
      dotColor: r.dot,
    });
  });

  return svgWrap(1440, 230 + releases.length * 150 + 60, body);
}
// ── 11: Contributing ──
function gen11Contributing() {
  const sidebarSections = [
    {
      heading: 'Contributing',
      items: [
        { label: 'Overview', active: true },
        { label: 'Code of Conduct', active: false },
        { label: 'Development setup', active: false },
        { label: 'Pull requests', active: false, badge: 'required' },
        { label: 'Testing', active: false },
        { label: 'Documentation', active: false },
      ],
    },
    {
      heading: 'Packages',
      items: [
        { label: 'Package graph', active: false },
        { label: 'Adding a package', active: false },
        { label: 'Breaking changes', active: false },
      ],
    },
  ];

  let body = nav({ active: 'Guide' });
  body += sidebarNav(64, 80, sidebarSections);

  const mx = 280, cw = 780;
  body += _t(mx, 100, 'Contributing to openElement', { size: 40, weight: 600, ls: '-0.02em' }) +
    _t(mx, 148, 'Help us build the open Web Components platform.', {
      size: 18,
      fill: T.textSecondary,
    });

  let py = 200;
  body += _t(mx, py, 'Before you start', { size: 22, weight: 500 }) + '\n';
  py += 30;
  body += _t(
    mx,
    py,
    'openElement is a 14-package monorepo with strict dependency boundaries enforced by AutoFlow3. All contributions go through the same CI pipeline that guards production releases.',
    { size: 15, fill: T.textSecondary },
  ) + '\n';

  const steps = [
    {
      num: '1',
      title: 'Fork & clone',
      desc: 'Fork the repo, clone locally. Development on feature branches.',
    },
    {
      num: '2',
      title: 'Run the setup',
      desc: 'deno task setup installs hooks, checks the package graph.',
    },
    {
      num: '3',
      title: 'Create a branch',
      desc: 'Branch naming: feat/, fix/, docs/, chore/. AutoFlow3 validates.',
    },
    {
      num: '4',
      title: 'Write & test',
      desc: 'Write code, add tests. Run deno task repo:hygiene before committing.',
    },
    {
      num: '5',
      title: 'Open a PR',
      desc: 'PRs must pass AutoFlow3 — graph check, lint, fmt, audit, coverage.',
    },
  ];

  py += 36;
  steps.forEach(function (s) {
    body += '<g transform="translate(' + mx + ',' + py + ')">' +
      rect(0, 0, cw, 60, { rx: 8, fill: T.surface2, stroke: T.border }) +
      circle(28, 30, 14, { fill: T.brand }) +
      _t(28, 36, s.num, { size: 14, weight: 600, fill: '#ffffff', ta: 'middle' }) +
      _t(56, 26, s.title, { size: 15, weight: 500 }) +
      _t(56, 46, s.desc, { size: 13, fill: T.textSecondary }) +
      '</g>';
    py += 72;
  });

  py += 16;
  body += _t(mx, py, 'Quick setup', { size: 22, weight: 500 }) + '\n';
  py += 30;

  body += '<g transform="translate(' + mx + ',' + py + ')">' +
    rect(0, 0, cw, 90, { rx: 10, fill: T.surface1, stroke: T.border }) +
    line(6, 0, cw - 6, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    _t(72, 24, 'Terminal', { family: 'mono', size: 12, fill: T.textMuted }) +
    line(0, 40, cw, 40) +
    _t(20, 64, '$', { family: 'mono', size: 13, fill: T.success }) +
    _t(34, 64, ' deno task setup', { family: 'mono', size: 13, fill: T.textPrimary }) +
    _t(20, 84, 'Running package graph check... 14/14 packages OK', {
      family: 'mono',
      size: 13,
      fill: T.textMuted,
    }) +
    '</g>';

  return svgWrap(1440, py + 150, body);
}

// ── 12: Roadmap ──
function gen12Roadmap() {
  let body = nav({ active: 'Guide' }) +
    _t(80, 100, 'Roadmap', { size: 52, weight: 600, ls: '-0.03em' }) +
    _t(80, 156, "What we're building next. Transparent by design.", {
      size: 18,
      fill: T.textSecondary,
    });

  const categories = [
    {
      title: 'In Progress',
      color: T.brand,
      bg: T.brandGlow,
      items: [
        {
          title: 'Island hydration scheduler',
          desc:
            'Priority-based island hydration with viewport awareness and interaction prediction.',
        },
        {
          title: 'CSS layers integration',
          desc: 'Built-in @layer support for DSD components with automatic cascade management.',
        },
      ],
    },
    {
      title: 'Up Next',
      color: T.info,
      bg: T.infoBg,
      items: [
        {
          title: 'DevTools extension',
          desc: 'Browser DevTools panel for inspecting VNode tree, signal state, and DSD output.',
        },
        {
          title: 'Incremental static regeneration',
          desc: 'Rebuild individual pages without full site regeneration. Deno KV-backed cache.',
        },
        {
          title: 'Multi-framework interop',
          desc: 'Use openElement components inside React, Vue, and Svelte with zero configuration.',
        },
      ],
    },
    {
      title: 'Planned',
      color: T.purple,
      bg: T.purpleBg,
      items: [
        {
          title: 'Visual regression testing',
          desc: 'Automated screenshot comparison CI step for component changes.',
        },
        {
          title: 'Package marketplace',
          desc: 'Discover, install, and publish openElement-compatible packages via JSR.',
        },
      ],
    },
  ];

  let y = 230;
  categories.forEach(function (cat) {
    body += _t(80, y, cat.title, { size: 14, weight: 500, fill: cat.color, ls: '0.04em' }) + '\n';
    y += 24;
    cat.items.forEach(function (item) {
      body += '<g transform="translate(80,' + y + ')">' +
        rect(0, 0, 1280, 64, { rx: 10, fill: T.surface2, stroke: T.border }) +
        line(6, 0, 1274, 0, { stroke: T.edge }) +
        circle(20, 20, 4, { fill: cat.color }) +
        _t(36, 28, item.title, { size: 17, weight: 500 }) +
        _t(36, 48, item.desc, { size: 13, fill: T.textSecondary }) +
        '</g>';
      y += 76;
    });
    y += 16;
  });

  return svgWrap(1440, y + 60, body);
}

// ── 13: API List ──
function gen13APIList() {
  const sidebarSections = [
    {
      heading: 'Packages',
      items: [
        { label: '@openelement/core', active: true },
        { label: '@openelement/ui', active: false },
        { label: '@openelement/app', active: false },
        { label: '@openelement/elements', active: false },
        { label: '@openelement/cli', active: false },
        { label: '@openelement/create', active: false },
      ],
    },
    {
      heading: 'Core API',
      items: [
        { label: 'definePage', active: false },
        { label: 'defineLayout', active: false },
        { label: 'createVNode', active: false, badge: 'internal' },
        { label: 'TrustedHTML', active: false },
      ],
    },
    {
      heading: 'App API',
      items: [
        { label: 'Head', active: false },
        { label: 'RouteConfig', active: false },
        { label: 'LoadContext', active: false },
      ],
    },
  ];

  let body = nav({ active: 'API' });
  body += sidebarNav(64, 80, sidebarSections);

  const mx = 280, cw = 820;
  body += _t(mx, 100, '@openelement/core', { size: 36, weight: 600, ls: '-0.02em' }) +
    _t(mx, 150, 'VNode engine, DSD renderer, signal primitives, and Trusted Types enforcement.', {
      size: 16,
      fill: T.textSecondary,
    });

  // Package info bar
  body += rect(mx, 195, cw, 36, { rx: 8, fill: T.surface2, stroke: T.border }) +
    badge(mx + 16, 201, 'v0.40.7', { bg: T.brandGlow, color: T.brand, size: 11 }) +
    _t(mx + 92, 218, 'Exports: 12 · 98% coverage · JSR published', { size: 13, fill: T.textMuted });

  let py = 260;
  // API entries
  const apis = [
    {
      name: 'definePage',
      sig: 'definePage(config: PageConfig): PageDefinition',
      desc: 'Defines a routable page with route matching, head management, and render lifecycle.',
    },
    {
      name: 'defineLayout',
      sig: 'defineLayout(config: LayoutConfig): LayoutDefinition',
      desc: 'Defines a layout wrapper that applies to all child routes. Supports nested layouts.',
    },
    {
      name: 'createVNode',
      sig: 'createVNode(tag: string, props?: VNodeProps, ...children: VNodeChild[]): VNode',
      desc:
        'Creates a virtual DOM node. Used internally by the JSX compiler. Available for programmatic use.',
    },
    {
      name: 'renderToDSD',
      sig: 'renderToDSD(vnode: VNode): string',
      desc:
        'Renders a VNode tree to a Declarative Shadow DOM string. Used at build time for static generation.',
    },
    {
      name: 'signal',
      sig: 'signal<T>(initial: T): Signal<T>',
      desc:
        'Creates a reactive signal primitive. Subscriptions notify on value change. Integrated with VNode rendering.',
    },
    {
      name: 'TrustedHTML',
      sig: 'TrustedHTML.fromSanitized(html: string): TrustedHTML',
      desc:
        'Creates a TrustedHTML object from pre-sanitized content. Required for all HTML injection.',
    },
  ];

  apis.forEach(function (api, _i) {
    body += '<g transform="translate(' + mx + ',' + py + ')">' +
      rect(0, 0, cw, 88, { rx: 10, fill: T.surface2, stroke: T.border }) +
      line(6, 0, cw - 6, 0, { stroke: T.edge }) +
      _t(20, 28, api.name, { family: 'mono', size: 16, weight: 500, fill: T.codeFn }) +
      _t(20 + api.name.length * 9.6 + 12, 28, api.sig, {
        family: 'mono',
        size: 12,
        fill: T.textMuted,
      }) +
      _t(20, 52, api.desc, { size: 13, fill: T.textSecondary }) +
      // Type badge
      badge(cw - 100, 20, 'function', { bg: T.successBg, color: T.success, size: 11 }) +
      '</g>';
    py += 100;
  });

  return svgWrap(1440, py + 40, body);
}

// ── 14: 404 Page ──
function gen14NotFound() {
  let body = nav();
  const cx = 720, cy = 260;

  // Ambient glow
  body += '<ellipse cx="' + cx + '" cy="' + (cy - 60) + '" rx="300" ry="200" fill="' + T.brand +
    '" opacity="0.03" />';

  // Large 404
  body += _t(cx, cy, '404', { size: 160, weight: 600, fill: T.brand, ls: '-0.06em', ta: 'middle' });

  // Glitch effect line
  body += line(cx - 180, cy + 30, cx + 180, cy + 30, { stroke: T.brand, sw: 1, opacity: 0.2 });
  body += line(cx - 140, cy + 33, cx + 200, cy + 33, { stroke: T.rose, sw: 1, opacity: 0.15 });

  // Message
  body += _t(cx, cy + 90, 'This page does not exist.', { size: 28, weight: 500, ta: 'middle' });
  body += _t(cx, cy + 132, 'It may have been moved, deleted, or perhaps it never was.', {
    size: 16,
    fill: T.textSecondary,
    ta: 'middle',
  });

  // Helpful links
  body += _t(cx, cy + 190, 'Try these instead:', { size: 14, fill: T.textMuted, ta: 'middle' });

  const links = [
    { label: 'Home', x: cx - 280 },
    { label: 'Documentation', x: cx - 140 },
    { label: 'API Reference', x: cx + 20 },
    { label: 'GitHub', x: cx + 160 },
  ];
  links.forEach(function (l) {
    body += rect(l.x, cy + 210, 110, 34, { rx: 8, fill: T.surface2, stroke: T.border }) +
      _t(l.x + 55, cy + 232, l.label, { size: 13, weight: 500, ta: 'middle' });
  });

  // Decorative terminal
  body += '<g transform="translate(' + (cx - 240) + ',' + (cy + 290) + ')">' +
    rect(0, 0, 480, 90, { rx: 10, fill: T.surface1, stroke: T.border }) +
    line(6, 0, 474, 0, { stroke: T.edge }) +
    circle(18, 19, 5, { fill: T.termRed }) + circle(35, 19, 5, { fill: T.termYellow }) +
    circle(52, 19, 5, { fill: T.termGreen }) +
    line(0, 40, 480, 40) +
    _t(20, 64, '$', { family: 'mono', size: 13, fill: T.success }) +
    _t(34, 64, ' curl -s https://openelement.dev/missing | jq .', {
      family: 'mono',
      size: 13,
      fill: T.textPrimary,
    }) +
    _t(20, 84, '{ "status": 404, "message": "Not Found" }', {
      family: 'mono',
      size: 13,
      fill: T.textMuted,
    }) +
    '</g>';

  return svgWrap(1440, 750, body);
}

// ═══════════════════════════════════════════
//  EXPORT LOGIC
// ═══════════════════════════════════════════
const mockups = [
  { file: '01-homepage-hero.svg', gen: gen01HomeHero },
  { file: '02-homepage-features.svg', gen: gen02Features },
  { file: '03-homepage-fullpage.svg', gen: gen03Fullpage },
  { file: '04-docs-landing.svg', gen: gen04DocsLanding },
  { file: '05-design-system.svg', gen: gen05DesignSystem },
  { file: '06-guide-page.svg', gen: gen06GuidePage },
  { file: '07-architecture-page.svg', gen: gen07Architecture },
  { file: '08-blog-index.svg', gen: gen08BlogIndex },
  { file: '09-blog-post.svg', gen: gen09BlogPost },
  { file: '10-changelog.svg', gen: gen10Changelog },
  { file: '11-contributing.svg', gen: gen11Contributing },
  { file: '12-roadmap.svg', gen: gen12Roadmap },
  { file: '13-api-list.svg', gen: gen13APIList },
  { file: '14-not-found.svg', gen: gen14NotFound },
];

for (const m of mockups) {
  const svg = m.gen();
  writeFileSync(resolve(mockupsDir, m.file), svg, 'utf-8');
  console.log('Wrote ' + m.file + ' (' + (svg.length / 1024).toFixed(1) + ' KB)');
}

// ── PNG conversion ──
console.log('\nConverting SVGs to PNGs with @resvg/resvg-js...');
for (const m of mockups) {
  const svgPath = resolve(mockupsDir, m.file);
  const pngPath = svgPath.replace('.svg', '.png');
  const svgContent = readFileSync(svgPath, 'utf-8');

  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: 1440 },
    background: T.canvas,
  });
  const pngBuffer = resvg.render().asPng();
  writeFileSync(pngPath, pngBuffer);
  console.log(
    'Converted ' + m.file + ' → ' + pngPath.split('/').pop() + ' (' +
      (pngBuffer.length / 1024).toFixed(1) + ' KB)',
  );
}

console.log('\nDone. All 14 mockups generated and converted.');
