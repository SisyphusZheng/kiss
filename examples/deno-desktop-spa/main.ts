Deno.serve((_req) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>openElement Desktop</title>
  <script type="importmap">
    {
      "imports": {
        "@openelement/app": "https://esm.sh/@openelement/app@0.41.0-alpha.6"
      }
    }
  </script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    button { padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; background: #f0f0f0; }
    button:hover { background: #e0e0e0; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import { defineApp } from '@openelement/app';
    const app = defineApp({ mode: 'spa' });
    // ponytail: routes/index.tsx not yet wired (proof infrastructure only).
// Import and pass routes when SPA router manifest is integrated.
app.mount('#root');
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: { 'content-type': 'text/html' },
  });
});
