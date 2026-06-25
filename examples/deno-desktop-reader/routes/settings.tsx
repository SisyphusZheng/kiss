/** @jsxImportSource @openelement/core */
import { loadSettings, saveSettings } from "../app/storage.ts";
import type { ReaderSettings } from "../app/types.ts";

function applyTheme(theme: string): void {
  document.documentElement.className = theme === "light"
    ? ""
    : `theme-${theme}`;
}

function applyFontSize(size: number): void {
  document.documentElement.style.setProperty("--reader-font-size", `${size}px`);
}

function applyLineHeight(lh: number): void {
  document.documentElement.style.setProperty(
    "--reader-line-height",
    String(lh),
  );
}

function applyMeasure(chars: number): void {
  document.documentElement.style.setProperty("--reader-measure", `${chars}ch`);
}

export default function SettingsRoute() {
  const current = loadSettings();

  // Apply current settings on mount
  applyTheme(current.theme);
  applyFontSize(current.fontSize);
  applyLineHeight(current.lineHeight);
  applyMeasure(current.measure);

  return (
    <div>
      <h1>Settings</h1>

      {/* Theme */}
      <div class="settings-section">
        <h2>Theme</h2>
        {(["light", "dark", "sepia"] as const).map((theme) => (
          <label class="settings-radio" key={theme}>
            <input
              type="radio"
              name="theme"
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
      <div class="settings-section">
        <h2>Font Size</h2>
        <div class="settings-controls">
          <input
            type="range"
            min="12"
            max="24"
            step="1"
            value={String(current.fontSize)}
            class="settings-slider"
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
          <span class="settings-value">{current.fontSize}</span>
        </div>
      </div>

      {/* Line Height */}
      <div class="settings-section">
        <h2>Line Height</h2>
        <select
          class="settings-select"
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
      <div class="settings-section">
        <h2>Reading Measure</h2>
        <select
          class="settings-select"
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
    </div>
  );
}
