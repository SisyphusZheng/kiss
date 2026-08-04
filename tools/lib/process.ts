/**
 * Shared process/command helpers for openElement tooling.
 */

/** Read the value of a `--flag value` pair from Deno.args, or null. */
export function getArg(flag: string): string | null {
  const idx = Deno.args.indexOf(flag);
  if (idx !== -1 && idx + 1 < Deno.args.length) return Deno.args[idx + 1];
  return null;
}

export interface RunCommandOptions {
  cwd?: string | URL;
  env?: Record<string, string>;
  stdin?: 'inherit' | 'piped' | 'null';
  stdout?: 'inherit' | 'piped' | 'null';
  stderr?: 'inherit' | 'piped' | 'null';
}

export interface RunWithOutputResult {
  success: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

/** Run a command and stream stdio by default. Throws on non-zero exit. */
export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<void> {
  const { cwd, env, stdin = 'inherit', stdout = 'inherit', stderr = 'inherit' } = options;
  console.log(`$ ${[command, ...args].join(' ')}${cwd ? `  # cwd=${cwd}` : ''}`);
  const proc = new Deno.Command(command, {
    args,
    cwd,
    env,
    stdin,
    stdout,
    stderr,
  });
  const status = await proc.spawn().status;
  if (!status.success) {
    throw new Error(`Command failed with exit code ${status.code}: ${command} ${args.join(' ')}`);
  }
}

export interface RunWithOutputOptions {
  cwd?: string | URL;
  env?: Record<string, string>;
}

/** Run a command capturing stdout/stderr and return the result without throwing. */
export async function runWithOutput(
  command: string,
  args: string[],
  options: RunWithOutputOptions = {},
): Promise<RunWithOutputResult> {
  const { cwd, env } = options;
  const result = await new Deno.Command(command, {
    args,
    cwd,
    env,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  return {
    success: result.code === 0,
    code: result.code,
    stdout: decoder.decode(result.stdout),
    stderr: decoder.decode(result.stderr),
  };
}
