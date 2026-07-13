# WWW page architecture

The WWW has three deliberate densities. The home page is the long-form
cinematic proof. Entry pages use a short technical, editorial, timeline, or
error scene followed by quiet evidence. Guides and articles use the reading
shell: a 740px measure, stable rail, 1.7 line height, explicit code frames and
an unambiguous next step.

`open-page-hero`, `open-reading-shell`, and `open-section-frame` are WWW-only
structure. Product packages must not export them. Page authors provide facts
and real technical artifacts through slots; they do not duplicate navigation,
scroll coordination, glass panels, or hero geometry.

Dark is the reference mode; light is the violet daylight equivalent. Motion is
limited to View Transitions and small scene reveals away from the homepage.
Reduced-motion renders the completed composition without timing-dependent
content. Historical blog and changelog text is preserved verbatim while being
placed in the same reading shell.
