# openElement AutoWorkflow

> Status: Mandatory project workflow. Every human maintainer and AI assistant
> must read this document before planning, implementing, reviewing, or releasing
> work in this repository.

## Goal

AutoWorkflow turns project management into repository evidence. A change is not
complete because an issue, chat message, or SOP says it is complete. It is
complete only when the repository contains the decision, the execution package,
the implementation, and the gates that prove the claim.

Current execution anchor:

- source package line `v0.43.3`;
- npm registry line `v0.43.3` (published);
- active target `v0.44.0-alpha.0`;
- next planned target `v0.44.0-alpha.1`.

ADR-0143 explicitly reopens the minor train after the 0.43 maintenance freeze.
The compiled OpenElement execution order and alpha → beta.1 UI → beta.2 website →
RC SaaS → Stable admission ladder live in `docs/current/VERSION_PLAN.md`; 0.43.x
remains the stable maintenance fallback until 0.44 reaches stable.
OpenElement is one Web Components-native,
static-first application framework: Basic Element is an authoring mode, not a
second product. Beta names product-qualification boundaries, not a second
architecture or product line.

## Required Reading Order

Read these files before starting work:

1. `docs/governance/PROJECT_WORKFLOW.md`
2. `docs/status/STATUS.md`
3. `docs/roadmap/ROADMAP.md`
4. the active version plan under `docs/current/VERSION_PLAN.md`
5. relevant ADRs listed by the version plan

For autonomous v0.44 alpha/beta execution, also read
`docs/governance/V044_AGENT_LOOP_SOP.md`,
`docs/governance/V044_ISSUE_SOP.md` and
`docs/current/v0.44.0-EXECUTION-PLAN.md` before selecting work.

If these documents disagree, stop and fix the documents before changing product
code. The workflow is part of the product contract.

## Document Roles

| Layer       | Location                   | Purpose                                                                 |
| ----------- | -------------------------- | ----------------------------------------------------------------------- |
| Governance  | `docs/governance/`         | Mandatory process and release rules                                     |
| Status      | `docs/status/STATUS.md`    | Current truth, active line, and release gate order                      |
| Roadmap     | `docs/roadmap/`            | Version sequence and product direction                                  |
| ADR         | `docs/adr/`                | Architectural decisions and irreversible trade-offs                     |
| VersionPlan | `docs/current/`            | Active version contract: goals, tasks, verification                     |
| Changelog   | `CHANGELOG.md` (repo root) | Aggregated history only; not re-synchronized release by release         |
| Release     | `docs/release/`            | Authoritative per-release record after local and remote gates are green |

## Active Version Plan

Every minor version must have an approved active version plan before
implementation starts. ADR-0101 consolidates release planning into one current
plan under `docs/current/`.

Required sections:

- objective and scope;
- non-goals;
- tasks;
- acceptance;
- test matrix;
- release evidence requirements.

## Execution Rules

- Start from repository evidence, not memory or chat history.
- Keep one public contract for each surface.
- Keep one renderer pipeline and one metadata/source-of-truth.
- Remove duplicate or obsolete code instead of adding compatibility shims.
- Do not claim a version-plan item is complete without a code, docs, test, or
  gate proof.
- Under ADR-0146, the thinker owns planning/review, the implementer owns
  implementation, and a fresh release verifier
  verifier owns test-driven alpha/beta closure. One role may not silently assume another
  role's authority.
- Do not bump packages until local gates for the version pass.
- For v0.41.0 and later, npm publish is a release exit gate. See ADR-0108.
- AutoFlow may automate patch-level mechanical work only when ADR-0101 policy
  checks prove there is no public API, package topology, minor/major roadmap,
  runtime-default, security, auth, database, or release-policy impact.
- AutoFlow must not decide minor, major, or v1 scope. Those require human ADR
  and approved version-plan evidence.
- Do not merge `dev` to `main` until `dev` CI is green.
- Do not tag until `main` CI is green.

## Pull Request Workflow

Every PR must identify:

- target version and active version plan;
- ADRs added or changed;
- version-plan tasks completed;
- local commands run;
- CI status;
- release-document impact.

If the change is architectural, add or update an ADR. If the change affects a
planned version, update the active version plan in the same PR.

## Release Workflow

Use this order for a minor release:

1. complete implementation against an ADR-backed, human-approved version plan;
2. update current docs and website content;
3. run local gates in `docs/status/STATUS.md`;
4. bump all packages only after implementation gates pass;
5. write changelog and release note;
6. run release gates including publish dry-run;
7. push `dev`;
8. wait for all `dev` CI jobs;
9. merge `dev` into `main`;
10. wait for all `main` CI jobs;
11. create and push the release tag;
12. publish the GitHub release note;
13. let the npm publish workflow run, or trigger local/CI publish manually;
14. close the version only after npm publish and post-publish npm consumer smoke
    evidence pass, unless a new ADR records an explicit exception.

For v0.41.0 and later, npm package visibility and post-publish npm consumer
smoke are release evidence, not telemetry. A version line is not closed until
the status, roadmap, release checklist, release note, and public README files
record the npm outcome truthfully.

Dist-tag policy (#607): prerelease publishes tag only their line
(`alpha`/`beta`/`rc`). **`latest` always tracks the last stable release** so
`npm install @openelement/*` never lands on alpha by default. Consumers who
want the alpha train use `@alpha` or an exact version. Stable publishes keep
npm's default `latest` tag. `tools/verify-npm-release.ts` asserts
`dist-tags.<prerelease>` for alphas and `dist-tags.latest` for stables.

## Automation Gates

`deno task workflow:check` verifies that the workflow itself remains visible and
that the active version plan has the required shape. AutoFlow3 is the single
gate and evidence control plane for hooks and CI.
