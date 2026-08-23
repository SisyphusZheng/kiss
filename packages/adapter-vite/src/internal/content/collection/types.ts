/** Primitive frontmatter field types supported by content collections. */
export type CollectionFieldType = 'string' | 'number' | 'boolean' | 'string[]';

export interface CollectionFieldDefinition {
  type: CollectionFieldType;
  required?: boolean;
  default?: unknown;
}

export interface CollectionSchemaContext {
  collection: string;
  fileName: string;
  filePath: string;
  slug: string;
}

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

export interface CollectionOptions {
  contentDir: string;
  basePath?: string;
  schema?: CollectionSchema;
  /** Custom Markdown renderer; its output still crosses the shared sanitizer. */
  markdown?: (content: string) => string | Promise<string>;
}

export interface CollectionEntry {
  slug: string;
  locale?: string;
  frontmatter: Record<string, unknown>;
  content: string;
  html: string;
}
