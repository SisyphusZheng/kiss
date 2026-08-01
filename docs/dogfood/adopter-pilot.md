# External Adopter Pilot Kit (#390)

> **Retired by [ADR-0119](../adr/ADR-0119-stable-0-41-0-scoped-interface-freeze.md).**
> The #390 external adopter pilot requirement was retired by maintainer decision
> after zero recruitment across three release cycles. This kit is preserved as
> historical evidence only; it is no longer an active recruitment path.

This kit is the single entry point for non-maintainer participants of the
external adopter pilot tracked in issue #390. It is intentionally self-contained:
no private maintainer instructions are required or allowed.

Pilot target release: `0.41.0-alpha.16` (or the current `alpha` dist-tag).

## What we ask of you

1. Between 60 and 120 minutes of your time.
2. Attempt the journey below alone, exactly as written. If something is
   unclear, do not ask us — record the confusion instead. The confusion is
   the data.
3. Fill in the result template at the bottom and return it by the channel
   you were recruited through.

## Consent and privacy

- Participation is voluntary; you may stop at any time.
- We publish only an anonymized aggregate summary: timing buckets, failure
  counts, paraphrased confusion points. We never publish your name, employer,
  machine details beyond OS family, or command output containing personal
  paths — the template asks you to strip those.
- Raw submissions are visible only to maintainers and are deleted after the
  aggregate summary is published.

## The journey

Work through these in order and time each stage separately.

1. **Start.** Run `deno run -A npm:@openelement/create my-app`, then
   `cd my-app && deno task dev`. Note the time from first command to a
   serving page.
2. **Author.** Create a small custom element of your choice and use it on a
   page. Note anything you had to look up.
3. **Render.** Confirm the page renders server-side (view-source shows the
   declarative shadow DOM) and that your element still works after reload.
4. **Interact.** Add an interactive island (for example a counter) and
   verify it responds in the browser.
5. **Deploy.** Run `deno task build` and deploy the output to any Node or
   Workers host you already use, following only the generated project's
   README. Record the platform and outcome.

## What to record

- Stage timings (wall clock, approximate is fine).
- Every command that failed, with the exact error text (strip personal
  paths).
- Every moment you were confused about what a word or concept meant.
- Anything you expected to work differently.

## Result template

```text
OS family:        (macOS / Windows / Linux)
Deno version:
Prior Web Components experience: (none / some / daily)

Stage timings:
  start:     X min   (worked? y/n)
  author:    X min   (worked? y/n)
  render:    X min   (worked? y/n)
  interact:  X min   (worked? y/n)
  deploy:    X min   (worked? y/n, platform)

Failed commands (verbatim, personal paths stripped):
1.

Confusion points (paraphrased is fine):
1.

Severity for you: (blocker / annoyance / cosmetic) per item above.
Free notes:
```

## How findings are handled

Every P0/P1 finding becomes a tracked repository issue. P0 findings are fixed
before any stable-release decision; P1 findings are fixed or explicitly block
stable readiness. Stars and page views are not evidence; completed journeys are.
