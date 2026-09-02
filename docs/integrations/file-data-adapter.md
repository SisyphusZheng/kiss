# Data recipe (FileDataAdapter)

> Status: **verified against 0.42.0 source** — executed end-to-end on a
> scratch app built from this repository: a request-time route's loader
> read two JSON files through the adapter and rendered their contents.
> Not CI-gated; reproduce with the steps below. The route example below is
> written in the current v0.44 compiled-class authoring form; the recorded
> verification run predates that re-authoring.

ADR-0095 deferred the file-backed data adapter to recipe level; this is
that recipe. Two drift notes against the ADR's original sketch:

1. The framework's own `DataAdapter` / `MemoryDataAdapter` types were
   removed in v0.41 — the interface below is **recipe-owned**, not
   imported from `@openelement/element`.
2. ADR-0123 item 8 records that data adapters adopt the **unstorage**
   interface as the de-facto KV standard, so the recipe mirrors the
   unstorage read surface (`getItem` returns `null` on a miss, `keys`
   enumerates) instead of the ADR-0095 `get`/`keys?` sketch. Swapping in
   real unstorage later is mechanical.

The adapter runs only inside loaders and actions, which are server
functions on a `renderIntent: { mode: 'dynamic' }` route and never ship
to the client bundle — so `Deno.readTextFile` here does not violate the
"framework core imports zero platform APIs" rule (that rule binds the
framework, not app code).

```ts
// app/data/file-adapter.ts
export interface DataAdapter<T = unknown> {
  name: string;
  getItem(key: string): Promise<T | null>;
  keys(): Promise<string[]>;
}

/** Read-only JSON-file adapter: getItem('hello') reads `${dir}/hello.json`. */
export function createFileDataAdapter<T = unknown>(dir: string): DataAdapter<T> {
  return {
    name: `file:${dir}`,
    async getItem(key: string): Promise<T | null> {
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) return null; // no path traversal
      try {
        const text = await Deno.readTextFile(`${dir}/${key}.json`);
        return JSON.parse(text) as T;
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) return null;
        throw err;
      }
    },
    async keys(): Promise<string[]> {
      const out: string[] = [];
      for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile && entry.name.endsWith('.json')) {
          out.push(entry.name.slice(0, -'.json'.length));
        }
      }
      return out.sort();
    },
  };
}
```

Wired into a blog-like request-time route (the page is a compiled element
class; the default projection maps loader-data record entries onto the
compiled properties):

```tsx
// app/components/page-notes.tsx — compiled by the open:compiled-element transform
import { element, OpenElement, property } from '@openelement/element';

interface NoteItem {
  key: string;
  note: { title: string; body: string } | null;
}

@element('notes-page', { root: 'shadow-open' })
export default class NotesPage extends OpenElement {
  @property({ reflect: false, attribute: false })
  items: NoteItem[] = [];

  render() {
    return (
      <ul>
        {this.items.map(({ key, note }) => <li>{key}: {note?.title} — {note?.body}</li>)}
      </ul>
    );
  }
}
```

```ts
// app/routes/notes.tsx
import { definePage } from '@openelement/app';
import NotesPage from '../components/page-notes.tsx';
import { createFileDataAdapter } from '../data/file-adapter.ts';

interface Note {
  title: string;
  body: string;
}

const notes = createFileDataAdapter<Note>('./data/notes');

export async function loader() {
  const keys = await notes.keys();
  const items = await Promise.all(
    keys.map(async (k) => ({ key: k, note: await notes.getItem(k) })),
  );
  return { items };
}

export default definePage(NotesPage, {
  renderIntent: { mode: 'dynamic' },
});
```

Verification evidence (`deno task build && deno task start`, with
`data/notes/hello.json` and `data/notes/todo.json` on disk): `GET /notes`
rendered both entries — `hello: Hello — first note from the filesystem`
and `todo: Todo — ship the recipes`.

Build-time vs request-time: if the files are static content, prefer the
content module or a plain build-time import — the adapter earns its keep
when the data changes between deploys (editors dropping JSON into a
directory, a CMS export, a mounted volume).
