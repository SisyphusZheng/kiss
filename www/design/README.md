# openElement × Linear.app Design System

> **Version**: 1.0.0
> **Date**: 2025-06-16
> **Designer**: AI Design Agent
> **Reference**: linear.app
> **Platform**: openElement Web Components (DSD-first)
> **Font**: Inter (Google Fonts) / JetBrains Mono (Google Fonts)

---

## Quick Navigation

| Section | Path | Description |
|---------|------|-------------|
| Design Tokens | [`tokens/`](./tokens/) | Colors, typography, spacing, radii — W3C + CSS formats |
| Components | [`components/`](./components/) | Button, Card, Input, Nav, Badge, Icon specs |
| Icons | [`icons/`](./icons/) | 6 feature icons (SVG, 24×24 viewBox) |
| Mockups | [`mockups/`](./mockups/) | High-fidelity page mockups (PNG + SVG) |
| Layout Specs | [`specs/`](./specs/) | Homepage, docs, design-system page specs |
| Handoff | [`handoff/`](./handoff/) | Migration guide & QA checklist |

---

## Design Philosophy

1. **Canvas 即留白** — 深色背景本身就是留白，不用白色间隙
2. **Surface 阶梯** — 4 层表面（canvas → surface-1 → surface-2 → surface-3）构建层级
3. **Hairline 分隔** — 极细边框（1px, rgba(255,255,255,0.06)）替代阴影
4. **顶部边缘高光** — 卡片顶部 1px 微弱白边，制造"像素渲染"感
5. **无渐变、无阴影、无氛围光** — 零装饰性渐变，零 drop-shadow
6. **产品截图即主角** — 每个 section 以产品 UI 截图为核心视觉元素
7. **Typography 即品牌** — 激进的负字间距 + 精确的 weight 阶梯
8. **单色强调** — 只用 Indigo/Lavender 一个强调色
9. **紧凑按钮** — 8px 圆角，8px 14px padding，不是 pill

---

## Color Palette

### Dark Mode（唯一营销主题）

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-canvas` | `#08080a` | Page background |
| `--surface-1` | `#0d0f12` | Nav, secondary panels |
| `--surface-2` | `#16191d` | Cards, code blocks |
| `--surface-3` | `#212529` | Elevated elements, dropdowns |
| `--brand` | `#5c7cfa` | Primary CTA, links, accent |
| `--brand-hover` | `#4c6ef5` | Button hover |
| `--brand-light` | `#748ffc` | Focus ring |
| `--text-primary` | `#e9ecef` | Headlines, body |
| `--text-secondary` | `#adb5bd` | Subtitles, descriptions |
| `--text-muted` | `#868e96` | Captions, meta |
| `--border` | `rgba(255,255,255,0.06)` | Hairline borders |
| `--border-hover` | `rgba(255,255,255,0.10)` | Hover borders |
| `--edge-highlight` | `rgba(255,255,255,0.08)` | Card top edge |

### Light Mode（仅产品 UI 预览）

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-canvas` | `#f8f9fa` | Page background |
| `--surface-1` | `#ffffff` | Panels |
| `--surface-2` | `#f1f3f5` | Cards |
| `--text-primary` | `#12131a` | Headlines |
| `--text-secondary` | `#626676` | Subtitles |
| `--border` | `rgba(18,19,26,0.08)` | Hairline borders |

---

## Typography Scale

| Token | Size | Weight | Line-Height | Letter-Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display XL | 80px | 600 | 0.95 | -0.04em | Hero headline |
| Display LG | 56px | 600 | 1.05 | -0.03em | Section opener |
| Display MD | 40px | 600 | 1.05 | -0.02em | Sub-section headline |
| Headline | 28px | 600 | 1.20 | -0.01em | Pricing, CTA banner |
| Card Title | 22px | 500 | 1.25 | -0.005em | Feature card title |
| Subhead | 20px | 400 | 1.40 | -0.01em | Lead paragraphs |
| Body LG | 18px | 400 | 1.50 | 0 | Hero subhead |
| Body | 16px | 400 | 1.50 | 0 | Default body |
| Body SM | 14px | 400 | 1.50 | 0 | Card body, footer |
| Caption | 12px | 400 | 1.40 | 0 | Captions, meta |
| Button | 14px | 500 | 1.20 | 0 | Button labels |
| Eyebrow | 13px | 500 | 1.30 | +0.04em | Section labels |
| Mono | 13px | 400 | 1.50 | 0 | Code snippets |

> **Note**: Linear 在 Display 上只用 600，从不用 700+。这是其"克制的力量"的关键。

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xxs` | 4px | Micro gaps |
| `xs` | 8px | Button padding-y, icon gaps |
| `sm` | 12px | Button gap, card gap |
| `md` | 16px | Standard gap, card gap |
| `lg` | 24px | Card padding, section gap |
| `xl` | 32px | Page padding-x |
| `xxl` | 48px | Large spacing |
| `section` | 96px | Section separation |

---

## Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Small chips, badges |
| `sm` | 6px | Inline tags |
| `md` | 8px | Buttons, inputs, tabs |
| `lg` | 12px | Cards, feature cards |
| `xl` | 16px | Product panels, code blocks |
| `pill` | 9999px | Status badges, tabs |

---

## Breakpoints

| Name | Width | Layout Changes |
|------|-------|----------------|
| Desktop | ≥ 1024px | 3-column feature grid, hero side-by-side |
| Tablet | 768–1023px | 2-column feature grid, hero stacked |
| Mobile | < 768px | 1-column, simplified nav, code panel hidden |

---

## Files & Deliverables

### Mockups
- `01-homepage-hero.png` — Hero section (1440×900)
- `02-homepage-features.png` — Feature grid (1440×900)
- `03-design-system.png` — Design system page (1440×900)
- `04-fullpage-concept.png` — Full homepage scroll (1440×2400)
- `05-homepage-hero.svg` — Hero SVG (Figma-importable)
- `06-homepage-features.svg` — Features SVG (Figma-importable)
- `07-fullpage.svg` — Full page SVG (Figma-importable)

### Tokens
- `tokens/tokens.json` — W3C Design Tokens format
- `tokens/tokens.css` — CSS Custom Properties
- `tokens/tokens.md` — Token documentation

### Components
- `components/button.md` — 4 variants (primary, secondary, tertiary, inverse)
- `components/card.md` — Top edge highlight, hover states
- `components/input.md` — Focus ring, hairline border
- `components/nav.md` — Sticky nav, backdrop blur, 56px height
- `components/badge.md` — Pill status badge
- `components/icon.md` — 16×16 / 24×24 / 32×32 sizes

### Icons
- `icons/elements-first.svg` — Layers icon
- `icons/one-renderer.svg` — Git-branch icon
- `icons/app-lifecycle.svg` — Workflow icon
- `icons/trusted-boundary.svg` — Shield icon
- `icons/gate-proven.svg` — Check-circle icon
- `icons/web-standards.svg` — Globe icon

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-06-16 | Initial Linear.app style redesign |

---

## Contact

- **Framework**: [openelement.org](https://openelement.org)
- **GitHub**: [github.com/open-element/openelement](https://github.com/open-element/openelement)
