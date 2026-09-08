# Owned URLPatternList

Source: [justinfagnani/url-pattern-list v0.5.0](https://github.com/justinfagnani/url-pattern-list/tree/4911e649cc11860c7da90c9d0d9b05626c5cbb83),
commit `4911e649cc11860c7da90c9d0d9b05626c5cbb83`. The commit's package.json
identifies version 0.5.0; its MIT license is preserved verbatim alongside this file.

OE derives the sequence-bearing item, fixed prefix tree and value/result contract
from src/index.ts. The original component parser and wildcard/regex traversal are
removed: their pruning needs more proof than final exec supplies, and empty URL
components must not disappear from matching. No upstream release/visualizer tooling
or global API is copied. This private module is maintained by OpenElement.

Only canonical pathname strings in a literal ASCII alphabet enter the fixed tree.
ASCII case folding is an over-approximation; exec still determines case semantics.
Every other legal pattern remains in the conservative collection. Both collections
are merged by original sequence before exec. Other URL components are never pruned.
Duplicate values/patterns keep their order. The table is an immutable snapshot.

Inputs follow upstream's URL/string boundary: relative strings require a baseURL;
invalid URL input throws TypeError, including for an empty list. Both the index and
exec consume the same normalized URL. Pattern construction and captures belong to
the supplied native/polyfill constructor. No URLPatternInit match-input API is claimed.

Tests: packages/app/**tests**/url-pattern-list.test.ts compares full results and value
identity with each constructor's linear oracle. This is bounded corpus evidence,
not a claim of complete URLPattern standard or runtime qualification.
