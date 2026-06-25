import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { exportNotesToMarkdown } from "../export.ts";
import type { ReaderBook, ReaderNote } from "../types.ts";

const sampleBooks: ReaderBook[] = [{
  id: "kafka",
  title: "The Metamorphosis",
  author: "Franz Kafka",
  fileName: "kafka.pdf",
  pageCount: 44,
  summary: "A novella",
  coverColor: "#2d5a27",
}];

const sampleNote: ReaderNote = {
  id: "note-1",
  bookId: "kafka",
  pageNumber: 42,
  quote: "As Gregor Samsa awoke...",
  note: "The opening line is iconic.",
  createdAt: "2026-01-01T00:00:00Z",
};

Deno.test("exportNotesToMarkdown generates valid YAML frontmatter", () => {
  const result = exportNotesToMarkdown([sampleNote], sampleBooks);
  assertStringIncludes(result, "bookId: kafka");
  assertStringIncludes(result, "bookTitle: The Metamorphosis");
  assertStringIncludes(result, "author: Franz Kafka");
  assertStringIncludes(result, "pageNumber: 42");
  assertStringIncludes(result, "createdAt: 2026-01-01T00:00:00Z");
  assertStringIncludes(result, "tags: [reader-import]");
});

Deno.test("exportNotesToMarkdown includes quote as blockquote", () => {
  const result = exportNotesToMarkdown([sampleNote], sampleBooks);
  assertStringIncludes(result, "> As Gregor Samsa awoke...");
});

Deno.test("exportNotesToMarkdown includes user note text", () => {
  const result = exportNotesToMarkdown([sampleNote], sampleBooks);
  assertStringIncludes(result, "The opening line is iconic.");
});

Deno.test("exportNotesToMarkdown includes open-reader backlink", () => {
  const result = exportNotesToMarkdown([sampleNote], sampleBooks);
  assertStringIncludes(result, "open-reader://books/kafka?page=42");
});

Deno.test("exportNotesToMarkdown handles unknown book gracefully", () => {
  // New behavior: unknown book IDs cause notes to be skipped entirely
  // ponytail: this behavior might change later, but for now assert emptiness
  const result = exportNotesToMarkdown([sampleNote], []);
  assertEquals(result, "");
});

Deno.test("exportNotesToMarkdown returns empty string for empty notes", () => {
  const result = exportNotesToMarkdown([], []);
  assertEquals(result, "");
});
