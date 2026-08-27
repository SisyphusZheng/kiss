/**
 * @openelement/adapter-vite — spike Part Program types (v0.44.0-alpha.0, #1160).
 *
 * Structural mirror of packages/element/src/internal/compiled/program.ts. The
 * two copies intentionally share no import: the generated program must remain
 * a self-contained serializable artifact with no private cross-package path
 * and no workspace alias (dispatch a0-001 boundary). The adapter test asserts
 * the emitted program deep-equals the frozen expected-program.json fixture
 * that the element runtime consumes, which keeps both copies honest.
 */

export type SpikeTreeNode =
  | { k: 'el'; tag: string; attrs: Array<[string, string]>; children: SpikeTreeNode[] }
  | { k: 'text'; value: string }
  | { k: 'part'; index: number }
  | { k: 'ival' };

export type SpikePart =
  | { k: 'text'; index: number; signal: string }
  | { k: 'prop'; index: number; signal: string; name: string; path: number[] }
  | { k: 'event'; index: number; event: string; handler: string; path: number[] }
  | {
    k: 'when';
    index: number;
    signal: string;
    gt: number;
    on: SpikeTreeNode[];
    off: SpikeTreeNode[];
  }
  | {
    k: 'each';
    index: number;
    signal: string;
    key: string;
    field: string;
    item: SpikeTreeNode[];
  };

export interface PartProgramSpike {
  version: 1;
  tag: string;
  template: SpikeTreeNode[];
  parts: SpikePart[];
}
