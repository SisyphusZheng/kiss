/** @jsxImportSource @openelement/element */
/**
 * Shared shell for the WWW guide routes (www/app/routes/guide/).
 *
 * Every guide page renders the same skeleton: an open-reading-shell with a
 * declared SSR outline, localized metadata, and a .guide-grid of open-card
 * sections. Route modules keep only their bilingual content record (plus the
 * few extension hooks below); this module owns the skeleton, the grid
 * treatment, and locale selection so the pages cannot drift.
 */
import { OpenElement, StyleSheet, type StyleSheetLike } from '@openelement/element';
import { pageStyles } from '../components/page-styles.js';
import { guideSectionStyles } from './guide-section-styles.ts';
import { serializeOutline } from './page-contract.ts';
import '@openelement/ui/open-card';

export type GuideNav = Readonly<{ href: string; label: string }>;
export type GuideCard = Readonly<{ id: string; title: string; body: string }>;

/** Bilingual content record for one guide page. */
export type GuideContent = Readonly<{
  breadcrumb: string;
  title: string;
  lede: string;
  outline: ReadonlyArray<Readonly<{ id: string; label: string; level: 2 | 3 }>>;
  previous?: GuideNav;
  next?: GuideNav;
  cards: ReadonlyArray<GuideCard>;
  /** getting-started: the version sidenote rendered before the card grid. */
  subtitleBefore?: string;
  subtitleAfter?: string;
  /** security: heading and footnote of the recipe block after the grid. */
  recipeTitle?: string;
  recipeNote?: string;
  /** Guide cards that point at a full Architecture page (comparison, architecture). */
  fullPage?: Readonly<{ href: string; label: string; note: string }>;
}>;

export type GuidePageConfig = Readonly<{
  content: Record<'en' | 'zh', GuideContent>;
}>;

function guideGridStyles(columns: 2 | 3): string {
  return `
    .guide-grid {
      display: grid;
      grid-template-columns: repeat(${columns}, minmax(0, 1fr));
      gap: var(--size-4);
      margin: var(--size-8) 0;
    }

    @media (max-width: 860px) {
      .guide-grid {
        grid-template-columns: 1fr;
      }
    }

    .full-guide {
      margin-block-start: var(--size-6);
      color: var(--text-secondary);
      font-size: var(--font-size-00);
    }

    .full-guide a {
      color: var(--violet-8);
    }
  `;
}

/** Route stylesheet for a guide page: shared docs styles plus the card grid. */
export function guideStyles(options: { columns?: 2 | 3; extra?: string } = {}): StyleSheetLike {
  const sheet = new StyleSheet();
  sheet.replaceSync(
    pageStyles + guideSectionStyles + guideGridStyles(options.columns ?? 3) + (options.extra ?? ''),
  );
  return sheet;
}

/**
 * Base class for guide routes. Subclasses provide `static guide` (the content
 * record) and may override renderBeforeCards/renderAfterCards for
 * page-specific blocks (version sidenote, recipe).
 */
export class GuidePage extends OpenElement {
  declare static guide: GuidePageConfig;

  /** Locale-selected content; zh coverage is scoped to the guide layer (#749). */
  protected get _t(): GuideContent {
    const content = (this.constructor as typeof GuidePage).guide.content;
    return content[this._getLocale('en') === 'zh' ? 'zh' : 'en'];
  }

  /** Page-specific block rendered between the lede and the card grid. */
  protected renderBeforeCards(_t: GuideContent): unknown {
    return null;
  }

  /** Page-specific block rendered after the card grid. */
  protected renderAfterCards(_t: GuideContent): unknown {
    return null;
  }

  override render() {
    const t = this._t;
    return (
      <open-reading-shell
        rail
        footer
        metadata={JSON.stringify({ breadcrumb: t.breadcrumb, title: t.title, lede: t.lede })}
        previous={t.previous?.href}
        previous-label={t.previous?.label}
        next={t.next?.href}
        next-label={t.next?.label}
      >
        <open-page-rail slot='rail' items={serializeOutline(t.outline)}></open-page-rail>
        <div class='container guide-sections'>
          {this.renderBeforeCards(t)}
          <div class='guide-grid'>
            {t.cards.map((card) => (
              <open-card>
                <h3 id={card.id}>{card.title}</h3>
                <p>{card.body}</p>
              </open-card>
            ))}
          </div>
          {t.fullPage
            ? (
              <p class='full-guide'>
                {t.fullPage.note} <a href={t.fullPage.href}>{t.fullPage.label}</a>
              </p>
            )
            : null}
          {this.renderAfterCards(t)}
        </div>
      </open-reading-shell>
    );
  }
}
