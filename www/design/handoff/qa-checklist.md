# WWW Cinematic QA Checklist

## Visual and content

- [ ] Desktop/mobile dark and light captures preserve `<open/>`, violet depth,
      readable type and a single clear scene per viewport.
- [ ] The homepage begins with real HTML title, lede and CTAs, not a canvas,
      video or loading state.
- [ ] The five-step film accurately shows Element, DSD, islands, portable
      output and the public starter.
- [ ] Docs, API, Architecture and Roadmap use expressive short heroes; long
      reading pages stay calm and legible.

## Motion and access

- [ ] Keyboard focus restores the command bar and every link remains usable.
- [ ] Reduced motion has complete static scenes and no hidden information.
- [ ] WebGL unavailable and context-loss paths retain a polished CSS backdrop.
- [ ] Touch, 200% zoom, screen reader labels and theme persistence pass.

## Performance and proof

- [ ] First paint and LCP do not await a client island or WebGL.
- [ ] Atmosphere is lazy, capped for low power and stops when disconnected.
- [ ] No animation causes visible layout shift.
- [ ] Build, truth checks, typecheck, test suite and Chromium/Firefox/WebKit
      browser gates pass before release.
