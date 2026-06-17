# Navigation Component Spec

## Purpose

The navigation shell should feel like a documentation workbench: stable,
readable, and fast to scan.

## Desktop

| Property | Value |
| --- | --- |
| Height | 64px |
| Background | `--nav-bg` |
| Border | 1px solid `--border` |
| Max width | 1240px |
| Horizontal padding | 32px |
| Backdrop | blur(14px) |

## Structure

```text
openElement mark + wordmark | Guide API Architecture Blog Roadmap | GitHub Get started
```

## Rules

- Logo uses a small square product mark plus wordmark.
- Header links use compact readable text, no negative letter spacing.
- Active page uses stronger text weight.
- Mobile drawer starts below the 64px header.
- Mobile bottom tabs use the first five header links.
- Header must not wrap into two rows at common desktop widths.
