# Dogfood Apps

This directory collects design and evidence documents for **dogfood applications** that validate the openElement framework. Dogfood apps are not standalone product lines; they exist to stress-test framework contracts in real-world scenarios.

## Active Dogfood Projects

| Project              | Location                                     | Framework surface under test                                                                         | Status                                                                                                                         |
| -------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Reader**           | [`./reader/`](./reader/)                     | SPA mode, Deno Desktop, local-first documents, Preact islands, UI components                         | Released with alpha.6                                                                                                          |
| **Mastodon Desktop** | [`./mastodon-desktop/`](./mastodon-desktop/) | SPA mode, Deno Desktop, networked public APIs, third-party WC interop, local state, error boundaries | Completed; 30-min stress evidence (2026-07-11) in [`docs/evidence/DOGFOOD_PERFORMANCE.md`](../evidence/DOGFOOD_PERFORMANCE.md) |

## Design Principle

- Each dogfood app targets a **different stress surface** than the others.
- They must not require framework primitives that belong to future versions (e.g., server/data/forms/session/cache for v0.42+).
- They must include deterministic fixtures so CI does not depend on live third-party services.
- They must include smoke tests and, where practical, screenshot or long-running evidence.

## Product Boundary Reminder

> openElement = Web Components Fullstack Framework; Basic Element is an authoring mode\
> Dogfood apps validate the framework; they do not define new product lines.
