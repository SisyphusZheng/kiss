# Button Component Spec

## Purpose

Buttons should be dense, stable, and easy to scan. Use text buttons for clear
commands and square icon buttons for tools.

## Variants

| Variant | Background | Text | Border | Use |
| --- | --- | --- | --- | --- |
| Primary | `--color-brand` | `#ffffff` | brand | Main action |
| Secondary | `--surface-1` | `--text-primary` | `--border` | Secondary action |
| Tertiary | transparent | `--text-primary` | transparent | Low emphasis |
| Icon | `--surface-1` | `--text-primary` | `--border` | Tool buttons |

## Rules

- Radius: 8px.
- Default height: 38-42px.
- No pill shape for command buttons.
- No hover translate or decorative shadow.
- Focus-visible: 2px brand outline, 2px offset.
- Text must fit without overlap on mobile.
