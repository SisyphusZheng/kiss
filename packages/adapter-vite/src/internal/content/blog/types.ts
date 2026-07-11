/** Blog post frontmatter parsed from markdown file */
export interface BlogPostFrontmatter {
  /** Post title */
  title: string;
  /** Publication date (ISO 8601 string) */
  date: string;
  /** Whether this is a draft (drafts excluded from production) */
  draft?: boolean;
  /** Tags for categorization */
  tags?: string[];
  /** Short excerpt / description */
  excerpt?: string;
  /** Post type discriminator (e.g. 'adr', 'post') */
  type?: string;
}

/** A fully parsed blog post */
export interface BlogPost {
  /** URL-safe slug derived from filename */
  slug: string;
  /** Parsed frontmatter */
  frontmatter: BlogPostFrontmatter;
  /** Raw markdown content (without frontmatter) */
  content: string;
  /** Rendered HTML from markdown */
  html: string;
}

/** Blog plugin configuration options */
export interface OpenElementBlogOptions {
  /** Directory containing .md files (default: 'posts') */
  contentDir?: string;
  /** Base URL path for blog (default: '/blog') */
  basePath?: string;
  /** Custom markdown renderer override */
  markdown?: (content: string) => string | Promise<string>;
  /**
   * Skip HTML sanitization for custom markdown renderer output.
   * Only use when you fully trust the content source (e.g. hand-authored ADRs).
   * Default: false - all HTML is sanitized via allow-list.
   */
  trustedHtml?: boolean;
  /**
   * Layout component tag name for wrapping blog pages.
   * Default: 'open-layout' (from @openelement/ui)
   */
  layoutTag?: string;
  /**
   * CSS class for the content container.
   * Default: 'container' (matches page-styles.ts)
   */
  containerClass?: string;
}
