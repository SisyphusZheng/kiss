/**
 * Shared package graph utilities for openElement workspace tooling.
 *
 * Reads packages/<name>/deno.json, builds an internal dependency graph, and provides
 * topological sorting / cycle detection used by graph:check and release tasks.
 */

export interface PackageInfo {
  name: string;
  version: string;
  dir: string;
  deps: string[];
  exports: unknown;
  importKeys: Set<string>;
  importValues: Record<string, string>;
}

function normalizeDep(specifier: string, self: string): string | null {
  const prefix = '@openelement/';
  if (!specifier.startsWith(prefix)) return null;
  const rest = specifier.slice(prefix.length);
  const slashIndex = rest.indexOf('/');
  const base = slashIndex === -1 ? specifier : prefix + rest.slice(0, slashIndex);
  return base === self ? null : base;
}

export async function readPackage(dir: string): Promise<PackageInfo | null> {
  const path = `${dir}/deno.json`;
  try {
    const raw = await Deno.readTextFile(path);
    const json = JSON.parse(raw);
    if (!json.name) return null;
    const imports: Record<string, string> = json.imports ?? {};
    const deps = Object.keys(imports)
      .map((specifier) => normalizeDep(specifier, json.name))
      .filter((specifier): specifier is string => specifier !== null);
    return {
      name: json.name,
      version: json.version ?? '',
      dir,
      deps: [...new Set(deps)],
      exports: json.exports,
      importKeys: new Set(Object.keys(imports)),
      importValues: imports,
    };
  } catch {
    return null;
  }
}

export async function readPackages(): Promise<PackageInfo[]> {
  const packages: PackageInfo[] = [];
  for await (const entry of Deno.readDir('packages')) {
    if (!entry.isDirectory) continue;
    const info = await readPackage(`packages/${entry.name}`);
    if (info) packages.push(info);
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildDependencyGraph(packages: PackageInfo[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const pkg of packages) {
    const normalized = pkg.deps
      .map((dep) => normalizeDep(dep, pkg.name))
      .filter((dep): dep is string => dep !== null);
    graph.set(pkg.name, [...new Set(normalized)]);
  }
  return graph;
}

export function detectCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor);
          cycles.push(cycle);
        }
      }
    }

    recStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node, []);
  }

  return cycles;
}

export function topologicalSort(graph: Map<string, string[]>): string[] {
  const inDegree = new Map<string, number>();
  const allNodes = [...graph.keys()];
  const nodeSet = new Set(allNodes);
  const dependents = new Map<string, string[]>();

  for (const node of allNodes) {
    inDegree.set(node, 0);
    dependents.set(node, []);
  }

  for (const [node, deps] of graph) {
    for (const dep of deps) {
      if (nodeSet.has(dep)) {
        inDegree.set(node, (inDegree.get(node) ?? 0) + 1);
        dependents.get(dep)!.push(node);
      }
    }
  }

  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    queue.sort();
    const node = queue.shift()!;
    sorted.push(node);

    for (const neighbor of dependents.get(node) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== allNodes.length) {
    const remaining = allNodes.filter((node) => !sorted.includes(node));
    throw new Error(
      `Graph has a cycle involving: ${remaining.join(', ')}. ` +
        `Sorted ${sorted.length}/${allNodes.length} nodes.`,
    );
  }

  return sorted;
}

export function sortPackages(packages: PackageInfo[]): PackageInfo[] {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const order = topologicalSort(buildDependencyGraph(packages));
  return order.map((name) => byName.get(name)!);
}

export function releasePublishOrder(packages: PackageInfo[]): PackageInfo[] {
  const ordered = sortPackages(packages);
  const position = new Map(ordered.map((pkg, index) => [pkg.name, index]));

  for (const pkg of ordered) {
    for (const dep of pkg.deps) {
      const base = normalizeDep(dep, pkg.name);
      if (!base) continue;
      const depIndex = position.get(base);
      if (depIndex === undefined) continue;
      const pkgIndex = position.get(pkg.name)!;
      if (depIndex > pkgIndex) {
        throw new Error(
          `Package publish order is invalid: ${pkg.name} appears before dependency ${base}.`,
        );
      }
    }
  }

  return ordered;
}
