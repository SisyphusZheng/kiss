/** @jsxImportSource @openelement/core */
import { OpenElement } from '@openelement/element';
import { addSource, listSources } from '../app/api.ts';
import { loadSettings, saveSettings } from '../app/storage.ts';
import type { ReaderSettings, ReaderSource } from '../app/types.ts';

function applyTheme(theme: string): void {
  document.documentElement.className = theme === 'light' ? '' : `theme-${theme}`;
}

function applyFontSize(size: number): void {
  document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
}

function applyLineHeight(lh: number): void {
  document.documentElement.style.setProperty(
    '--reader-line-height',
    String(lh),
  );
}

function applyMeasure(chars: number): void {
  document.documentElement.style.setProperty('--reader-measure', `${chars}ch`);
}

export interface SettingsData extends ReaderSettings {
  sources: ReaderSource[];
}

export async function loader(): Promise<SettingsData> {
  return { ...loadSettings(), sources: await listSources() };
}

export async function action(
  ctx: { formData?: FormData },
): Promise<{ added?: string; error?: string }> {
  const kind = String(ctx.formData?.get('kind') ?? 'local');
  const label = String(ctx.formData?.get('label') ?? '').trim();
  const root = String(ctx.formData?.get('root') ?? '').trim();
  const repo = String(ctx.formData?.get('repo') ?? '').trim();
  const branch = String(ctx.formData?.get('branch') ?? 'main').trim();
  const path = String(ctx.formData?.get('path') ?? '').trim();
  try {
    const source = await addSource({
      kind: kind === 'github' ? 'github' : 'local',
      label,
      root: root || undefined,
      repo: repo || undefined,
      branch: branch || undefined,
      path: path || undefined,
    });
    return { added: source.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export const tagName = 'reader-settings';

export default class SettingsPage extends OpenElement {
  override render() {
    const current = (this as unknown) as SettingsPage & SettingsData;
    const actionData = (this as unknown as { actionData?: { added?: string; error?: string } })
      .actionData;

    // Apply current settings on mount
    if (current.theme) applyTheme(current.theme);
    if (current.fontSize) applyFontSize(current.fontSize);
    if (current.lineHeight) applyLineHeight(current.lineHeight);
    if (current.measure) applyMeasure(current.measure);

    return (
      <main class='reader-page'>
        <h1>Settings</h1>
        {actionData?.added && <p class='toast-inline'>Source added: {actionData.added}</p>}
        {actionData?.error && <p class='form-error'>{actionData.error}</p>}

        <div class='settings-section'>
          <h2>Sources</h2>
          <div class='source-list'>
            {(current.sources || []).map((source) => (
              <div class='source-row' key={source.id}>
                <div>
                  <strong>{source.label}</strong>
                  <small>
                    {source.kind}
                    {source.repo ? ` · ${source.repo}` : ''}
                    {source.root ? ` · ${source.root}` : ''}
                  </small>
                </div>
                <sync-status-island source-id={source.id} />
              </div>
            ))}
          </div>
          <form class='source-form'>
            <label>
              Kind
              <select name='kind' class='settings-select'>
                <option value='local'>Local folder</option>
                <option value='github'>GitHub repo/path</option>
              </select>
            </label>
            <label>
              Label
              <input name='label' placeholder='Research PDFs' />
            </label>
            <label>
              Local root
              <input name='root' placeholder='/Users/me/Documents/papers' />
            </label>
            <label>
              GitHub repo
              <input name='repo' placeholder='owner/repo' />
            </label>
            <label>
              Branch
              <input name='branch' value='main' />
            </label>
            <label>
              Repo path
              <input name='path' placeholder='books' />
            </label>
            <open-button type='submit'>Add source</open-button>
          </form>
        </div>

        {/* Theme */}
        <div class='settings-section'>
          <h2>Theme</h2>
          {(['light', 'dark', 'sepia'] as const).map((theme) => (
            <label class='settings-radio' key={theme}>
              <input
                type='radio'
                name='theme'
                value={theme}
                checked={current.theme === theme}
                onChange={() => {
                  applyTheme(theme);
                  const s: ReaderSettings = { ...loadSettings(), theme };
                  saveSettings(s);
                }}
              />
              {theme}
            </label>
          ))}
        </div>

        {/* Font Size */}
        <div class='settings-section'>
          <h2>Font Size</h2>
          <div class='settings-controls'>
            <input
              type='range'
              min='12'
              max='24'
              step='1'
              value={String(current.fontSize)}
              class='settings-slider'
              onInput={(e: Event) => {
                const value = parseInt(
                  (e.target as HTMLInputElement).value,
                  10,
                );
                applyFontSize(value);
                // Update display
                const display = (e.target as HTMLInputElement)
                  .nextElementSibling;
                if (display) display.textContent = String(value);
                const s: ReaderSettings = {
                  ...loadSettings(),
                  fontSize: value,
                };
                saveSettings(s);
              }}
            />
            <span class='settings-value'>{current.fontSize}</span>
          </div>
        </div>

        {/* Line Height */}
        <div class='settings-section'>
          <h2>Line Height</h2>
          <select
            class='settings-select'
            onChange={(e: Event) => {
              const value = parseFloat(
                (e.target as HTMLSelectElement).value,
              );
              applyLineHeight(value);
              const s: ReaderSettings = {
                ...loadSettings(),
                lineHeight: value,
              };
              saveSettings(s);
            }}
          >
            {[1.4, 1.6, 1.8].map((lh) => (
              <option
                key={lh}
                value={String(lh)}
                selected={current.lineHeight === lh}
              >
                {lh}
              </option>
            ))}
          </select>
        </div>

        {/* Reading Measure */}
        <div class='settings-section'>
          <h2>Reading Measure</h2>
          <select
            class='settings-select'
            onChange={(e: Event) => {
              const value = parseInt(
                (e.target as HTMLSelectElement).value,
                10,
              );
              applyMeasure(value);
              const s: ReaderSettings = {
                ...loadSettings(),
                measure: value,
              };
              saveSettings(s);
            }}
          >
            {[55, 65, 75].map((chars) => (
              <option
                key={chars}
                value={String(chars)}
                selected={current.measure === chars}
              >
                {chars} characters
              </option>
            ))}
          </select>
        </div>
      </main>
    );
  }
}
customElements.define(tagName, SettingsPage);
