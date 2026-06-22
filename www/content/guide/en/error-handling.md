---
title: 'Error Handling'
section: 'Production'
label: 'Error Handling'
order: 30
---

# Error Handling

openElement separates build-time framework errors, route render errors, API
errors, and browser island failures.

## Build Errors

Build-time errors should fail loudly. Optional package misses can degrade, but a
present package that throws during import should be visible in diagnostics.

## Route Render Errors

SSG and SSR route render failures are logged with the route path. Production
responses avoid leaking internal stack traces.

## API Errors

Use structured response helpers for server route and action errors.
Operational errors should carry a clear HTTP status and message; programming
errors should fail the build or server route.

## Browser Errors

Island upgrade failures should stay scoped to the island and remain diagnosable
through browser logs and e2e tests.
