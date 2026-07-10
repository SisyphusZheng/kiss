# Reader Verification Workflows

Reader is the regression-grade dogfood app for the OpenElement framework. Run
these workflows before tagging an alpha release that touches the app model,
router, UI, Open Props tokens, SPA mode, Deno Desktop host behavior, or Reader.

## Smoke matrix

| Area                         | Evidence                                                              |
| ---------------------------- | --------------------------------------------------------------------- |
| Browser app boot             | Browser dev server smoke, `test:visual-smoke`                         |
| Deno Desktop target          | Deno Desktop smoke, `desktop-reader:smoke`                            |
| Local fixture source         | `desktop-reader:smoke` host-store tests                               |
| Local folder source          | `desktop-reader:smoke` host-store tests                               |
| GitHub PDF source            | `desktop-reader:smoke` host-store tests                               |
| PDF/text reading             | Browser smoke, `test:visual-smoke`                                    |
| Search                       | `desktop-reader:smoke` host-store tests                               |
| Annotation and note jump     | Browser smoke, Reader route tests                                     |
| Markdown export              | `desktop-reader:smoke` export tests                                   |
| Reading settings             | Browser smoke, storage tests                                          |
| OpenElement UI/Open Props    | `test:visual-smoke`, UI package tests                                 |
| Preact islands               | `desktop-reader:smoke` (island registration)                          |
| Third-party WC compatibility | `desktop-reader:smoke` (`/wc-interop` VNode tag smoke), browser smoke |
| Desktop/narrow screenshots   | `test:visual-smoke`                                                   |

## Automated release checks

```sh
deno task desktop-reader:smoke
deno task test:visual-smoke
```

`desktop-reader:smoke` runs the Reader unit and host-store tests. It fails when
core Reader workflows regress. `test:visual-smoke` builds the docs site and
Reader, then captures screenshot evidence for the docs shell and Reader shell.

## Browser dev server smoke

1. Start the dev server:
   ```sh
   deno task --cwd examples/deno-desktop-reader dev
   ```
2. Open http://localhost:5173 in a browser.
3. Verify the bookshelf loads with fixture books.
4. Click a book cover → reading page opens with a three-column shell.
5. Navigate pages with arrow keys and toolbar buttons.
6. Select text in the PDF text page → selection toolbar appears.
7. Click "做笔记" → note form pre-fills with the selected quote.
8. Type a thought and save → note appears in the right rail under "已保存".
9. Open `/notes` → the saved note is grouped by book.
10. Click "导出 Markdown" → a `.md` file downloads with YAML frontmatter.
11. Open `/settings`:
    - Change theme → page theme updates immediately.
    - Change font size, line height, and measure → open a book and verify the
      PDF text page reflects the new preferences.
    - Add a local source path (or use the "选择文件夹" picker on macOS) and
      sync → new books appear on the shelf.
12. Run unit tests:
    ```sh
    deno task --cwd examples/deno-desktop-reader test
    ```
13. Open `/wc-interop` and verify the third-party Web Component interop route
    renders.

## Deno Desktop smoke

1. Build the SPA:
   ```sh
   deno task --cwd examples/deno-desktop-reader build
   ```
2. Start the desktop server:
   ```sh
   deno task --cwd examples/deno-desktop-reader start
   ```
3. Open the printed local URL in a browser (or load it in the webview shell).
4. Verify the desktop bridge injection:
   - `window.__OPEN_READER_DESKTOP_HOST__` is `true`.
5. Repeat steps 3–11 from the browser smoke workflow.
6. Verify the `/api/dialog/directory` picker works on macOS and returns a path.
7. Add a GitHub source (public repo with PDFs) and sync → books download to
   `~/.open-reader/books` and appear on the shelf.
8. Close the app with `Cmd/Ctrl + W` or navigate away → `/api/app/close` is
   called and the Deno process exits cleanly.

> When filing issues, track close/minimize/maximize regressions separately from
> browser UI regressions.

## Expected artifacts

- `~/.open-reader/state.json` contains sources, books, notes, and progress.
- `~/.open-reader/books/` caches GitHub PDFs.
- `~/.open-reader/search-index.json` is generated after sync.
