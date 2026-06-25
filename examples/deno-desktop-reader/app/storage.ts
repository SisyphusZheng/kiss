import type { ReaderNote, ReaderProgress, ReaderSettings } from './types.ts';

const KEYS = {
  progress: 'reader:progress',
  notes: 'reader:notes',
  settings: 'reader:settings',
} as const;

const DEFAULTS: ReaderSettings = {
  theme: 'light',
  fontSize: 16,
  lineHeight: 1.6,
  measure: 65,
};

// ---------- Progress ----------

function loadProgressRaw(): Record<string, ReaderProgress> {
  try {
    const raw = localStorage.getItem(KEYS.progress);
    return raw ? JSON.parse(raw) : {};
  } catch {
    console.warn('[storage] corrupt progress data, resetting');
    return {};
  }
}

export function loadProgress(bookId: string): ReaderProgress | null {
  const all = loadProgressRaw();
  return all[bookId] ?? null;
}

export function saveProgress(bookId: string, pageNumber: number): void {
  const all = loadProgressRaw();
  all[bookId] = { bookId, pageNumber, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEYS.progress, JSON.stringify(all));
}

// ---------- Notes ----------

function loadNotesRaw(): Record<string, ReaderNote> {
  try {
    const raw = localStorage.getItem(KEYS.notes);
    return raw ? JSON.parse(raw) : {};
  } catch {
    console.warn('[storage] corrupt notes data, resetting');
    return {};
  }
}

export function loadNotes(bookId?: string): ReaderNote[] {
  const all = loadNotesRaw();
  const notes = Object.values(all);
  if (!bookId) return notes;
  return notes.filter((n) => n.bookId === bookId);
}

export function saveNote(note: ReaderNote): void {
  const all = loadNotesRaw();
  all[note.id] = note;
  localStorage.setItem(KEYS.notes, JSON.stringify(all));
}

export function deleteNote(noteId: string): void {
  const all = loadNotesRaw();
  delete all[noteId];
  localStorage.setItem(KEYS.notes, JSON.stringify(all));
}

// ---------- Settings ----------

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    console.warn('[storage] corrupt settings data, resetting');
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Partial<ReaderSettings>): void {
  const current = loadSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(KEYS.settings, JSON.stringify(merged));
}

// ---------- Client-side search ----------

export function searchNotes(query: string): ReaderNote[] {
  const notes = loadNotes();
  if (!query) return [];
  const lower = query.toLowerCase();
  return notes.filter(
    (n) =>
      n.quote.toLowerCase().includes(lower) ||
      n.note.toLowerCase().includes(lower),
  );
}
