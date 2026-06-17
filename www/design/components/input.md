# Input Component Spec

## Purpose

Inputs should be utilitarian, stable, and readable. They are for forms, search,
filters, and command display.

## Style

| Property | Value |
| --- | --- |
| Height | 40px default |
| Background | `--surface-1` |
| Border | 1px solid `--border` |
| Radius | 8px |
| Padding | 0 12px |
| Font size | 14px |
| Text | `--text-primary` |
| Placeholder | `--text-muted` |

## States

| State | Behavior |
| --- | --- |
| Hover | Border becomes `--border-hover` |
| Focus | 2px brand outline, 2px offset |
| Disabled | 0.5 opacity, not-allowed cursor |
| Error | Border and help text use `--color-error` |

## Rules

- Prefer native inputs before custom widgets.
- Keep dimensions stable across states.
- CLI/command inputs use mono font and may include a copy icon button.
- Search inputs should include a recognizable search icon.
