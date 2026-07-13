# UI Token and Recipe Contract

The UI package vendors an audited subset of Open Props scales at build time. It
has no runtime stylesheet or CDN dependency. Raw scales are implementation
inputs; public components consume semantic roles only.

```text
Open Props subset
  -> semantic roles (surface, text, brand, focus, motion, elevation)
    -> control/surface/overlay recipes
      -> ten Web Component primitives
```

Current gates require `--surface-glass`, `--ui-control-bg`, `--focus-ring` and
`--motion-standard`. `daisyClassSheet`, modal and step-card are retired and
must not reappear in exports, manifests, docs or packed artifacts.
