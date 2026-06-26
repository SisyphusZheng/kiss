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
        .toolbar{display:flex;align-items:center;gap:8px;margin:0 0 12px}
        .toolbar button{border:1px solid #cfd6df;background:#fff;border-radius:6px;padding:6px 10px}
        .toolbar span{font:13px system-ui;color:#59636f}
        iframe{width:100%;height:68vh;border:1px solid #d8dee7;border-radius:8px;background:#f7f3ea}
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
