/**
 * Desktop Reader route registry.
 *
 * Each route component returns a DocumentFragment built with native DOM APIs.
 * A module-level router reference is used for navigation and param access.
 */
import { el, setStyles, text } from "./dom.ts";
import type { ReaderBook, ReaderNote } from "./types.ts";
import {
  deleteNote,
  loadNotes,
  loadProgress,
  loadSettings,
  saveNote,
  saveProgress,
  saveSettings,
} from "./storage.ts";
import { exportNotesToMarkdown } from "./export.ts";
import type { RouteConfig } from "@openelement/router/client-router";

// deno-lint-ignore no-explicit-any
let _router: any = null;

/** Called by reader.ts after mount to provide the router instance. */
// deno-lint-ignore no-explicit-any
export function setRouter(router: any): void {
  _router = router;
}

/** Used by keyboard handler in reader.ts. */
// deno-lint-ignore no-explicit-any
export function getRouter(): any {
  return _router;
}

function navigate(path: string): void {
  if (_router) {
    _router.navigate(path);
  }
}

function currentParams(): Record<string, string> {
  return _router?.params ?? {};
}

// ponytail: simple toast that lives outside #root so it survives routing
function showToast(message: string): void {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = el("div", { class: "toast" }, message);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ─── Fixtures ───────────────────────────────────────────────────

import booksJson from "../fixtures/books.json" with { type: "json" };

// ─── Route 1: / — Bookshelf ─────────────────────────────────────

function bookshelfRoute(): DocumentFragment {
  const frag = document.createDocumentFragment();

  const header = el("h1", {}, "My Books");
  frag.appendChild(header);

  if (booksJson.length === 0) {
    const empty = el("p", { class: "empty-state" }, "No books available");
    frag.appendChild(empty);
    return frag;
  }

  const grid = el("div", { class: "bookshelf-grid" });

  for (const book of booksJson) {
    const card = el("div", { class: "book-card" });

    const cover = el("div", { class: "book-cover" });
    setStyles(cover, { backgroundColor: book.coverColor });
    card.appendChild(cover);

    const title = el("h2", { class: "book-title" }, book.title);
    card.appendChild(title);

    const author = el("p", { class: "book-author" }, book.author);
    card.appendChild(author);

    const summary = el("p", { class: "book-summary" }, book.summary);
    card.appendChild(summary);

    const pages = el(
      "p",
      { class: "book-pages" },
      `${book.pageCount} pages`,
    );
    card.appendChild(pages);

    // Progress indicator
    const progress = loadProgress(book.id);
    if (progress && progress.pageNumber > 1) {
      const progressInd = el(
        "p",
        { class: "progress-indicator" },
        `Progress: Page ${progress.pageNumber} / ${book.pageCount}`,
      );
      card.appendChild(progressInd);

      const continueBtn = el(
        "button",
        { class: "continue-btn" },
        `Continue Reading (Page ${progress.pageNumber})`,
      );
      continueBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        navigate(`/books/${book.id}?page=${progress.pageNumber}`);
      });
      card.appendChild(continueBtn);
    }

    card.addEventListener("click", () => {
      navigate(`/books/${book.id}`);
    });

    grid.appendChild(card);
  }

  frag.appendChild(grid);
  return frag;
}

// ─── Route 2: /books/:id — Reading surface ──────────────────────

let _showAddNoteForm = false;

function readingRoute(): DocumentFragment {
  const params = currentParams();
  const bookId = params.id;
  const book = booksJson.find((b) => b.id === bookId) as
    | ReaderBook
    | undefined;

  const frag = document.createDocumentFragment();

  if (!book) {
    const header = el("h1", {}, "Book not found");
    frag.appendChild(header);
    const back = el("a", { href: "/" }, "← Back to Bookshelf");
    back.addEventListener("click", (e) => {
      e.preventDefault();
      navigate("/");
    });
    frag.appendChild(back);
    return frag;
  }

  const pageParam = parseInt(params.page || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const totalPages = book.pageCount;

  // Save reading progress
  saveProgress(book.id, page);

  // Header
  const title = el("h1", {}, book.title);
  frag.appendChild(title);

  const author = el("p", { class: "book-author" }, `by ${book.author}`);
  frag.appendChild(author);

  // PDF embed
  const embed = el("embed", {
    src: `/books/${book.fileName}#page=${page}`,
    type: "application/pdf",
    width: "100%",
    height: "600",
  });
  frag.appendChild(embed);

  // Page navigation
  const nav = el("div", { class: "page-nav" });

  const pageInfo = el(
    "span",
    { class: "page-info" },
    `Page ${page} of ${totalPages}`,
  );
  nav.appendChild(pageInfo);

  const prevBtn = el("button", {}, "← Previous") as HTMLButtonElement;
  prevBtn.disabled = page <= 1;
  prevBtn.addEventListener("click", () => {
    if (page > 1) {
      navigate(`/books/${book.id}?page=${page - 1}`);
    }
  });
  nav.appendChild(prevBtn);

  const nextBtn = el("button", {}, "Next →") as HTMLButtonElement;
  nextBtn.disabled = page >= totalPages;
  nextBtn.addEventListener("click", () => {
    if (page < totalPages) {
      navigate(`/books/${book.id}?page=${page + 1}`);
    }
  });
  nav.appendChild(nextBtn);

  frag.appendChild(nav);

  // Add note section
  const addNoteBtn = el("button", { class: "add-note-btn" }, "+ Add Note");
  addNoteBtn.addEventListener("click", () => {
    _showAddNoteForm = !_showAddNoteForm;
    // Re-render the component
    navigate(_router?.currentPath ?? `/books/${book.id}?page=${page}`);
  });
  frag.appendChild(addNoteBtn);

  if (_showAddNoteForm) {
    const noteForm = el("div", { class: "note-form" });

    const quoteLabel = el("label", {}, "Quote:");
    noteForm.appendChild(quoteLabel);

    const quoteInput = el("textarea", {
      class: "note-quote",
      rows: "3",
      placeholder: "Paste the passage you want to annotate...",
    });
    noteForm.appendChild(quoteInput);

    const noteLabel = el("label", {}, "Your Note:");
    noteForm.appendChild(noteLabel);

    const noteInput = el("textarea", {
      class: "note-text",
      rows: "4",
      placeholder: "Write your thoughts...",
    });
    noteForm.appendChild(noteInput);

    const saveBtn = el("button", {}, "Save Note");
    saveBtn.addEventListener("click", () => {
      const note = {
        id: crypto.randomUUID(),
        bookId: book.id,
        pageNumber: page,
        quote: (quoteInput as HTMLTextAreaElement).value,
        note: (noteInput as HTMLTextAreaElement).value,
        createdAt: new Date().toISOString(),
      };
      saveNote(note);
      _showAddNoteForm = false;
      showToast("Note saved!");
      navigate(`/books/${book.id}?page=${page}`);
    });
    noteForm.appendChild(saveBtn);

    frag.appendChild(noteForm);
  }

  return frag;
}

// ─── Route 3: /notes — Note list ────────────────────────────────

function notesRoute(): DocumentFragment {
  const frag = document.createDocumentFragment();

  const header = el("h1", {}, "Notes");
  frag.appendChild(header);

  const allNotes = loadNotes() as unknown as ReaderNote[];

  // Export button
  if (allNotes.length > 0) {
    const exportBtn = el(
      "button",
      { class: "export-btn" },
      "Export Notes (Markdown)",
    );
    exportBtn.addEventListener("click", () => {
      const books = booksJson as ReaderBook[];
      const md = exportNotesToMarkdown(allNotes, books);
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reader-notes.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Notes exported!");
    });
    frag.appendChild(exportBtn);
  }

  if (allNotes.length === 0) {
    const empty = el(
      "p",
      { class: "empty-state" },
      "No notes yet. Add notes from the reading surface.",
    );
    frag.appendChild(empty);
    return frag;
  }

  // Group notes by book
  const grouped = new Map<string, { book: ReaderBook; notes: ReaderNote[] }>();
  for (const note of allNotes) {
    const book = booksJson.find((b) => b.id === note.bookId) as
      | ReaderBook
      | undefined;
    if (!book) continue;

    if (!grouped.has(book.id)) {
      grouped.set(book.id, { book, notes: [] });
    }
    grouped.get(book.id)!.notes.push(note);
  }

  for (const [, { book, notes }] of grouped) {
    const bookSection = el("div", { class: "notes-book-section" });

    const bookTitle = el("h2", { class: "notes-book-title" }, book.title);
    bookSection.appendChild(bookTitle);

    for (const note of notes) {
      const noteCard = el("div", { class: "note-card" });

      if (note.quote) {
        const quoteEl = el(
          "blockquote",
          { class: "note-quote-preview" },
          note.quote,
        );
        noteCard.appendChild(quoteEl);
      }

      const noteText = el("p", { class: "note-text-preview" }, note.note);
      noteCard.appendChild(noteText);

      const meta = el(
        "p",
        { class: "note-meta" },
        `Page ${note.pageNumber} — ${
          new Date(note.createdAt).toLocaleDateString()
        }`,
      );
      noteCard.appendChild(meta);

      const link = el(
        "a",
        {
          href: `/books/${book.id}?page=${note.pageNumber}`,
          class: "note-link",
        },
        "Go to page →",
      );
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigate(`/books/${book.id}?page=${note.pageNumber}`);
      });
      noteCard.appendChild(link);

      const deleteBtn = el("button", { class: "note-delete-btn" }, "Delete");
      deleteBtn.addEventListener("click", () => {
        deleteNote(note.id);
        // Re-render
        navigate(_router?.currentPath ?? "/notes");
      });
      noteCard.appendChild(deleteBtn);

      bookSection.appendChild(noteCard);
    }

    frag.appendChild(bookSection);
  }

  return frag;
}

// ─── Route 4: /search?q= — Search results ───────────────────────

function searchRoute(): DocumentFragment {
  const params = currentParams();
  const rawQuery = params.q || "";
  const query = rawQuery.trim();

  const frag = document.createDocumentFragment();

  const header = el("h1", {}, "Search");
  frag.appendChild(header);

  if (!query) {
    const empty = el(
      "p",
      { class: "empty-state" },
      "Enter a search term. Try /search?q=kafka",
    );
    frag.appendChild(empty);
    return frag;
  }

  const termInfo = el("p", { class: "search-term" }, `Results for: "${query}"`);
  frag.appendChild(termInfo);

  const lowerQuery = query.toLowerCase();
  const results = booksJson.filter(
    (book) =>
      book.title.toLowerCase().includes(lowerQuery) ||
      book.author.toLowerCase().includes(lowerQuery),
  );

  if (results.length === 0) {
    const empty = el(
      "p",
      { class: "empty-state" },
      `No results for '${query}'`,
    );
    frag.appendChild(empty);
    return frag;
  }

  const resultList = el("div", { class: "search-results" });

  for (const book of results) {
    const card = el("div", { class: "search-result-card" });

    const cover = el("div", { class: "book-cover-sm" });
    setStyles(cover, { backgroundColor: book.coverColor });
    card.appendChild(cover);

    const title = el("h2", { class: "book-title" }, book.title);
    card.appendChild(title);

    const author = el("p", { class: "book-author" }, book.author);
    card.appendChild(author);

    const summary = el("p", { class: "book-summary" }, book.summary);
    card.appendChild(summary);

    card.addEventListener("click", () => {
      navigate(`/books/${book.id}`);
    });

    resultList.appendChild(card);
  }

  frag.appendChild(resultList);
  return frag;
}

// ─── Route 5: /settings — Settings panel ────────────────────────

function settingsRoute(): DocumentFragment {
  const frag = document.createDocumentFragment();

  const header = el("h1", {}, "Settings");
  frag.appendChild(header);

  const currentSettings = loadSettings() as unknown as {
    theme: string;
    fontSize: number;
    lineHeight: number;
    measure: number;
  };

  function applyTheme(theme: string): void {
    document.documentElement.className = theme === "light"
      ? ""
      : `theme-${theme}`;
  }

  function applyFontSize(size: number): void {
    document.documentElement.style.setProperty(
      "--reader-font-size",
      `${size}px`,
    );
  }

  function applyLineHeight(lh: number): void {
    document.documentElement.style.setProperty(
      "--reader-line-height",
      String(lh),
    );
  }

  function applyMeasure(chars: number): void {
    document.documentElement.style.setProperty(
      "--reader-measure",
      `${chars}ch`,
    );
  }

  // ── Theme switcher ──
  const themeSection = el("div", { class: "settings-section" });
  const themeLabel = el("h2", {}, "Theme");
  themeSection.appendChild(themeLabel);

  const themes: Array<"light" | "dark" | "sepia"> = ["light", "dark", "sepia"];
  for (const theme of themes) {
    const label = el("label", { class: "settings-radio" });
    const radio = el("input", {
      type: "radio",
      name: "theme",
      value: theme,
    });
    if (currentSettings.theme === theme) {
      radio.setAttribute("checked", "");
    }
    radio.addEventListener("change", () => {
      applyTheme(theme);
      currentSettings.theme = theme;
      saveSettings(currentSettings);
    });
    label.appendChild(radio);
    label.appendChild(text(` ${theme}`));
    themeSection.appendChild(label);
  }
  frag.appendChild(themeSection);

  // ── Font size ──
  const fontSizeSection = el("div", { class: "settings-section" });
  const fontSizeLabel = el("h2", {}, "Font Size");
  fontSizeSection.appendChild(fontSizeLabel);

  const fontSizeControls = el("div", { class: "settings-controls" });

  const slider = el("input", {
    type: "range",
    min: "12",
    max: "24",
    step: "1",
    value: String(currentSettings.fontSize),
    class: "settings-slider",
  }) as HTMLInputElement;

  const sizeDisplay = el(
    "span",
    { class: "settings-value" },
    String(currentSettings.fontSize),
  );

  slider.addEventListener("input", () => {
    const value = parseInt(slider.value, 10);
    currentSettings.fontSize = value;
    applyFontSize(value);
    sizeDisplay.textContent = String(value);
    saveSettings(currentSettings);
  });

  fontSizeControls.appendChild(slider);
  fontSizeControls.appendChild(sizeDisplay);

  fontSizeSection.appendChild(fontSizeControls);
  frag.appendChild(fontSizeSection);

  // ── Line height ──
  const lhSection = el("div", { class: "settings-section" });
  const lhLabel = el("h2", {}, "Line Height");
  lhSection.appendChild(lhLabel);

  const lhSelect = el("select", { class: "settings-select" });
  for (const lh of [1.4, 1.6, 1.8]) {
    const option = el("option", { value: String(lh) }, String(lh));
    if (currentSettings.lineHeight === lh) {
      option.setAttribute("selected", "");
    }
    lhSelect.appendChild(option);
  }
  lhSelect.addEventListener("change", () => {
    const value = parseFloat((lhSelect as HTMLSelectElement).value);
    applyLineHeight(value);
    currentSettings.lineHeight = value;
    saveSettings(currentSettings);
  });
  lhSection.appendChild(lhSelect);
  frag.appendChild(lhSection);

  // ── Reading measure ──
  const measureSection = el("div", { class: "settings-section" });
  const measureLabel = el("h2", {}, "Reading Measure");
  measureSection.appendChild(measureLabel);

  const measureSelect = el("select", { class: "settings-select" });
  for (const chars of [55, 65, 75]) {
    const option = el(
      "option",
      { value: String(chars) },
      `${chars} characters`,
    );
    if (currentSettings.measure === chars) {
      option.setAttribute("selected", "");
    }
    measureSelect.appendChild(option);
  }
  measureSelect.addEventListener("change", () => {
    const value = parseInt((measureSelect as HTMLSelectElement).value, 10);
    applyMeasure(value);
    currentSettings.measure = value;
    saveSettings(currentSettings);
  });
  measureSection.appendChild(measureSelect);
  frag.appendChild(measureSection);

  // Apply current settings on mount
  applyTheme(currentSettings.theme);
  applyFontSize(currentSettings.fontSize);
  applyLineHeight(currentSettings.lineHeight);
  applyMeasure(currentSettings.measure);

  return frag;
}

// ─── Book reading loader ────────────────────────────────────────

function readingLoader({ params }: {
  params: Record<string, string>;
}): Promise<{ book: ReaderBook | undefined }> {
  const book = booksJson.find((b) => b.id === params.id) as
    | ReaderBook
    | undefined;
  return Promise.resolve({ book });
}

// ─── Route config ───────────────────────────────────────────────

export const routes: RouteConfig[] = [
  { path: "/", component: bookshelfRoute },
  {
    path: "/books/:id",
    component: readingRoute,
    loader: readingLoader,
  },
  { path: "/notes", component: notesRoute },
  { path: "/search", component: searchRoute },
  { path: "/settings", component: settingsRoute },
];
