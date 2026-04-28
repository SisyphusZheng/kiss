/**
 * @kissjs/create — Minimal project scaffold for KISS framework.
 *
 * Usage: deno run -A jsr:@kissjs/create my-app
 *
 * KISS Architecture: Keep It Simple, Stupid.
 * One template, zero prompts, instant start.
 */

const TPL = {
  'deno.json': `{
  "tasks": {
    "dev": "deno run -A npm:vite",
    "build": "deno run -A npm:vite build",
    "preview": "deno run -A npm:vite preview"
  },
  "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"] }
}
`,
  'vite.config.ts': `import { kiss } from '@kissjs/core';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [kiss({
    html: { title: 'My KISS App' },
    // Use pre-built UI components from @kissjs/ui
    // (JSR distributes compiled JS — no decorator errors)
    packageIslands: ['@kissjs/ui'],
    // SSR must bundle @kissjs/ui (decorators need compilation)
    ssr: {
      noExternal: ['@kissjs/ui'],
    },
  })],
});
`,
  'app/routes/index.ts': `import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'home-page';
export default class HomePage extends LitElement {
  static styles = css\`
    :host { display: block; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    p { color: #666; }
  \`;

  render() {
    return html\`
      <h1>Hello KISS!</h1>
      <p>Your KISS app is running. Edit <code>app/routes/index.ts</code> to get started.</p>
      <my-counter></my-counter>
    \`;
  }
}
`,
  'app/islands/my-counter.ts': `import { css, html, LitElement } from '@kissjs/core';

export const tagName = 'my-counter';

export default class MyCounter extends LitElement {
  static override styles = css\`
    :host { display: inline-flex; gap: 0.5rem; align-items: center; margin-top: 1rem; }
    button { padding: 0.25rem 0.75rem; cursor: pointer; }
  \`;

  static override properties = { count: { type: Number } };

  count = 0;

  override render() {
    return html\`
      <button @click=\${() => this.count--}>−</button>
      <span>\${this.count}</span>
      <button @click=\${() => this.count++}>+</button>
    \`;
  }
}
`,
};

async function main() {
  const name = Deno.args[0];
  if (!name) {
    console.error('Usage: deno run -A jsr:@kissjs/create <project-name>');
    Deno.exit(1);
  }

  const dir = name;
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch {
    console.error(`Directory "${dir}" already exists.`);
    Deno.exit(1);
  }

  for (const [path, content] of Object.entries(TPL)) {
    const fullPath = `${dir}/${path}`;
    await Deno.mkdir(fullPath.substring(0, fullPath.lastIndexOf('/')), { recursive: true });
    await Deno.writeTextFile(fullPath, content);
    console.log(`  ✓ ${path}`);
  }

  console.log(`\n✨ KISS project created at ./${dir}/`);
  console.log(`\n  cd ${dir}`);
  console.log('  deno task dev');
}

main();
