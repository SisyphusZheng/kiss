/**
 * Production transport for PR CI evidence provenance (#1156 R8): resolves the
 * recorded workflow run through the GitHub API via the `gh` CLI, and downloads
 * named run artifacts (closure role GO evidence, #1187). This is the only
 * network-dependent piece of the evidence path; every verification rule
 * lives in loop-evidence.ts behind the injectable GitHubRunQuery seam, so
 * tests never touch the network or credentials.
 */

import type { ArtifactContentQuery, GitHubRunInfo, GitHubRunQuery } from './loop-evidence.ts';

async function ghApi(endpoint: string): Promise<unknown> {
  const output = await new Deno.Command('gh', {
    args: ['api', endpoint],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) {
    throw new Error(
      `gh api ${endpoint} failed with exit ${output.code}: ${
        new TextDecoder().decode(output.stderr).trim()
      }`,
    );
  }
  return JSON.parse(new TextDecoder().decode(output.stdout));
}

async function repositoryFullName(): Promise<string> {
  const output = await new Deno.Command('gh', {
    args: ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) {
    throw new Error(
      `gh repo view failed with exit ${output.code}: ${
        new TextDecoder().decode(output.stderr).trim()
      }`,
    );
  }
  return new TextDecoder().decode(output.stdout).trim();
}

/**
 * Build the production GitHubRunQuery. Resolves the run, the jobs of the
 * record's exact run attempt, and the run's artifact names; every network or
 * shape failure throws, which the verifier turns into a closed rejection.
 */
export async function createGhCliRunQuery(runAttempt: number): Promise<GitHubRunQuery> {
  const repo = await repositoryFullName();
  return async (runId: number): Promise<GitHubRunInfo> => {
    const run = await ghApi(`repos/${repo}/actions/runs/${runId}`) as {
      head_sha?: string;
      event?: string;
      status?: string;
      conclusion?: string | null;
      run_attempt?: number;
      path?: string;
    };
    const jobs = await ghApi(
      `repos/${repo}/actions/runs/${runId}/attempts/${runAttempt}/jobs?per_page=100`,
    ) as { jobs?: Array<{ name?: string; status?: string; conclusion?: string | null }> };
    const artifacts = await ghApi(
      `repos/${repo}/actions/runs/${runId}/artifacts?per_page=100`,
    ) as { artifacts?: Array<{ name?: string; expired?: boolean }> };
    return {
      repository: repo,
      workflowPath: run.path ?? '',
      event: run.event ?? '',
      headSha: run.head_sha ?? '',
      status: run.status ?? '',
      conclusion: run.conclusion ?? null,
      runAttempt: run.run_attempt ?? -1,
      jobs: (jobs.jobs ?? []).map((job) => ({
        name: job.name ?? '',
        status: job.status ?? '',
        conclusion: job.conclusion ?? null,
      })),
      artifactNames: (artifacts.artifacts ?? [])
        .filter((artifact) => artifact.expired !== true)
        .map((artifact) => artifact.name ?? ''),
    };
  };
}

/**
 * Build the production ArtifactContentQuery (#1187): downloads one named
 * artifact of a workflow run through the gh CLI (which handles the zip
 * container) into a temporary directory and returns its single file's content.
 * Any download, shape or ambiguity failure throws, which the verifier turns
 * into a closed rejection.
 */
export function createGhCliArtifactQuery(): ArtifactContentQuery {
  return async (runId: number, artifactName: string): Promise<string> => {
    const dir = await Deno.makeTempDir({ prefix: 'closure-go-evidence-' });
    try {
      const output = await new Deno.Command('gh', {
        args: ['run', 'download', String(runId), '--name', artifactName, '--dir', dir],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      if (output.code !== 0) {
        throw new Error(
          `gh run download ${runId} (${artifactName}) failed with exit ${output.code}: ${
            new TextDecoder().decode(output.stderr).trim()
          }`,
        );
      }
      const files: string[] = [];
      for await (const entry of Deno.readDir(dir)) {
        if (entry.isFile) files.push(entry.name);
      }
      if (files.length !== 1) {
        throw new Error(
          `artifact ${artifactName} on run ${runId} must contain exactly one file, ` +
            `found ${files.length}`,
        );
      }
      return await Deno.readTextFile(`${dir}/${files[0]}`);
    } finally {
      await Deno.remove(dir, { recursive: true });
    }
  };
}
