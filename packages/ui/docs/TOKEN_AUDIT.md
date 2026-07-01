# UI Token Audit (T5.1)

This document records the alpha.5 token inventory for `@openelement/ui` as of
`packages/ui/src/open-props-tokens.ts` and the components that consume it.

## Summary

| Category                            | Count |
| ----------------------------------- | ----- |
| Open Props native tokens            | 168   |
| Semantic aliases over Open Props    | 76    |
| Total defined in token sheet        | 244   |
| Used in components                  | 151   |
| Unused in components                | 120   |
| Used but not defined in token sheet | 27    |

## Findings

### 1. Dead/unused Open Props color scales (~104 tokens)

The following Open Props color scales are fully defined but never referenced by
any component:

- `--blue-*` (13)
- `--cyan-*` (13)
- `--green-*` (13)
- `--indigo-*` (12, only `--indigo-6` is used)
- `--orange-*` (13)
- `--red-*` (13)
- `--teal-*` (13)

Also unused:

- `--font-letterspacing-0`, `--font-letterspacing-1`, `--font-letterspacing-3`
- `--font-size-4`, `--font-size-7`, `--font-size-8`
- `--font-weight-4`, `--font-weight-9`
- `--gray-4`, `--gray-10`
- `--radius-4`
- `--site-container`, `--site-container-reading`, `--site-container-wide`
- `--site-section-block`, `--site-section-gap`
- `--tab-radius`
- `--nav-link-size`
- Most `--violet-*` shades except `--violet-0/1/2/4/5/6/7/11/12`

### 2. Semantic aliases that are defined but unused

These aliases are defined but not referenced by any component. They may be
internal to `daisy-classes.ts` or truly dead:

- `--btn-text-case` (assigned in daisy but likely defaults to `none`)
- `--menu-item-padding`, `--menu-padding`, `--menu-radius`
- `--dropdown-radius` / `--dropdown-bg` (used? verify)
- `--modal-bg` / `--modal-radius` / `--modal-padding`
- `--tooltip-padding` / `--tooltip-radius` / `--tooltip-bg` / `--tooltip-color`
- `--divider-margin` / `--divider-color`
- `--alert-padding` / `--alert-radius`
- `--input-border-color`
- `--bg-muted`
- `--nav-bg` / `--nav-link-color` / `--nav-link-hover`

_(Run `rg -- '--<name>' packages/ui/src/*.tsx` to confirm per-token usage.)_

### 3. Tokens used in components but missing from the token sheet

These 27 tokens are referenced in component/daisy CSS but are **not defined**
in `open-props-tokens.ts`. They fall through to either inherited browser
defaults or shadow-host custom property inheritance from the document:

| Token                    | Files                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `--accent`               | open-button.tsx                                                                                                       |
| `--artifact`             | open-lab-panel.tsx                                                                                                    |
| `--code`                 | open-lab-panel.tsx, open-standards-visual.tsx, open-code-block.tsx, open-card.tsx, open-lab-stage.tsx                 |
| `--danger`               | open-callout.tsx                                                                                                      |
| `--default`              | open-button.tsx                                                                                                       |
| `--font-size-body-sm`    | open-layout.tsx                                                                                                       |
| `--font-size-button`     | open-layout.tsx                                                                                                       |
| `--font-weight-semibold` | open-layout.tsx                                                                                                       |
| `--ghost`                | open-button.tsx                                                                                                       |
| `--high`                 | open-standards-visual.tsx, open-lab-stage.tsx                                                                         |
| `--lab-stage-min-height` | open-lab-stage.tsx                                                                                                    |
| `--lg`                   | open-button.tsx                                                                                                       |
| `--mark-size`            | open-brand-mark.tsx                                                                                                   |
| `--md`                   | open-button.tsx                                                                                                       |
| `--motion`               | open-standards-visual.tsx, open-lab-stage.tsx                                                                         |
| `--muted`                | open-lab-panel.tsx                                                                                                    |
| `--normal`               | open-lab-stage.tsx                                                                                                    |
| `--one`                  | open-lab-stage.tsx                                                                                                    |
| `--panel-min-height`     | open-lab-panel.tsx                                                                                                    |
| `--primary`              | open-button.tsx                                                                                                       |
| `--sm`                   | open-badge.tsx, open-button.tsx                                                                                       |
| `--still`                | open-lab-stage.tsx                                                                                                    |
| `--surface`              | open-standards-visual.tsx                                                                                             |
| `--tip`                  | open-callout.tsx                                                                                                      |
| `--two`                  | open-lab-stage.tsx                                                                                                    |
| `--warn`                 | open-lab-panel.tsx, open-callout.tsx, open-standards-visual.tsx, open-badge.tsx, open-lab-stage.tsx, daisy-classes.ts |
| `---`                    | open-layout.tsx (likely CSS comment artifact)                                                                         |

Most of these look like **legacy daisyUI/Tailwind class names or custom
component properties** rather than Open Props tokens. They should either be
migrated to semantic aliases or removed.

## Recommendations for T5.2

1. **Delete fully unused color scales** (`blue`, `cyan`, `green`, `indigo`,
   `orange`, `red`, `teal`) and any unused size/type/radius tokens. This removes
   ~100+ lines with no visual risk.
2. **Audit semantic aliases** one by one; keep only those referenced by
   components or daisy classes. Move site-specific tokens (`--site-container-*`)
   to the docs app if they are not library concerns.
3. **Add missing semantic aliases** or remove component references:
   - `--code` → likely should be `--bg-code` / `--code-text` / `--code-border`.
   - `--danger`/`--warn`/`--tip`/`--info`/`--success` → align with existing
     semantic status tokens.
   - `--primary`, `--ghost`, `--default`, `--accent`, `--sm`, `--md`, `--lg`
     in `open-button.tsx` look like **variant class names stored as CSS
     properties**. They should become component state or class names, not
     custom properties.
   - `--high`, `--still`, `--motion`, `--normal`, `--one`, `--two`, `--surface`
     in lab/standard components look like **legacy animation/state tokens**.
   - `--font-size-button`, `--font-size-body-sm`, `--font-weight-semibold` in
     `open-layout.tsx` should map to existing `--font-size-0`,
     `--font-size-00`, `--font-weight-6` unless a real semantic need exists.
4. **Document every kept semantic alias** with a one-line justification in the
   token sheet header.

## Next step

T5.2 (#169) performs the token sheet cleanup based on this audit.
