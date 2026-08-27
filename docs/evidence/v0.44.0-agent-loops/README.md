# v0.44 Agent Loop Evidence

This directory is append-only execution evidence for ADR-0146. Chat transcripts and
raw model reasoning are not release evidence.

## Layout

```text
<loop-id>/
  dispatch.md
  executor-result.md
  review.md
  result.json
  summary.md

<candidate>-closure-<sha8>/
  closure-packet.md
  verifier-result.md
  closure-review.md
  result.json
  human-go.md
```

Do not overwrite a failed loop or closure directory. Repairs receive a new loop ID;
repaired candidates receive a new SHA directory and a fresh verifier session.

## Evidence rules

- Record exact commit SHA, package/artifact fingerprints, commands and exit codes.
- Link the owned GitHub issue and PR.
- Store summaries and observable outputs, not hidden chain-of-thought.
- Never store credentials, tokens, cookies or private provider configuration.
- PASS requires every mandatory command; partial matrices are FAIL or BLOCKED.
- `human-go.md` identifies the exact approved SHA and the approving maintainer message.

Use [`TEMPLATE.md`](./TEMPLATE.md) for dispatch and closure records.
