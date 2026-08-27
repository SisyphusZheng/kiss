# ADR-0145: Content Collections Become the Unified Content Graph

- Status: ACCEPTED (2026-08-27, implementation tracked by the v0.44 plan)
- Date: 2026-08-27
- Supersedes: ADR-0136's Markdown-only non-goal
- Preserves: ADR-0136 collection naming, schema validation and deterministic output

## Context

ADR-0136 successfully generalized two Markdown directories, but it deliberately defined
a collection as “a directory of Markdown and frontmatter.” Public API documentation,
Custom Element metadata, releases, ADRs and roadmap data therefore remain parallel
systems. The website and governance scripts repeatedly copy facts from sources that
already know them.

## Decision

Content Collections becomes a typed content graph with source adapters. It does not
parse TypeScript or replace mature documentation tools.

```text
TypeScript/JSDoc -- deno doc --json --lint --+
compiler output  -- Custom Elements Manifest +--> normalized collection entries
Markdown/MDX     -- frontmatter adapter --------+
ADR/release/roadmap structured metadata --------+
                                                   |
                                      Content Collections graph
                                                   |
                         docs routes / API / nav / search / SEO / feeds
```

### Source ownership

- TypeScript declarations and JSDoc own library API facts.
- The OpenElement compiler owns element tags, attributes, events, slots, CSS parts,
  root modes, SSR/claim capability and activation metadata.
- Markdown owns narrative guides, explanation and examples.
- ADRs own decisions; the roadmap and version plan own scheduling and gates.
- Release records own released-version facts.

Adapters normalize these sources into versioned collection schemas with stable IDs,
source locations, locale availability, cross-references and fingerprints. A generated
page is never edited by hand.

### Outputs

The graph generates API reference pages, Custom Element reference data, package maps,
route navigation, Pagefind records, canonical/alternate metadata, current release
feeds, roadmap views and link targets. English-only source documentation is displayed
honestly; locale chrome may be translated without fabricating translated JSDoc.

### Public framework boundary

The first implementation is repository dogfood inside the existing
`@openelement/adapter-vite` collection machinery. Loader/adaptor APIs remain internal
until two independent collection sources outside the website require a stable public
contract. This avoids turning the framework into a generic CMS during the compiler
rewrite.

## Truth and failure policy

- Generation is deterministic and timestamp-free.
- CI runs extraction lint and a `--check` drift comparison.
- Missing supported exports, unresolved public types, duplicate IDs, broken local
  references, false locale alternates and undocumented compiler-emitted element
  metadata fail closed.
- Handwritten API lists, package graphs and current-release summaries are deleted once
  generated equivalents land.
- Historical prose remains historical and is not rewritten to simulate current truth.

## Consequences

Content Collections gains adapters and graph relationships, but not a TypeScript
parser, query CMS or second routing framework. Documentation becomes a compiler output
where it states facts, while human writing remains responsible for teaching and design
intent.
