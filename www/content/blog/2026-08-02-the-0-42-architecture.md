---
title: 'The 0.42 architecture: an onion, two bloodlines, and a morph'
date: '2026-08-02'
type: 'dispatch'
tags: ['architecture', 'decision', 'release-truth']
draft: false
hidden: false
---

With the 0.42 line at alpha.12, the WC light-fullstack surface is complete
enough to explain as one coherent design instead of a changelog. This post
is that explanation: the three decisions that define 0.42, why we made
them, and what they cost.

## Decision 1: the stack is an onion

OpenElement is five packages, but architecturally it is three shells:

- **`element`** — the component model: Web Components + JSX + signals +
  Declarative Shadow DOM + real DOM. No virtual DOM anywhere.
- **`app`** — the page/data protocol: routes, loaders, actions, the
  fail/redirect error algebra.
- **`adapter-vite`** — the build/deploy shell: SSG, code generation, the
  enhancement client, Nitro output, the CLI.

Dependencies point strictly inward: `element` knows nothing of `app`, and
`app` knows nothing of the adapter. You can use the component model alone
(it is a published package), and you can swap the build shell without
touching a component.

What makes the onion load-bearing is the material of its seams. The page
layer composes components through **W3C standards only** — tag names,
attributes, and DSD. Not through any framework-private component API. That
is why a third-party Web Component off npm works as a page component with
zero adapters, and why it survives page updates intact. The shell speaks
the language every component already knows.

## Decision 2: two update mechanisms, each in its own shell

The question we get most: "you have signals — why not let signals drive
the whole page?" Because state ownership differs by layer, and the update
mechanism should follow ownership.

**Inside a component, the component owns the state.** Open/closed,
draft text, playback position — this state is born in the browser and dies
there. Fine-grained signals are the perfect tool: `signal`/`computed`/
`effect` with `data-signal` bindings update exactly the DOM nodes that
depend on them. This layer is philosophically SolidJS-shaped: JSX, real
DOM, no vdom, surgical updates.

**Across a page, the server owns the state.** Loader data comes from a
database the browser cannot see. If the client held a reactive copy, we
would owe you a cache, an invalidation policy, optimistic updates, race
handling — an entire client data layer, plus a whole category of
staleness bugs. So the page layer refuses to hold one. When an action
completes, the server re-runs the loader and re-renders the page; the
client's enhancement script **morphs** the returned HTML into the live
tree, aligning elements by `id` and touching only what changed. Islands
that were not touched keep their signal state, their scroll, their focus.

Two mechanisms, yes — but each is small because each only covers what it
owns. The alternative is one mechanism that must cover everything, and
"signals everywhere" is not smaller: it is a full client data layer, and
it kills the property below.

## Decision 3: the no-JavaScript baseline is a hard requirement

Every page path must work with JavaScript disabled — not as a slogan, as
a test. The e2e suite runs the full load → DSD render → form → action →
error/redirect → revalidation loop with `javaScriptEnabled: false`, in
three browser engines. This is the decision that constrains all the
others, and the reason the page layer cannot be signal-driven: if page
updates required evaluating a signal graph, the baseline would die.

The upside is that progressive enhancement stops being a promise and
becomes a construction. Without JS, a form is a native POST with a 303
redirect — 1995, but it always works. With JS, the same form is a fetch
plus a morph — same response, smarter landing. There is no second code
path to keep honest, because the protocol is defined by the native path
and the enhanced path merely negotiates a better encoding of it.

A bonus constraint we did not expect to love: because the morph client
aligns DOM by `id` and understands DSD templates, it treats a hand-written
custom element and an element-authored component identically. The
component-model-agnostic seam from Decision 1 holds under updates, not
just at first render.

## What 0.42 deliberately is not

Recorded here so the marketing never drifts ahead of the code: 0.42 has
**no framework sessions or flash, no cache/ISR, no streaming SSR, no
performance SLOs**. `renderIntent.revalidate` is forward-compat manifest
data, inert by design. Signed-in apps are supported today through the
better-auth recipe; framework-level session primitives are 0.44 scope.
These are the TP-6 freeze boundaries, written down in ADR-0122, and they
are what "light" means in "light fullstack".

## The honest scorecard

Six full-spectrum audits later (issues #539–#852, all closed), every
ADR-0120 protocol rule has a mechanical gate or a contract test — none
rests on prose. The CSRF floor has real deny/allow e2e. The static 0.41.x
line upgrades with zero changes. What we do not have yet is the only
evidence that cannot be manufactured in-repo: an external user. If this
architecture sounds like your next site — content-heavy, a few forms,
standards you can keep — the alpha line is on npm under the `alpha`
dist-tag, and the onboarding gap report we want most is yours.
