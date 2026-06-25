# openElement Desktop SPA Proof

Runs openElement SPA mode inside a Deno Desktop window (deno canary).

## Setup

Install deno canary:

```sh
deno upgrade canary
```

## Run

```sh
deno task dev      # Run as HTTP server (development)
deno task build    # Compile to desktop binary
./deno-desktop-spa # Open desktop window (macOS)
```

## Architecture

- `main.ts` — `Deno.serve()` HTTP server + `defineApp({ mode: 'spa' })` SPA
  bootstrap
- `routes/index.tsx` — SPA page with interactive counter
- `deno.json` — desktop config: webview backend, 1024×768 window
- Deno Desktop compiles the project to a self-contained binary
