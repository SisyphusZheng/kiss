# Badge Component Spec

## Purpose

Badges communicate status or category. They are read-only labels, not primary
navigation.

## Style

| Property | Value |
| --- | --- |
| Radius | `--radius-pill` |
| Height | 24px |
| Padding | 0 9px |
| Font | 12px mono or compact sans |
| Weight | 800 |

## Variants

| Variant | Background | Text |
| --- | --- | --- |
| Current | `#eff6ff` | `#1d4ed8` |
| Done | `#ecfdf5` | `#047857` |
| Planned | `#fffbeb` | `#b45309` |
| Error | `#fef3f2` | `#b42318` |

## Rules

- Use sparingly.
- Do not rely on color alone; pair status with readable text.
- Do not turn badges into buttons.
