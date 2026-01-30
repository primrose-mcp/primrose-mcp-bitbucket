/**
 * Response Formatting Utilities for Bitbucket MCP Server
 */

import type {
  Branch,
  Comment,
  Commit,
  Issue,
  PaginatedResponse,
  Pipeline,
  PullRequest,
  Repository,
  ResponseFormat,
  Webhook,
  Workspace,
} from '../types/entities.js';
import { BitbucketApiError, formatErrorForLogging } from './errors.js';

/**
 * MCP tool response type
 */
export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a successful response
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  entityType: string
): ToolResponse {
  if (format === 'markdown') {
    return {
      content: [{ type: 'text', text: formatAsMarkdown(data, entityType) }],
    };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error response
 */
export function formatError(error: unknown): ToolResponse {
  const errorInfo = formatErrorForLogging(error);

  let message: string;
  if (error instanceof BitbucketApiError) {
    message = `Error: ${error.message}`;
    if (error.retryable) {
      message += ' (retryable)';
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details: errorInfo }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Format data as Markdown
 */
function formatAsMarkdown(data: unknown, entityType: string): string {
  if (isPaginatedResponse(data)) {
    return formatPaginatedAsMarkdown(data, entityType);
  }

  if (Array.isArray(data)) {
    return formatArrayAsMarkdown(data, entityType);
  }

  if (typeof data === 'object' && data !== null) {
    return formatObjectAsMarkdown(data as Record<string, unknown>, entityType);
  }

  return String(data);
}

/**
 * Type guard for paginated response
 */
function isPaginatedResponse(data: unknown): data is PaginatedResponse<unknown> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as PaginatedResponse<unknown>).items)
  );
}

/**
 * Format paginated response as Markdown
 */
function formatPaginatedAsMarkdown(data: PaginatedResponse<unknown>, entityType: string): string {
  const lines: string[] = [];

  lines.push(`## ${capitalize(entityType)}`);
  lines.push('');

  if (data.total !== undefined) {
    lines.push(`**Total:** ${data.total} | **Showing:** ${data.count}`);
  } else {
    lines.push(`**Showing:** ${data.count}`);
  }

  if (data.hasMore) {
    lines.push(`**More available:** Yes`);
  }
  lines.push('');

  if (data.items.length === 0) {
    lines.push('_No items found._');
    return lines.join('\n');
  }

  // Format items based on entity type
  switch (entityType) {
    case 'workspaces':
      lines.push(formatWorkspacesTable(data.items as Workspace[]));
      break;
    case 'repositories':
      lines.push(formatRepositoriesTable(data.items as Repository[]));
      break;
    case 'branches':
      lines.push(formatBranchesTable(data.items as Branch[]));
      break;
    case 'commits':
      lines.push(formatCommitsTable(data.items as Commit[]));
      break;
    case 'pullrequests':
    case 'pull_requests':
      lines.push(formatPullRequestsTable(data.items as PullRequest[]));
      break;
    case 'issues':
      lines.push(formatIssuesTable(data.items as Issue[]));
      break;
    case 'pipelines':
      lines.push(formatPipelinesTable(data.items as Pipeline[]));
      break;
    case 'webhooks':
      lines.push(formatWebhooksTable(data.items as Webhook[]));
      break;
    case 'comments':
      lines.push(formatCommentsTable(data.items as Comment[]));
      break;
    default:
      lines.push(formatGenericTable(data.items));
  }

  return lines.join('\n');
}

/**
 * Format workspaces as Markdown table
 */
function formatWorkspacesTable(workspaces: Workspace[]): string {
  const lines: string[] = [];
  lines.push('| Slug | Name | UUID |');
  lines.push('|---|---|---|');

  for (const ws of workspaces) {
    lines.push(`| ${ws.slug} | ${ws.name} | ${ws.uuid} |`);
  }

  return lines.join('\n');
}

/**
 * Format repositories as Markdown table
 */
function formatRepositoriesTable(repos: Repository[]): string {
  const lines: string[] = [];
  lines.push('| Name | Full Name | Private | Language | Updated |');
  lines.push('|---|---|---|---|---|');

  for (const repo of repos) {
    const updated = repo.updated_on ? new Date(repo.updated_on).toLocaleDateString() : '-';
    lines.push(
      `| ${repo.name} | ${repo.full_name} | ${repo.is_private ? 'Yes' : 'No'} | ${repo.language || '-'} | ${updated} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format branches as Markdown table
 */
function formatBranchesTable(branches: Branch[]): string {
  const lines: string[] = [];
  lines.push('| Name | Target Commit |');
  lines.push('|---|---|');

  for (const branch of branches) {
    const commitHash = branch.target?.hash ? branch.target.hash.substring(0, 7) : '-';
    lines.push(`| ${branch.name} | ${commitHash} |`);
  }

  return lines.join('\n');
}

/**
 * Format commits as Markdown table
 */
function formatCommitsTable(commits: Commit[]): string {
  const lines: string[] = [];
  lines.push('| Hash | Message | Author | Date |');
  lines.push('|---|---|---|---|');

  for (const commit of commits) {
    const hash = commit.hash.substring(0, 7);
    const message = (commit.message || '-').split('\n')[0].substring(0, 50);
    const author = commit.author?.raw || commit.author?.user?.display_name || '-';
    const date = commit.date ? new Date(commit.date).toLocaleDateString() : '-';
    lines.push(`| ${hash} | ${message} | ${author} | ${date} |`);
  }

  return lines.join('\n');
}

/**
 * Format pull requests as Markdown table
 */
function formatPullRequestsTable(prs: PullRequest[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title | State | Author | Source -> Dest |');
  lines.push('|---|---|---|---|---|');

  for (const pr of prs) {
    const author = pr.author?.display_name || pr.author?.username || '-';
    const branches = `${pr.source.branch.name} -> ${pr.destination.branch.name}`;
    lines.push(`| #${pr.id} | ${pr.title} | ${pr.state} | ${author} | ${branches} |`);
  }

  return lines.join('\n');
}

/**
 * Format issues as Markdown table
 */
function formatIssuesTable(issues: Issue[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title | State | Priority | Kind | Assignee |');
  lines.push('|---|---|---|---|---|---|');

  for (const issue of issues) {
    const assignee = issue.assignee?.display_name || issue.assignee?.username || '-';
    lines.push(
      `| #${issue.id} | ${issue.title} | ${issue.state} | ${issue.priority} | ${issue.kind} | ${assignee} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format pipelines as Markdown table
 */
function formatPipelinesTable(pipelines: Pipeline[]): string {
  const lines: string[] = [];
  lines.push('| Build # | State | Target | Duration | Created |');
  lines.push('|---|---|---|---|---|');

  for (const pipeline of pipelines) {
    const state = pipeline.state?.name || '-';
    const target = pipeline.target?.ref_name || '-';
    const duration = pipeline.duration_in_seconds
      ? `${Math.floor(pipeline.duration_in_seconds / 60)}m ${pipeline.duration_in_seconds % 60}s`
      : '-';
    const created = pipeline.created_on ? new Date(pipeline.created_on).toLocaleDateString() : '-';
    lines.push(`| #${pipeline.build_number} | ${state} | ${target} | ${duration} | ${created} |`);
  }

  return lines.join('\n');
}

/**
 * Format webhooks as Markdown table
 */
function formatWebhooksTable(webhooks: Webhook[]): string {
  const lines: string[] = [];
  lines.push('| UUID | URL | Active | Events |');
  lines.push('|---|---|---|---|');

  for (const webhook of webhooks) {
    const events = webhook.events?.join(', ') || '-';
    lines.push(
      `| ${webhook.uuid} | ${webhook.url} | ${webhook.active ? 'Yes' : 'No'} | ${events} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format comments as Markdown table
 */
function formatCommentsTable(comments: Comment[]): string {
  const lines: string[] = [];
  lines.push('| ID | Author | Content | Created |');
  lines.push('|---|---|---|---|');

  for (const comment of comments) {
    const author = comment.user?.display_name || comment.user?.username || '-';
    const content = (comment.content?.raw || '-').substring(0, 50);
    const created = comment.created_on ? new Date(comment.created_on).toLocaleDateString() : '-';
    lines.push(`| ${comment.id} | ${author} | ${content} | ${created} |`);
  }

  return lines.join('\n');
}

/**
 * Format a generic array as Markdown table
 */
function formatGenericTable(items: unknown[]): string {
  if (items.length === 0) return '_No items_';

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5);

  const lines: string[] = [];
  lines.push(`| ${keys.join(' | ')} |`);
  lines.push(`|${keys.map(() => '---').join('|')}|`);

  for (const item of items) {
    const record = item as Record<string, unknown>;
    const values = keys.map((k) => String(record[k] ?? '-'));
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Format an array as Markdown
 */
function formatArrayAsMarkdown(data: unknown[], entityType: string): string {
  return formatGenericTable(data);
}

/**
 * Format a single object as Markdown
 */
function formatObjectAsMarkdown(data: Record<string, unknown>, entityType: string): string {
  const lines: string[] = [];
  lines.push(`## ${capitalize(entityType.replace(/s$/, ''))}`);
  lines.push('');

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object') {
      lines.push(`**${formatKey(key)}:**`);
      lines.push('```json');
      lines.push(JSON.stringify(value, null, 2));
      lines.push('```');
    } else {
      lines.push(`**${formatKey(key)}:** ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a key for display (camelCase/snake_case to Title Case)
 */
function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
