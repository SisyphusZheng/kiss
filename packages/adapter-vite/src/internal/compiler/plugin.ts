/**
 * @openelement/adapter-vite — open:compiled-element spike plugin (#1160).
 *
 * Vite integration boundary for the alpha.0 TSX-to-Part Program compiler.
 * The hook activates only for .tsx modules that opt into the compiled model
 * via the `@element(` marker; everything else passes through untouched.
 * Unsupported grammar fails the build through this.error() with a
 * source-located OEC9xx diagnostic — there is no runtime fallback.
 *
 * Internal alpha.0 spike only: not part of the public adapter API.
 */

import type { Plugin } from 'vite';
import { CompiledSpikeError, compileElementSpike } from './compile.ts';

export const COMPILED_ELEMENT_MARKER = '@element(';

export function compiledElementPlugin(): Plugin {
  return {
    name: 'open:compiled-element',

    transform(code, id) {
      if (!/\.tsx$/.test(id)) return null;
      if (!code.includes(COMPILED_ELEMENT_MARKER)) return null;
      try {
        return compileElementSpike(code, id).code;
      } catch (error) {
        if (error instanceof CompiledSpikeError) {
          this.error(error.message);
        }
        throw error;
      }
    },
  };
}
