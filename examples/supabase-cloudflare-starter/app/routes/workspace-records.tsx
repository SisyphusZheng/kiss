import { definePage, type LoaderContext, useLoaderData } from '@openelement/app';
import {
  encodeWorkspaceCursor,
  parseWorkspaceListInput,
  WORKSPACE_PAGE_SIZE,
} from '../../../../lib/workspace-pagination.ts';
import { createServerSupabase } from '../../lib/supabase-server.ts';

export const tagName = 'page-workspace-records';

interface WorkspaceRecord {
  id: number;
  title: string;
  status: 'active' | 'archived';
  created_at: string;
}

interface WorkspaceRecordsData {
  denied: boolean;
  invalid?: boolean;
  records?: WorkspaceRecord[];
  nextCursor?: string;
  nextHref?: string;
  error?: string;
}

export interface WorkspaceRecordsQuery extends
  PromiseLike<{
    data: WorkspaceRecord[] | null;
    error: { message: string } | null;
  }> {
  eq(column: string, value: string): WorkspaceRecordsQuery;
  ilike(column: string, pattern: string): WorkspaceRecordsQuery;
  or(expression: string): WorkspaceRecordsQuery;
  order(column: string, options: { ascending: boolean }): WorkspaceRecordsQuery;
  limit(count: number): WorkspaceRecordsQuery;
}

export interface WorkspaceRecordsClient {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null } }> };
  from(table: 'workspace_records'): {
    select(columns: string): WorkspaceRecordsQuery;
  };
}

export type WorkspaceRecordsClientFactory = (
  env: Record<string, string>,
  request: Request,
  responseHeaders: Headers,
) => WorkspaceRecordsClient;

export function createWorkspaceRecordsLoader(
  createClient: WorkspaceRecordsClientFactory =
    createServerSupabase as unknown as WorkspaceRecordsClientFactory,
) {
  return async function workspaceRecordsLoader(
    ctx: LoaderContext<Record<string, string>>,
  ): Promise<WorkspaceRecordsData> {
    const input = parseWorkspaceListInput(new URL(ctx.request.url));
    if (!input) return { denied: false, invalid: true };
    const supabase = createClient(ctx.env, ctx.request, ctx.responseHeaders);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { denied: true };

    let query = supabase.from('workspace_records')
      .select('id, title, status, created_at')
      .eq('workspace_id', input.workspaceId);
    if (input.status) query = query.eq('status', input.status);
    if (input.titlePrefix) query = query.ilike('title', `${input.titlePrefix}%`);
    if (input.cursor) {
      query = query.or(
        `created_at.lt.${input.cursor.createdAt},and(created_at.eq.${input.cursor.createdAt},id.lt.${input.cursor.id})`,
      );
    }
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(WORKSPACE_PAGE_SIZE + 1);
    if (error) return { denied: false, error: error.message };
    const rows = data ?? [];
    const records = rows.slice(0, WORKSPACE_PAGE_SIZE);
    const last = records.at(-1);
    const nextCursor = rows.length > WORKSPACE_PAGE_SIZE && last
      ? encodeWorkspaceCursor({ createdAt: last.created_at, id: last.id })
      : undefined;
    const nextUrl = new URL(ctx.request.url);
    if (nextCursor) nextUrl.searchParams.set('cursor', nextCursor);
    return {
      denied: false,
      records,
      nextCursor,
      nextHref: nextCursor ? `${nextUrl.pathname}${nextUrl.search}` : undefined,
    };
  };
}

export const loader = createWorkspaceRecordsLoader();

const WorkspaceRecordsPage = definePage<WorkspaceRecordsData>({
  renderIntent: { mode: 'dynamic' },
  head: { title: 'Workspace records — qualification fixture' },
  render() {
    const data = useLoaderData() as WorkspaceRecordsData;
    if (data.denied) {
      return (
        <main>
          <h1>Workspace records</h1>
          <p>Sign-in required.</p>
        </main>
      );
    }
    if (data.invalid) {
      return (
        <main>
          <h1>Workspace records</h1>
          <p>Valid workspace required.</p>
        </main>
      );
    }
    return (
      <main>
        <h1>Workspace records</h1>
        {data.error ? <p>{data.error}</p> : null}
        <ul id='workspace-records'>
          {(data.records ?? []).map((record) => (
            <li key={record.id} data-status={record.status}>{record.title}</li>
          ))}
        </ul>
        {data.nextHref ? <a id='next-page' href={data.nextHref}>Next page</a> : null}
      </main>
    );
  },
});

customElements.define(tagName, WorkspaceRecordsPage);
export default WorkspaceRecordsPage;
