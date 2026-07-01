/**
 * @openelement/core - Streaming Dsd Renderer.
 *
 * Progressive Dsd delivery via Web Streams (ReadableStream<Uint8Array>).
 * Extracted from render-dsd.ts in v0.21.0 (SOP-003).
 *
 * Provides:
 *   - renderDsdStream() — stream components as they render
 *   - createRenderDsdStreamMetrics() — metrics collector factory
 *   - RenderDsdStreamChunk, RenderDsdStreamComponent,
 *     RenderDsdStreamMetrics, RenderDsdStreamOptions types
 *
 * @module @openelement/core/render-dsd-stream
 */

import { renderDsd, safeNow } from './render-dsd.ts';
import type { RenderError, RenderOutput } from '@openelement/protocol/render';

// --- Streaming types -------------------------------------------

export interface RenderDsdStreamChunk {
  html: string;
  output: RenderOutput;
}

export interface RenderDsdStreamMetrics {
  chunkCount: number;
  errorCount: number;
  startedAt: number;
  endedAt?: number;
}

export interface RenderDsdStreamOptions {
  shell?: string | (() => string | Promise<string>);
  footer?: string | (() => string | Promise<string>);
  onChunk?: (chunk: RenderDsdStreamChunk) => void;
  onError?: (error: RenderError, tagName: string) => void;
  metrics?: RenderDsdStreamMetrics;
}

export interface RenderDsdStreamComponent {
  tagName: string;
  componentClass: CustomElementConstructor;
  props?: Record<string, unknown>;
  sourceInfo?: { route?: string; source?: string };
  dsdOptions?: import('@openelement/protocol/render').DsdOptions;
}

const textEncoder = new TextEncoder();

async function resolveStreamPart(
  part?: string | (() => string | Promise<string>),
): Promise<string> {
  if (!part) return '';
  return typeof part === 'function' ? await part() : part;
}

/**
 * Create a fresh metrics collector for streaming Dsd.
 */
export function createRenderDsdStreamMetrics(): RenderDsdStreamMetrics {
  return {
    chunkCount: 0,
    errorCount: 0,
    startedAt: safeNow(),
  };
}

/**
 * Render components as a streaming Dsd response.
 *
 * Returns a ReadableStream<Uint8Array> that emits:
 *   1. Shell (opening HTML)
 *   2. Each component's Dsd output, in order
 *   3. Footer (closing HTML)
 *
 * Failed components emit a bare-tag fallback and the stream continues.
 * Compatible with Web Response constructor for edge handlers.
 *
 * @param components - Iterable of components to render
 * @param options - Stream options (shell, footer, callbacks, metrics)
 * @returns ReadableStream of encoded Dsd HTML chunks
 */
export function renderDsdStream(
  components: Iterable<RenderDsdStreamComponent>,
  options: RenderDsdStreamOptions = {},
): ReadableStream<Uint8Array> {
  const encoderMetrics = options.metrics ?? createRenderDsdStreamMetrics();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const shell = await resolveStreamPart(options.shell);
        if (shell) {
          controller.enqueue(textEncoder.encode(shell));
          encoderMetrics.chunkCount++;
        }

        for (const component of components) {
          const output = await renderDsd(
            component.tagName,
            {
              componentClass: component.componentClass,
              props: component.props ?? {},
              sourceInfo: component.sourceInfo,
              dsdOptions: component.dsdOptions,
            },
          );
          for (const error of output.errors) {
            encoderMetrics.errorCount++;
            options.onError?.(error, component.tagName);
          }
          controller.enqueue(textEncoder.encode(output.html));
          encoderMetrics.chunkCount++;
          options.onChunk?.({ html: output.html, output });
        }

        const footer = await resolveStreamPart(options.footer);
        if (footer) {
          controller.enqueue(textEncoder.encode(footer));
          encoderMetrics.chunkCount++;
        }
        encoderMetrics.endedAt = safeNow();
        controller.close();
      } catch (error) {
        encoderMetrics.errorCount++;
        encoderMetrics.endedAt = safeNow();
        controller.error(error);
      }
    },
  });
}
