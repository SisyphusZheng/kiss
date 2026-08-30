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

## Beta.1 branch convergence

ADR-0149 assigns Beta.1 one fail-closed remote branch convergence after the first
public v0.44 framework release has durable exact-SHA evidence.

1. Inventory every remote head and record its owner, SHA, pull-request state and
   disposition.
2. Merge, close, retarget or explicitly carry forward every open pull request before
   considering its head branch for deletion.
3. Delete only an explicit reviewed list of exact branch names. Globs, force-pushes,
   name-based ownership guesses and deletion of unknown-owned branches are forbidden.
4. Read back the remote heads and require `dev` and `main` to be the only long-lived
   pair at gate completion.
5. Treat local branches and user worktrees as separate state; this remote convergence
   never recursively deletes them.

After convergence, every Beta work branch starts from `dev` and is deleted after its
PR is merged or closed.
