/** Primitive frontmatter field types supported by content collections. */
export type CollectionFieldType = 'string' | 'number' | 'boolean' | 'string[]';

/** Declarative definition of one frontmatter field (type, required, default). */
export interface CollectionFieldDefinition {
  type: CollectionFieldType;
  required?: boolean;
  default?: unknown;
}

/** Context handed to a collection schema's `transform` hook. */
export interface CollectionSchemaContext {
  collection: string;
  fileName: string;
  filePath: string;
  slug: string;
}

/** The slug/frontmatter result a collection schema `transform` returns. */
export interface CollectionSchemaResult {
  slug?: string;
  frontmatter: Record<string, unknown>;
}

/**
 * Declarative fields keep generated modules typed. `transform` covers values
 * derived from filenames (for example a site's locale suffix) without making
 * that convention part of the framework.
 */
export interface CollectionSchema {
  fields: Record<string, CollectionFieldType | CollectionFieldDefinition>;
  transform?: (
    frontmatter: Record<string, unknown>,
    context: CollectionSchemaContext,
  ) => CollectionSchemaResult;
}

/** Configuration of one content collection (directory, base path, schema). */
export interface CollectionOptions {
  contentDir: string;
  basePath?: string;
  schema?: CollectionSchema;
  /** Custom Markdown renderer; its output still crosses the shared sanitizer. */
  markdown?: (content: string) => string | Promise<string>;
}

/** One loaded collection entry: slug, validated frontmatter and rendered HTML. */
export interface CollectionEntry {
  slug: string;
  locale?: string;
  frontmatter: Record<string, unknown>;
  content: string;
  html: string;
}
