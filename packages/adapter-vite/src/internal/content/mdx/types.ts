export interface MdxCompileOptions {
  jsxImportSource?: string;
  development?: boolean;
  filepath?: string;
}

export interface MdxModule {
  code: string;
  frontmatter: Record<string, unknown>;
  content: string;
}
