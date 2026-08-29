/** Adapter-owned framework, build, content, and routing contracts. */
import type { FrameworkOptions as ElementFrameworkOptions } from '@openelement/element';
import type { CriticalAssetsOptions } from './internal/ssg/critical-assets.ts';

export type {
  AppShellConfig,
  CompatibilityClassification,
  CompatibilityTier,
  ComponentLayer,
  HydrationStrategy,
  IsrManifestEntry,
  RenderError,
  RouteEntry,
  SpecialFileType,
  SsrAdmissionDecision,
} from '@openelement/element';

/**
 * Adapter options extend the frozen element options with build-only delivery
 * declarations. The element package remains unaware of Vite/SSG policy.
 */
export type FrameworkOptions = ElementFrameworkOptions & {
  criticalAssets?: CriticalAssetsOptions;
  critical?: CriticalAssetsOptions;
};

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

// Alpha.4 build-side extensions. They are intentionally adapter-owned: the
// stable element package keeps its 0.43 public contracts unchanged while the
// Vite adapter serializes delivery and critical-path decisions into artifacts.
export type { IslandDeliveryStrategy } from './internal/ssg/delivery.ts';
export type {
  CriticalAssetsOptions,
  CriticalAssetsResult,
  CriticalFontAsset,
  CriticalInlineScriptAsset,
  CriticalStyleAsset,
} from './internal/ssg/critical-assets.ts';
