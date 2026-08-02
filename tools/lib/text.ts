/**
 * Shared text/comment stripping helpers for openElement tooling.
 */

/**
 * Strip comments from a single source line while tracking block-comment state.
 * Suitable for line-by-line scanning where line numbers must be preserved.
 * Both `//` and `/*` inside a same-line string literal do not open a comment
 * (#826); template-literal `${ }` interpolation is not parsed (string mode
 * continues through it), matching the limitation documented on stripComments.
 */
export function stripCommentsLine(
  line: string,
  inBlock: boolean,
): { line: string; inBlock: boolean } {
  if (inBlock) {
    const end = line.indexOf('*/');
    if (end === -1) return { line: '', inBlock: true };
    return stripCommentsLine(line.slice(end + 2), false);
  }

  // Single pass: track same-line string literals and cut at the first comment
  // opener outside of them. Strings never carry across lines here — the
  // caller's line-oriented contract cannot represent an unterminated string,
  // and the scanned inputs (configs, gates) do not span strings over lines.
  let quote: string | undefined;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote !== undefined) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = undefined;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '/' && line[i + 1] === '/') {
      return { line: line.slice(0, i), inBlock: false };
    }
    if (ch === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2);
      if (end === -1) return { line: line.slice(0, i), inBlock: true };
      return stripCommentsLine(line.slice(0, i) + line.slice(end + 2), false);
    }
  }

  return { line, inBlock: false };
}

/**
 * Strip comments from an entire source string, aware of string literals
 * (#826): `//` and `/*` inside a single/double-quoted string or a template
 * literal do not open a comment, so a URL string before a host token on the
 * same line no longer swallows the rest of the line. Block comments are
 * blanked to spaces (newlines preserved) so line numbers survive; line
 * comments are dropped up to the newline. Template-literal `${ }`
 * interpolations switch back to code mode, so comments inside them are
 * stripped too. Regex literals are NOT parsed (same limitation as before).
 */
export function stripComments(source: string): string {
  let out = '';
  let i = 0;
  const n = source.length;
  let mode: 'code' | 'single' | 'double' | 'template' | 'line' | 'block' = 'code';
  // Brace depth at which each open template-literal `${` sits; a `}` in code
  // mode at exactly that depth closes the interpolation.
  const interpolationDepths: number[] = [];
  let braceDepth = 0;

  while (i < n) {
    const ch = source[i];
    const next = source[i + 1];
    if (mode === 'line') {
      if (ch === '\n') {
        out += ch;
        mode = 'code';
      }
      i++;
      continue;
    }
    if (mode === 'block') {
      if (ch === '*' && next === '/') {
        out += '  ';
        i += 2;
        mode = 'code';
        continue;
      }
      out += ch === '\n' ? '\n' : ' ';
      i++;
      continue;
    }
    if (mode === 'single' || mode === 'double' || mode === 'template') {
      if (ch === '\\') {
        out += ch + (next ?? '');
        i += 2;
        continue;
      }
      out += ch;
      i++;
      if (mode === 'template' && ch === '$' && next === '{') {
        out += next;
        i++;
        braceDepth++;
        interpolationDepths.push(braceDepth);
        mode = 'code';
        continue;
      }
      const quote = mode === 'single' ? "'" : mode === 'double' ? '"' : '`';
      if (ch === quote || (mode !== 'template' && ch === '\n')) mode = 'code';
      continue;
    }
    // code mode
    if (ch === '/' && next === '/') {
      mode = 'line';
      i += 2;
      continue;
    }
    if (ch === '/' && next === '*') {
      out += '  ';
      mode = 'block';
      i += 2;
      continue;
    }
    if (ch === "'") mode = 'single';
    else if (ch === '"') mode = 'double';
    else if (ch === '`') mode = 'template';
    else if (ch === '{') braceDepth++;
    else if (ch === '}') {
      if (
        interpolationDepths.length > 0 &&
        braceDepth === interpolationDepths[interpolationDepths.length - 1]
      ) {
        interpolationDepths.pop();
        mode = 'template';
      } else {
        braceDepth--;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

/** Escape a literal string so it can be embedded in a RegExp source. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mojibake/replacement characters forbidden in current source and docs.
 * Union of the architecture-contract and text-integrity gate lists (#805) —
 * the two gates used to carry drifted private copies.
 */
export const MOJIBAKE_CHARS: readonly string[] = [
  '\ufffd',
  '\u951f',
  '\u9239',
  '\u9225',
  '\u9242',
  '\u9241',
  '\u9283',
  '\u923f',
  '\u9983',
  '\u9514',
  '\u72c5',
  '\u7b0d',
  '\u93cb',
  '\u951b',
  '\u9286',
  '\u9428',
  '\u4e7a',
  '\u4fa4',
  '\u6c98',
  '\u5866',
  '\u573d',
  '\u4fd9',
  '\u95b3',
];
