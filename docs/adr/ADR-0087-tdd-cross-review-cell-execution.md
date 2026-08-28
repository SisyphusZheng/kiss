# ADR-0087: TDD + AI Cross-Review as Cell Execution Subphases

- **Status:** Proposed
- **Date:** 2026-06-06
- **Decision:** Each autonomous Cell executes in three subphases under the
  `executing` lifecycle state: `.testgen` (write tests first), `.implement`
  (TDD red-green loop), `.review` (multi-agent AI cross-review). A Cell only
  transitions to `harness` when all three subphases pass.

## Context

AutoFlow2 v0.36 introduces autonomous Cell execution on isolated git branches.
When an AI agent generates code on a branch, we need verification mechanisms
that are (a) deterministic, (b) statable as evidence, and (c) within the
boundary of mechanical autonomy (Brooks' accidental difficulties).

External academic evidence:

| Paper                  | Venue      | Key Finding                                                                                                             |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| R1 (arXiv 2402.13521)  | ASE 2024   | Including tests in prompt → consistent LLM code-gen success rate increase (MBPP + HumanEval, frontier code models)      |
| R7 (arXiv 2312.04687)  | IEEE 2024  | LLM4TDD: iterative test-first generation outperforms direct code-gen                                                    |
| R2 (arXiv 2402.02172)  | EMNLP 2024 | CodeAgent: multi-agent review with supervisory QA-Checker detects inconsistencies, vulnerabilities, and incorrect fixes |
| R3 (arXiv 2504.20093)  | 2025       | Self-Healing loop: Monitor→Diagnose→Plan→Repair→Verify requires verification before merge                               |
| R11 (arXiv 2401.02316) | ICSE 2025  | D4C: aligning LLM repair objective with test outcomes improves fix correctness                                          |
| R12 (arXiv 2403.17134) | ICSE 2025  | RepairAgent: autonomous LLM agent for program repair, validated on Defects4J                                            |

These papers collectively demonstrate that (1) test-first generation yields
higher-quality code, and (2) multi-agent cross-review catches errors that
single-pass generation misses.

## Decision

### Cell Execution Subphases

```
executing (parent state)
  ├── .testgen    → LLM generates test cases for the target change
  │                  Output: test file(s) committed to branch
  │                  Evidence: tests-written event → Ledger
  │
  ├── .implement  → TDD loop: write code → run tests → fail → fix → pass
  │                  Max iterations: 5 before escalation
  │                  Output: implementation code committed
  │                  Evidence: tests-pass event → Ledger
  │
  └── .review     → Multi-agent cross-review
       ├── Reviewer-A: correctness (does it match the spec?)
       ├── Reviewer-B: safety (edge cases, security, error handling)
       └── QA-Checker: consensus (do Reviewer-A and Reviewer-B agree?)
                    Output: review report committed to branch
                    Evidence: review-passed or review-failed event → Ledger
```

### Cross-Review Agent Design

Each review sub-agent receives:

- The diff (git diff from base to current commit)
- The cell's task description
- The test cases generated in `.testgen`
- The relevant governance docs (SOP, ADR references)

Reviewer-A evaluates correctness against the task spec.
Reviewer-B evaluates safety, edge cases, and code quality.
QA-Checker evaluates whether Reviewers A and B converge.

If QA-Checker detects disagreement → `.implement` is re-entered with
specific review feedback attached to the task context.

### Review is advisory, Harness is authoritative

The review subphase acts as an enhanced filter before Harness, not a
replacement. If review passes but Harness fails (fmt/lint/typecheck/test),
the cell enters `failed:retriable`. If review fails but Harness would pass,
the cell still proceeds — review is advisory.

Rationale: review agents (LLMs) can hallucinate. Harness gates (deno fmt,
deno lint, deno test, etc.) are deterministic. A false negative from review
should not block a correct change.

### Evidence

Every subphase transition writes an event to the Cell Evidence Ledger:

```json
{"type": "tests-written", "cellId": "cell-v0.36.0-001", "testFiles": 3}
{"type": "tests-pass", "cellId": "cell-v0.36.0-001", "iterations": 2}
{"type": "review-passed", "cellId": "cell-v0.36.0-001", "qaCheckerConsensus": true}
```

## Consequences

- **Positive**: Each autonomous change has a verifiable evidence chain:
  tests → implementation → review → harness. This satisfies both Pnueli
  invariance (□(commit → ◇test ∧ ◇review ∧ ◇harness)) and Durable Execution
  replay requirements.
- **Positive**: TDD subphase naturally produces test coverage for every
  autonomous change — addressing Lehman's quality decline (C3).
- **Negative**: Multi-agent review doubles the LLM inference cost per cell.
  For low-risk cells (fmt-fix, version-bump), review is configurable to
  skip (risk-based tiering — see ADR-0088).
- **Negative**: Review agents can hallucinate false negatives. QA-Checker
  consensus reduces but does not eliminate this risk.

## References

- R1: "Test-Driven Development for Code Generation" (arXiv 2402.13521, ASE 2024)
- R2: "CodeAgent: Autonomous Communicative Agents for Code Review" (arXiv 2402.02172, EMNLP 2024)
- R7: "LLM4TDD: Best Practices for TDD Using LLMs" (arXiv 2312.04687, IEEE 2024)
- R3: "Self-Healing Software" (arXiv 2504.20093, 2025)
- R11: "D4C: Aligning LLM Program Repair" (arXiv 2401.02316, ICSE 2025)
- R12: "RepairAgent: Autonomous LLM Program Repair" (arXiv 2403.17134, ICSE 2025)
- C3: Lehman Software Evolution Laws
- C5: Pnueli Temporal Logic of Programs
- C4: Brooks "No Silver Bullet" (essential vs accidental)
