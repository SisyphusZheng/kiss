# Homepage Spec — The Web, composed.

The homepage is OpenElement's flagship dogfood. The first viewport contains
real HTML: `<open/>`, the title **The Web, composed.**, a short product lede,
published version, `Start building`, and `Watch it unfold`. None depend on
JavaScript.

## Storyboard

1. **Element** — a native Custom Element is the durable application boundary.
2. **DSD** — Shadow DOM becomes visible as browser-native, static output.
3. **Islands** — only selected components wake for interaction.
4. **Output** — one composition reaches Browser, Node and Workers.
5. **Begin** — public starter command and final build CTA.

The opening `<open/>` aperture is the visual prologue, not a separate product
claim. Scene content is concise; detailed architecture lives behind real Docs,
API, Architecture and Roadmap links.

## Interaction

- The desktop film may use long scroll scenes and spatial transforms.
- Mobile uses the same narrative in vertical scenes with reduced parallel
  movement.
- `Watch it unfold` anchors scene one. All CTA links remain native anchors.
- WebGL atmosphere is optional; a CSS violet field remains if it does not run.

## Non-negotiable checks

- No screenshots, videos or fake controls replace framework behaviour.
- `prefers-reduced-motion` makes every scene readable without animation.
- The first paint and LCP do not wait for a client island.
- Every scene has meaningful text and a visible keyboard focus path.
