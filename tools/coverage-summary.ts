export interface CoverageMetric {
  covered: number;
  total: number;
  percentage: number;
}

export interface CoverageSummary {
  lines: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
}

interface FileCoverage {
  lines: Map<string, boolean>;
  branches: Map<string, boolean>;
  functions: Map<string, boolean>;
}

/** Only versioned, publishable runtime sources belong in the release coverage gate. */
export function isProductionPackageSource(path: string): boolean {
  return /\/packages\/[^/]+\/src\//.test(path) && !path.includes('/__tests__/');
}

export function parseLcov(lcov: string): CoverageSummary {
  const files = new Map<string, FileCoverage>();
  let currentPath = '';
  let current: FileCoverage | undefined;

  for (const line of lcov.split('\n')) {
    if (line.startsWith('SF:')) {
      currentPath = line.slice(3);
      current = files.get(currentPath) ?? {
        lines: new Map(),
        branches: new Map(),
        functions: new Map(),
      };
      files.set(currentPath, current);
    } else if (current && line.startsWith('DA:')) {
      const [lineNumber, hits] = line.slice(3).split(',');
      mergeHit(current.lines, lineNumber, Number(hits) > 0);
    } else if (current && line.startsWith('BRDA:')) {
      const [lineNumber, block, branch, hits] = line.slice(5).split(',');
      mergeHit(
        current.branches,
        `${lineNumber}:${block}:${branch}`,
        hits !== '-' && Number(hits) > 0,
      );
    } else if (current && line.startsWith('FNDA:')) {
      const [hits, ...name] = line.slice(5).split(',');
      mergeHit(current.functions, name.join(','), Number(hits) > 0);
    } else if (line === 'end_of_record') {
      currentPath = '';
      current = undefined;
    }
  }

  const included = [...files.entries()]
    .filter(([path]) => isProductionPackageSource(path))
    .map(([, coverage]) => coverage);
  return {
    lines: metric(included.flatMap((file) => [...file.lines.values()])),
    branches: metric(included.flatMap((file) => [...file.branches.values()])),
    functions: metric(included.flatMap((file) => [...file.functions.values()])),
  };
}

function mergeHit(values: Map<string, boolean>, key: string, hit: boolean): void {
  values.set(key, (values.get(key) ?? false) || hit);
}

function metric(values: boolean[]): CoverageMetric {
  const covered = values.filter(Boolean).length;
  return {
    covered,
    total: values.length,
    percentage: values.length ? covered / values.length * 100 : 0,
  };
}
