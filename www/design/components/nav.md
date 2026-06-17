# Navigation Component Spec

## Purpose

The navigation shell should feel like a documentation workbench: stable,
readable, and fast to scan.

## Desktop

| Property           | Value                              |
| ------------------ | ---------------------------------- |
| Height             | `--nav-height`                     |
| Background         | `--nav-bg`                         |
| Border             | `--border-size-1` solid `--border` |
| Max width          | `--site-container-wide`            |
| Horizontal padding | `--size-8`                         |
| Backdrop           | blur(14px)                         |

## Structure

```text
openElement mark + wordmark | Guide API Architecture Blog Roadmap | GitHub Get started
```

## Rules

- Logo uses a small square product mark plus wordmark.
- Header links use compact readable text, no negative letter spacing.
- Active page uses stronger text weight.
- Mobile drawer starts below `--nav-height`.
- Mobile bottom tabs use the first five header links.
- Header must not wrap into two rows at common desktop widths.
