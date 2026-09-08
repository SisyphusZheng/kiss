/**
 * Derived from url-pattern-list 0.5.0, Copyright 2025 Justin Fagnani (MIT).
 * See LICENSE and PROVENANCE.md. URLPattern owns all matching and captures.
 */
export interface ListPattern {
  readonly pathname: string;
  exec(input: string): URLPatternResult | null;
}

interface URLPatternListItem<T> {
  readonly sequence: number;
  readonly pattern: ListPattern;
  readonly value: T;
}

export interface URLPatternListMatch<T> {
  result: URLPatternResult;
  value: T;
}

/** Fixed-prefix nodes only; unproven grammars never enter the tree. */
class FixedPrefixTreeNode<T> {
  readonly children = new Map<string, FixedPrefixTreeNode<T>>();
  readonly patterns: URLPatternListItem<T>[] = [];
}

/**
 * A deliberately small literal alphabet, not a URLPattern grammar parser.
 * These characters have no pattern operators/escapes. Every other spelling
 * remains conservative, including groups, regex, empty paths and Unicode.
 * ASCII folding over-selects for case-sensitive patterns and admits ignoreCase
 * patterns without relying on a non-standard URLPattern options getter.
 */
function literalPath(path: string): string | undefined {
  if (!path.startsWith('/')) return undefined;
  for (const char of path) {
    if (!'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_-.%~'.includes(char)) {
      return undefined;
    }
  }
  return path.toLowerCase();
}

/** Immutable ordered snapshot. Input is a URL or URL string (relative with base). */
export class URLPatternList<T> {
  readonly #root = new FixedPrefixTreeNode<T>();
  readonly #conservative: URLPatternListItem<T>[] = [];

  constructor(patterns: Iterable<readonly [ListPattern, T]>) {
    let sequence = 0;
    for (const [pattern, value] of patterns) {
      const item = { sequence: sequence++, pattern, value };
      const key = literalPath(pattern.pathname);
      if (key === undefined) {
        this.#conservative.push(item);
        continue;
      }
      let node = this.#root;
      for (const char of key) {
        let child = node.children.get(char);
        if (!child) node.children.set(char, child = new FixedPrefixTreeNode<T>());
        node = child;
      }
      node.patterns.push(item);
    }
  }

  #fixed(url: URL): readonly URLPatternListItem<T>[] {
    let node: FixedPrefixTreeNode<T> | undefined = this.#root;
    for (const char of url.pathname.toLowerCase()) {
      node = node.children.get(char);
      if (!node) return [];
    }
    return node.patterns;
  }

  match(input: string | URL, baseURL?: string): URLPatternListMatch<T> | null {
    // One URL normalization boundary for both pruning and exec; invalid input
    // throws TypeError even for an empty list. Do not silently turn it into 404.
    const url = new URL(String(input), baseURL);
    const fullURL = url.href;
    const fixed = this.#fixed(url);
    let fast = 0;
    let slow = 0;
    while (fast < fixed.length || slow < this.#conservative.length) {
      const a = fixed[fast];
      const b = this.#conservative[slow];
      const item = a && (!b || a.sequence < b.sequence)
        ? fixed[fast++]
        : this.#conservative[slow++];
      const result = item.pattern.exec(fullURL);
      if (result) return { result, value: item.value };
    }
    return null;
  }

  /** Diagnostic upper bound; no matcher internals are exposed. */
  candidateCount(input: string | URL, baseURL?: string): number {
    return this.#fixed(new URL(String(input), baseURL)).length + this.#conservative.length;
  }
}
