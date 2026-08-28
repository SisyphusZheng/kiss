# a0-002 local acceptance summary

## Outcome

The #1156 governance/control-plane slice is locally accepted at implementation
SHA `90880a5153a3dd5366eaa1f9ff784ab474b54e52`. The final PR head will be the
evidence-only descendant containing this record; PR CI must prove that exact
head before the slice may advance to `dev`.

Exact-SHA PR CI run `33140997895` rejected that head because `arch:check` found a forbidden
parser type escape; every other selected matrix gate passed. Repair 6 replaced the escape with
explicit validated construction at implementation SHA
`76f6e55935b5a06b4b6a8a1e49e534ed7505c295` and passed implementer plus thinker bounded review.
The next evidence-only descendant requires completely fresh exact-SHA PR CI. Neither the rejected
SHA nor its failed run may be reused.

## Accepted behavior

- PR CI is the sole full-matrix authority and tests the exact PR head SHA.
- The PR workflow emits one deterministic exact-SHA evidence artifact only
  after all required jobs succeed.
- Release entry fails closed on absent, stale, mismatched, weakened,
  unsupported, self-attested, or unsuccessful evidence and runs only
  complementary release gates after provenance validation.
- Release preparation runs the fast tier against the post-bump candidate and
  does not consume pre-bump evidence.
- Documentation is role-neutral with zero exemptions; executor identity lives
  only in executable configuration outside `docs/`.
- Historical migrations record paths and before/after blob hashes without
  repeating prohibited identifiers.
- Alpha.0 is an internal-only baseline with no tag, publication, release,
  dist-tag, `main` promotion, or external release action.
- Alpha.1–beta.2 require unanimous implementer, fresh release verifier, and
  thinker GO. #1178 remains the human RC decision.
- The PR-tested SHA advances through `dev` and `main` by fast-forward only; a
  moved base invalidates the candidate and requires a new PR-CI run.

## Pending proof

Local acceptance is not remote CI acceptance. The thinker must push the neutral
branch, open the PR to `dev`, wait for every required check, download and verify
the matching evidence artifact, and then advance `dev` to the exact proved head
by fast-forward only. Alpha.0 remains unpublished throughout.
