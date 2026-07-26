# Application Loop Framework Research (2026-07-27)

Six commissioned research reports on how mainstream frameworks design their
data-interaction loop, commissioned as the evidence base for
[`ADR-0120`](../../adr/ADR-0120-0-42-0-wc-application-loop-scope.md) and the
`v0.42.0` version plan. Each report follows the same seven dimensions (loader
contract, action/form wire format, error/redirect semantics, revalidation,
rendering continuity, static/request-time hybrid, WC/DSD transferability) and
cites official documentation URLs for every API claim; unverifiable points are
marked 未证实 in place.

| Report                                           | Framework                                       | One-line takeaway for 0.42                                                    |
| ------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| [remix-react-router.md](./remix-react-router.md) | Remix / React Router v7 (origin of the pattern) | Auto-revalidation after action is the loop invariant; config-level prerender. |
| [sveltekit.md](./sveltekit.md)                   | SvelteKit 2.x (form actions + use:enhance)      | One POST, two responses; `ActionResult` discriminated union; page options.    |
| [astro.md](./astro.md)                           | Astro 4.15+ (Actions / endpoints)               | `getActionResult` same-request re-render; PRG left as recipe (our opening).   |
| [fresh.md](./fresh.md)                           | Fresh 2.x (Deno, handlers + partials)           | `{ data }` convention; named Partial protocol is pure HTML attributes.        |
| [enhance.md](./enhance.md)                       | Enhance (closest WC fullstack, light-DOM)       | Dual-mode handler by content negotiation; `{ json, location, ... }` vocab.    |
| [hotwire-htmx.md](./hotwire-htmx.md)             | Turbo 8 / Stimulus 3 + htmx 2.x                 | Three-state status protocol (303/422/stream); morph + permanent for state.    |

## Cross-framework conclusions (fed into ADR-0120)

1. **Wire format convergence**: all six use standard HTML form POST with no
   framework-private protocol; only GET/POST are safe for progressive
   enhancement.
2. **Progressive enhancement shape**: SvelteKit's "same POST, two responses"
   (full HTML vs a serialized action result selected by header) plus Turbo's
   three-state status rule (303 on success, 422 on validation failure, never
   200-render a POST success) define the 0.42 action protocol.
3. **Error dichotomy**: throw → exception channel (nearest error boundary),
   return → expected-failure channel (validation errors with field echo).
4. **Revalidation**: Remix's "all loaders re-run after action" is the loop
   invariant and is free in a server-rerender (DSD) world.
5. **Rendering continuity**: vDOM-based continuity does not transfer; the
   WC-portable design space is Fresh's named-partial attribute protocol plus
   Hotwire's idiomorph-style morph with a preserve/permanent escape hatch.
6. **The WC + DSD + static-first slot is empty**: Enhance (closest) is
   light-DOM by doctrine and slowed after the Sanity acquisition; Fresh is
   request-time-first and Preact-bound.
