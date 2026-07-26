# ADR Index

Architecture Decision Records for openElement. Each ADR documents a significant
architectural decision, its context, and consequences.

## Current Decision Set

The ADR directory is append-only project history. Not every accepted ADR is
current product truth. For the v0.41 alpha line, start with these current
documents:

| Area               | Current ADR / doc                                                | Notes                                                          |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| Product doctrine   | ADR-0110, ADR-0113                                               | Two-product framing; five-package boundary.                    |
| App ownership      | ADR-0111                                                         | OpenElement-owned app concepts; Vite/Hono/Nitro as drivers.    |
| Protocol runtime   | ADR-0112                                                         | Contracts plus a tiny host-API-free runtime.                   |
| Distribution       | ADR-0108                                                         | npm-primary distribution via `deno pack` for v0.41+.           |
| Alpha naming       | ADR-0114                                                         | Alpha line continues until external evidence justifies stable. |
| Authoring helper   | ADR-0115                                                         | Single element authoring helper; `defineLayout` removed.       |
| Alpha.16 scope     | ADR-0116                                                         | Audit-driven correctness reset before stable freeze.           |
| Stable 0.41 freeze | ADR-0119                                                         | Scoped interface freeze for the 0.41.x line.                   |
| 0.42 loop scope    | ADR-0120                                                         | WC Application Loop scope boundary and action protocol.        |
| Cleanup governance | ADR-0105, ADR-0106                                               | Approved cleanup train and audit-driven quality work.          |
| Active stack truth | `docs/current/STACK_CONTRACT.md`, `docs/current/VERSION_PLAN.md` | Operational version and stack contract for current work.       |

Older ADRs remain useful evidence, but they are historical when they conflict
with ADR-0110 through ADR-0116, or docs under `docs/current/`.

## Format

```
# ADR-NNNN: Title

- Status: PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED
- Date: YYYY-MM-DD

## Context
(Why was this decision needed?)

## Decision
(What was decided?)

## Consequences
(What are the positive, negative, and neutral outcomes?)
```

## ADR Catalog

This catalog preserves historical status labels from each ADR. Use the current
decision set above to decide which records are authoritative for new work.

| ADR  | Title                                                    | Status                                           |
| ---- | -------------------------------------------------------- | ------------------------------------------------ |
| 0006 | Version Roadmap                                          | Accepted                                         |
| 0007 | npm Publishing Strategy                                  | Accepted                                         |
| 0010 | Eliminate .less/ temp files                              | Accepted, Implemented                            |
| 0011 | Eliminate globalThis bridge                              | Accepted, Implemented                            |
| 0016 | Dual-mode subpath resolution                             | Accepted, Implemented                            |
| 0017 | Runtime/Build separation                                 | Accepted, Implemented                            |
| 0018 | Virtual Data Modules                                     | Accepted, Implemented                            |
| 0024 | Standards-first WC Renderer Roadmap                      | Accepted                                         |
| 0025 | Renderer Protocol                                        | Accepted (v0.15 partial, v0.16 deferred)         |
| 0026 | Structured Render Pipeline (v0.16)                       | Proposed                                         |
| 0027 | Roadmap Reorder: Engine Before Hub                       | Accepted                                         |
| 0028 | Conservative Third-Party WC SSR Admission                | Proposed                                         |
| 0029 | Happy DOM for v0.18.3 DOM Simulation                     | Superseded by ADR-0032                           |
| 0030 | Hub Architecture + Submission Pipeline                   | Proposed                                         |
| 0031 | Hub v2 Component Browser Workflow                        | Proposed                                         |
| 0032 | Real Browser Snapshot Rendering                          | Proposed                                         |
| 0033 | Architecture Positioning: SSG Islands                    | Accepted                                         |
| 0034 | Hermetic Hub Snapshots                                   | Proposed                                         |
| 0035 | SSG Resilient Rendering + Visual Overhaul                | Accepted                                         |
| 0036 | Ocean-Island Architecture                                | Accepted / Implemented                           |
| 0037 | DSD-First Strategic Boundary                             | Accepted                                         |
| 0038 | ISR + Edge KV Architecture                               | Accepted                                         |
| 0039 | DsdElement + Signals Reactive Architecture               | Accepted                                         |
| 0040 | Streaming DSD                                            | Accepted                                         |
| 0041 | ESM Module Graph First for JSR Consumer Builds           | Accepted                                         |
| 0042 | Import Map Universal Resolution                          | Accepted                                         |
| 0043 | SSG Phase 3 Dependency Strategy                          | Accepted                                         |
| 0044 | SSR Browser API Polyfill Strategy                        | Accepted                                         |
| 0045 | Native Web API First-Class                               | Accepted                                         |
| 0046 | Phase 2 Import Map Resolution                            | Accepted                                         |
| 0047 | Deno Pre-Resolution External Dependencies                | Accepted                                         |
| 0048 | CI and Release Gate Separation                           | Accepted                                         |
| 0049 | Architecture Debt First Roadmap Reset                    | Accepted                                         |
| 0050 | Layered Package Architecture                             | Accepted                                         |
| 0051 | Self-Built `html` Template System Strengthening          | Accepted (v0.24.0)                               |
| 0052 | Signal-DOM Deep Integration                              | Accepted (v0.24.0)                               |
| 0053 | Unified Error Handling Architecture                      | Accepted (v0.24.0)                               |
| 0054 | AST-Based External Specifier Resolution                  | Accepted                                         |
| 0055 | SSR Bundle Self-Containment                              | SUPERSEDED by ADR-0056                           |
| 0056 | External Dependencies, Consumer Import Map + AST         | Accepted                                         |
| 0070 | Generated Data Namespace and App Shell Boundary          | Accepted                                         |
| 0073 | AppShell Protocol                                        | Accepted, Implemented                            |
| 0074 | @openelement/ui Dual-Track Ocean and Island Architecture | Proposed                                         |
| 0075 | Fork daisyUI 5 Compiled CSS for DSD Shell Components     | Proposed                                         |
| 0076 | Open Props and daisyUI Token Merge                       | Proposed                                         |
| 0077 | Structured Render IR and Single Renderer Pipeline        | Accepted, Implemented                            |
| 0078 | Core Package Simplification and Module Merge             | Accepted                                         |
| 0079 | v0.29.6 Architecture Debt Closure                        | Accepted                                         |
| 0080 | Architecture Contract Freeze                             | Accepted                                         |
| 0081 | VNode-Only Dynamic UI and Trusted HTML Boundary          | Accepted                                         |
| 0082 | JSX-first Application API                                | Accepted                                         |
| 0083 | Deferred Public Surface Reset                            | Accepted                                         |
| 0084 | Product Closure Version Line                             | Accepted; sequencing superseded by 0086          |
| 0085 | App Lifecycle Contract                                   | Accepted                                         |
| 0086 | AI-Readable Architecture and AutoFlow2 Roadmap           | Accepted; v0.37-v1 sequencing superseded by 0091 |
| 0091 | Four-Product Platform Roadmap                            | Accepted                                         |
| 0092 | DsdElement Render Mode Contract                          | Accepted                                         |
| 0093 | SSR / ISR Runtime Contract                               | Accepted                                         |
| 0094 | Core Type Consolidation — Eliminate `types.ts`           | Accepted                                         |
| 0095 | Data / Database Boundary                                 | Accepted                                         |
| 0096 | Protocol-First Vite + Nitro Runtime Architecture         | Accepted                                         |
| 0097 | JSR Best-Effort Release Gate                             | Accepted                                         |
| 0098 | EntryDescriptor Route Manifest Contract                  | Accepted                                         |
| 0099 | Four-Product Matrix and Elements Reset                   | Accepted; heavy-island scope superseded by 0101  |
| 0100 | JSR Publish Exit Gate Restored                           | Accepted; superseded by 0107 for v0.41+          |
| 0101 | Product-Line Reset and AutoFlow3 Governance Boundary     | Accepted                                         |
| 0102 | Elements Package Product Surface                         | Accepted                                         |
| 0103 | Archive-Candidate Package Reduction                      | Accepted                                         |
| 0104 | Signal Engine Default Policy                             | Accepted                                         |
| 0105 | v0.40.x Cleanup Train Exception                          | Accepted                                         |
| 0106 | Audit-Driven Quality Cleanup for v0.40.6                 | Accepted                                         |
| 0107 | npm-Only Distribution                                    | Accepted                                         |
| 0108 | npm Distribution via `deno pack`                         | Accepted                                         |
| 0109 | Unified Signal-DOM Activation Layer                      | Accepted                                         |
| 0110 | Two-Product Doctrine and Package Truth                   | Accepted                                         |
| 0111 | OpenElement App Ownership Boundary                       | Accepted                                         |
| 0112 | Protocol Types and Tiny Runtime                          | Accepted                                         |
| 0113 | Beta Four Product Boundary                               | Accepted; beta naming superseded by 0114         |
| 0114 | Continue Alpha After Five-Package Convergence            | Accepted                                         |
| 0115 | Single Element Authoring Helper                          | Accepted                                         |
| 0116 | Audit-Driven Alpha.16 Correctness Reset                  | Accepted                                         |
| 0117 | Second Audit Round and Alpha.18 Sweep                    | Accepted                                         |
| 0118 | Third Audit Round Alpha.19 Cleanup Sweep                 | Accepted                                         |
| 0119 | Stable 0.41.0 Scoped Interface Freeze                    | Accepted                                         |
| 0120 | 0.42.0 WC Application Loop Scope and Action Protocol     | Accepted                                         |

## Superseded / Historical

Historical ADRs are intentionally kept in place rather than deleted. They are
release evidence and design context, but current docs should not cite them as
active product doctrine when a newer ADR or `docs/current/` page supersedes
them.

## New ADRs

Write new ADRs as `NNNN-kebab-case-title.md` in this directory.

Next ADR candidates:

- Signal engine interoperability contract (align with TC39 Signals proposal
  shape where practical).
