# Roadmap

OpenElement = Web Components-native fullstack application framework.

Source package line: `v0.43.3`.
npm registry line: `v0.43.3` (dist-tag `latest`).
Active execution target: `v0.44.0-alpha.0`.
Latest landed train: `v0.43.3`.
Next planned train: `v0.44.0-alpha.1`.

OpenElement `v0.43.3` is the published stable maintenance line. The active 0.44
train rebuilds the element model around a compiler-owned Part Program.

## Current: Alpha.0 internal foundation

Alpha.0 closes governance and repository trust before feature implementation:

- #1160 compiler vertical spike — accepted
- #1182 three-role exact-SHA control-plane baseline — accepted
- #1156 direct mature-tool governance offload
- #1187 release authorization, Trusted Publishing, and branch protection
- #1188 architecture, ADR, current-doc, and evidence convergence
- #1189 immutable media and source-tree weight reduction

Alpha.0 is unpublished and dev-only.

## Later train

- Alpha.1-Alpha.6: compiler, element runtime, rendering/claim, delivery, and
  app/server foundations
- Alpha.7: migration, ecosystem, Content Graph (#1157), and API/CEM reference
  (#1158)
- Alpha.8: final-alpha framework and packed-consumer qualification
- Beta.1: UI and validated interaction composition
- Beta.2: website qualification and content-derived website facts (#1159)
- RC: exact public candidate and independent product qualification
- Stable: explicit promotion after the qualification ladder

The `1.0.0` target remains unscheduled.

Detailed live state belongs to GitHub issue #1155 and the
[v0.44 issue graph](./v0.44.0-ISSUES.md).
Execution follows [PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md).
