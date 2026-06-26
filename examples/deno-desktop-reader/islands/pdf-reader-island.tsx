import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { definePreactIsland } from '@openelement/app/preact';

interface PdfReaderProps {
  'book-id'?: string;
  src?: string;
  page?: string;
  zoom?: string;
  pages?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function PdfReaderIsland(props: PdfReaderProps) {
  const bookId = props['book-id'] ?? '';
  const totalPages = Math.max(1, Number(props.pages ?? 1));
  const [page, setPage] = useState(
    clamp(Number(props.page ?? 1), 1, totalPages),
  );
  const [zoom, setZoom] = useState(Number(props.zoom ?? 1) || 1);

  const src = useMemo(() => {
    const base = props.src || '';
    return `${base}#page=${page}&zoom=${Math.round(zoom * 100)}`;
  }, [page, props.src, zoom]);

  useEffect(() => {
    if (!bookId) return;
    localStorage.setItem(
      `reader:progress:${bookId}`,
      JSON.stringify({ page, zoom }),
    );
    void fetch(`/api/books/${encodeURIComponent(bookId)}/progress`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page, zoom }),
    }).catch(() => {});
  }, [bookId, page, zoom]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === 'ArrowLeft') {
        setPage((current) => clamp(current - 1, 1, totalPages));
      }
      if (event.key === 'ArrowRight') {
        setPage((current) => clamp(current + 1, 1, totalPages));
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [totalPages]);

  return h('section', { class: 'pdf-island' }, [
    h(
      'style',
      null,
      `
        :host{display:block}
        .toolbar{align-items:center;display:flex;gap:8px;justify-content:center;margin:0 0 14px}
        .toolbar button{background:#fff;border:1px solid #e0d6c8;border-radius:999px;color:#2c4842;font:650 13px system-ui;padding:7px 12px}
        .toolbar button:disabled{color:#aca59a;background:#f6f1e8}
        .toolbar span{font:13px system-ui;color:#756f66;min-width:68px;text-align:center}
        iframe{width:100%;height:68vh;border:1px solid #e0d6c8;border-radius:14px;background:#f8f2e8;box-shadow:inset 0 1px rgba(255,255,255,.8)}
      `,
    ),
    h('div', { class: 'toolbar' }, [
      h('button', {
        type: 'button',
        disabled: page <= 1,
        onClick: () => setPage(page - 1),
      }, 'Prev'),
      h('span', null, `Page ${page} / ${totalPages}`),
      h(
        'button',
        {
          type: 'button',
          disabled: page >= totalPages,
          onClick: () => setPage(page + 1),
        },
        'Next',
      ),
      h(
        'button',
        {
          type: 'button',
          onClick: () => setZoom((value) => Math.max(0.75, value - 0.1)),
        },
        '-',
      ),
      h('span', null, `${Math.round(zoom * 100)}%`),
      h(
        'button',
        {
          type: 'button',
          onClick: () => setZoom((value) => Math.min(1.75, value + 0.1)),
        },
        '+',
      ),
    ]),
    h('iframe', { title: 'PDF reader', src }),
  ]);
}

definePreactIsland('pdf-reader-island', PdfReaderIsland, { ssr: false });
