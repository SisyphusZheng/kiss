# Branching Strategy

> Part of openElement governance. Referenced by `docs/governance/PROJECT_WORKFLOW.md`.

## Branch Model: Trunk-Based + AutoFlow Cells

```
main ←── merge (CI 全绿) ── dev
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
        autoflow/           fix/desync-       feat/island-
        cell-v0.x-001       status-version    hydration
        (autoflow 自创)     (bug fix)         (feature)
```

## Branch Types

| Prefix            | Purpose                 | From  | Merge To   | Created By    |
| ----------------- | ----------------------- | ----- | ---------- | ------------- |
| `dev`             | Development trunk       | —     | `main`     | human/agent   |
| `main`            | Release trunk           | —     | —          | CI merge only |
| `fix/*`           | Bug fix                 | `dev` | `dev` (PR) | human/agent   |
| `feat/*`          | Feature                 | `dev` | `dev` (PR) | human/agent   |
| `autoflow/cell-*` | AutoFlow cell execution | `dev` | `dev` (PR) | autoflow      |

## Rules

1. **Never commit directly to `main`.** `main` only accepts merges from `dev`.
2. **`autoflow/cell-*` branches are ephemeral.** Merged → deleted. Failed → deleted.
3. **`dev` is the active development line.** All new version work happens here.
4. **Push `dev` before merging to `main`.** Wait for CI on `dev` first.
5. **Tag only on `main`** after CI passes.
6. **Never force-push `main` or `dev`.**
