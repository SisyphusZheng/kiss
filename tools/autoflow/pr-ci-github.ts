/**
 * Production transport for PR CI evidence provenance (#1156 R8): resolves the
 * recorded workflow run through the GitHub API via the `gh` CLI. This is the
 * only network-dependent piece of the evidence path; every verification rule
 * lives in loop-evidence.ts behind the injectable GitHubRunQuery seam, so
 * tests never touch the network or credentials.
 */

import type { GitHubRunInfo, GitHubRunQuery } from './loop-evidence.ts';

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
