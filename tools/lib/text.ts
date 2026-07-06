/**
 * Shared text/comment stripping helpers for openElement tooling.
 */

export interface StripLineResult {
  line: string;
  inBlock: boolean;
}

/**
 * Strip comments from a single source line while tracking block-comment state.
 * Suitable for line-by-line scanning where line numbers must be preserved.
 */
export function stripCommentsLine(line: string, inBlock: boolean): StripLineResult {
  let text = line;

  if (inBlock) {
    const end = text.indexOf('*/');
    if (end === -1) return { line: '', inBlock: true };
    text = text.slice(end + 2);
    return stripCommentsLine(text, false);
  }

  for (;;) {
    const start = text.indexOf('/*');
    if (start === -1) break;
    const end = text.indexOf('*/', start + 2);
    if (end === -1) {
      return { line: text.slice(0, start).replace(/\/\/.*/, ''), inBlock: true };
    }
    text = text.slice(0, start) + text.slice(end + 2);
  }

  return { line: text.replace(/\/\/.*/, ''), inBlock: false };
}

/**
 * Strip comments from an entire source string.
 * Block comments are replaced with spaces to preserve line numbers.
 * Useful for pattern scanning against a whole file.
 */
export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => ' '.repeat(match.length))
    .replace(/\/\/.*/g, '');
}
