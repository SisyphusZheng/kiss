/** Adapter-owned framework, build, content, and routing contracts. */
export type {
  AppShellConfig,
  CompatibilityClassification,
  CompatibilityTier,
  ComponentLayer,
  FrameworkOptions,
  HydrationStrategy,
  IsrManifestEntry,
  RenderError,
  RouteEntry,
  SpecialFileType,
  SsrAdmissionDecision,
} from '@openelement/element';

/** Blog options stored in the adapter build context. */
export interface OpenElementBlogOptions {
  contentDir?: string;
  basePath?: string;
}

/** Navigation section produced by the adapter content pipeline. */
export interface OpenElementNavSection {
  section: string;
  items: Array<{ path: string; label: string; order?: number }>;
}

export interface OpenElementHeaderNavLink {
  href: string;
  label: string;
}

export interface OpenElementI18nContextOptions {
  locales: string[];
  defaultLocale: string;
  [key: string]: unknown;
}

/** Minimal build-context contract available to adapter sub-plugins. */
export interface OpenElementBuildContextLike {
  plugins: {
    blogOptions: OpenElementBlogOptions | null;
    navSections: OpenElementNavSection[];
    headerNav: OpenElementHeaderNavLink[];
    sitemapOptions: Record<string, unknown> | null;
    i18nOptions: OpenElementI18nContextOptions | null;
    [key: string]: unknown;
  };
  registerPlugin(name: string, instance: unknown): void;
}

export type { OpenElementPackageManifest } from '@openelement/element';
