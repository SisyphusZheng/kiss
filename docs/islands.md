# Islands Guide

Islands are the secret sauce of KISS. They let you add **interactivity only where needed**.

---

## The Problem with SPA Frameworks

Traditional SPA (React, Vue, etc.):
- **Entire page is JavaScript** (100KB+)
- Even static content needs JS to render
- Slow initial load, poor SEO

---

## The Islands Solution

KISS renders the **entire page on the server** (HTML + DSD).

Only components that need interactivity are "Islands" - they get hydrated on the client.

| Page Type | JS Size | Example |
|-----------|---------|---------|
| Pure static | **0 KB** | Blog post, About page |
| 1 Island | **~6 KB** | Counter, Theme toggle |
| 3 Islands | **~18 KB** | Dashboard with 3 widgets |

---

## Creating an Island

### 1. Create a file in `app/islands/`

```typescript
// app/islands/counter.ts
import { LitElement, html, css } from 'lit'

export class Counter extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
    }

    button {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      cursor: pointer;
    }
  `

  static properties = {
    count: { type: Number }
  }

  constructor() {
    super()
    this.count = 0
  }

  render() {
    return html`
      <p>Count: <strong>${this.count}</strong></p>
      <button @click=${() => this.count++}>Increment</button>
    `
  }
}

customElements.define('my-counter', Counter)
```

### 2. Use it in a route

```typescript
// app/routes/index.ts
import { LitElement, html, css } from 'lit'

export class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }
  `

  render() {
    return html`
      <h1>Home Page</h1>
      <p>This is static HTML (0 KB JS).</p>

      <h2>Counter Island</h2>
      <my-counter></my-counter>
      <!-- ^^^ This gets hydrated on the client -->
    `
  }
}

customElements.define('home-page', HomePage)
```

That's it! KISS automatically:
1. Detects `my-counter` is defined in `app/islands/`
2. Generates a hydration script
3. Injects it into the HTML
4. On the client, it hydrates only this component

---

## How It Works (Simplified)

### Server-Side (SSR)
```html
<!-- What the browser receives -->
<home-page>
  <h1>Home Page</h1>
  <p>This is static HTML (0 KB JS).</p>

  <h2>Counter Island</h2>
  <my-counter>
    #shadow-root (declarative)
      <p>Count: <strong>0</strong></p>
      <button>Increment</button>
  </my-counter>
</home-page>

<script type="module">
  // Only this Island gets hydrated
  import('/assets/counter.js')
  customElements.get('my-counter').prototype.connectedCallback?.()
</script>
```

### Client-Side (Hydration)
- Only `my-counter` loads JavaScript (~6 KB)
- The rest of the page stays as static HTML
- Event listeners get attached to the Island

---

## Progressive Enhancement Levels

KISS supports 5 levels of enhancement:

| Level | Content | JS Size | Use Case |
|-------|---------|---------|----------|
| **0** | Pure HTML + DSD | **0 KB** | Blog, Documentation |
| **1** | HTML + minimal JS | **~2 KB** | Form validation |
| **2** | Partial Islands | **~6 KB/island** | Counter, Theme toggle |
| **3** | Full page hydration | User choice | SPA-like experience |
| **4** | SPA mode | User choice | Real-time apps |

**Default: Level 0** (zero JS)

---

## Best Practices

### 1. Keep Islands small

❌ **Bad:**
```typescript
// app/islands/entire-page.ts
// Don't put the entire page in an Island!
```

✅ **Good:**
```typescript
// app/islands/counter.ts
// Only interactive parts become Islands
```

### 2. Use SSR-friendly code

Islands must work on both server and client:

```typescript
render() {
  // ❌ Bad: window is not available on server
  const width = window.innerWidth

  // ✅ Good: Check if browser
  const width = typeof window !== 'undefined' ? window.innerWidth : 0
}
```

### 3. Lazy load heavy dependencies

```typescript
// Inside an Island
async loadChart() {
  const { Chart } = await import('chart.js')
  // Use Chart...
}
```

---

## Advanced: Passing Props to Islands

You can pass props from the server to Islands:

```typescript
// app/routes/index.ts (server)
render() {
  const initialCount = 10
  return html`
    <my-counter .count=${initialCount}></my-counter>
  `
}
```

```typescript
// app/islands/counter.ts (client)
export class Counter extends LitElement {
  static properties = {
    count: { type: Number }
  }

  constructor() {
    super()
    this.count = 0 // Default value
  }
}
```

---

## Debugging Islands

### Check hydration status

Open browser DevTools → Network tab:
- **0 KB JS** → Pure static (Level 0)
- **~6 KB JS** → 1 Island hydrated (Level 2)
- **Multiple requests** → Multiple Islands

### Check Island registration

```javascript
// In browser console
customElements.get('my-counter')
// → Should return the class, not undefined
```

---

## Next Steps

- [API Routes](./api-routes.md) - Create backend endpoints
- [Deployment](./deployment.md) - Deploy to production
- Check `examples/minimal-blog/` for a working example
