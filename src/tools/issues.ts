/**
 * Issue Tools
 *
 * MCP tools for Bitbucket issue tracker management.
 * Note: Issues must be enabled on the repository to use these endpoints.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all issue-related tools
 */
export function registerIssueTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Issues
  // ===========================================================================
  server.tool(
    'bitbucket_list_issues',
    `List issues in a repository.

Note: Issues must be enabled on the repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - q: Query filter (e.g., 'state="open"', 'priority="critical"')
  - sort: Sort field (e.g., '-created_on' for newest first)
  - format: Response format ('json' or 'markdown')

Returns:
  List of issues with id, title, state, priority, kind, and assignee.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      q: z.string().optional().describe('Query filter'),
      sort: z.string().optional().describe('Sort field'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, q, sort, format }) => {
      try {
        const result = await client.listIssues(workspace, repo_slug, { pagelen, page, q, sort });
        return formatResponse(result, format, 'issues');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Issue
  // ===========================================================================
  server.tool(
    'bitbucket_get_issue',
    `Get details for a specific issue.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - issue_id: The issue ID
  - format: Response format ('json' or 'markdown')

Returns:
  Issue details including title, content, state, priority, kind, assignee, and more.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      issue_id: z.number().int().describe('Issue ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, issue_id, format }) => {
      try {
        const result = await client.getIssue(workspace, repo_slug, issue_id);
        return formatResponse(result, format, 'issue');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Issue
  // ===========================================================================
  server.tool(
    'bitbucket_create_issue',
    `Create a new issue in a repository.

Note: Issues must be enabled on the repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - title: Issue title
  - content: Issue content/description (supports markdown)
  - kind: Issue kind ('bug', 'enhancement', 'proposal', 'task')
  - priority: Issue priority ('trivial', 'minor', 'major', 'critical', 'blocker')
  - assignee_uuid: UUID of the assignee (optional)
  - component: Component name (optional)
  - milestone: Milestone name (optional)
  - version: Version name (optional)

Returns:
  The created issue.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      title: z.string().describe('Issue title'),
      content: z.string().optional().describe('Issue content'),
      kind: z
        .enum(['bug', 'enhancement', 'proposal', 'task'])
        .default('bug')
        .describe('Issue kind'),
      priority: z
        .enum(['trivial', 'minor', 'major', 'critical', 'blocker'])
        .default('major')
        .describe('Priority'),
      assignee_uuid: z.string().optional().describe('Assignee UUID'),
      component: z.string().optional().describe('Component name'),
      milestone: z.string().optional().describe('Milestone name'),
      version: z.string().optional().describe('Version name'),
    },
    async ({
      workspace,
      repo_slug,
      title,
      content,
      kind,
      priority,
      assignee_uuid,
      component,
      milestone,
      version,
    }) => {
      try {
        const result = await client.createIssue(workspace, repo_slug, {
          title,
          ...(content && { content: { raw: content } }),
          kind,
          priority,
          ...(assignee_uuid && { assignee: { uuid: assignee_uuid } }),
          ...(component && { component: { name: component } }),
          ...(milestone && { milestone: { name: milestone } }),
          ...(version && { version: { name: version } }),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Issue created', issue: result },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Issue
  // ===========================================================================
  server.tool(
    'bitbucket_update_issue',
    `Update an existing issue.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - issue_id: The issue ID
  - title: New title
  - content: New content
  - state: New state ('new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed')
  - kind: New kind
  - priority: New priority
  - assignee_uuid: New assignee UUID (or null to unassign)

Returns:
  The updated issue.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      issue_id: z.number().int().describe('Issue ID'),
      title: z.string().optional().describe('New title'),
      content: z.string().optional().describe('New content'),
      state: z
        .enum(['new', 'open', 'resolved', 'on hold', 'invalid', 'duplicate', 'wontfix', 'closed'])
        .optional()
        .describe('New state'),
      kind: z.enum(['bug', 'enhancement', 'proposal', 'task']).optional().describe('New kind'),
      priority: z
        .enum(['trivial', 'minor', 'major', 'critical', 'blocker'])
        .optional()
        .describe('New priority'),
      assignee_uuid: z.string().nullable().optional().describe('New assignee UUID or null'),
    },
    async ({
      workspace,
      repo_slug,
      issue_id,
      title,
      content,
      state,
      kind,
      priority,
      assignee_uuid,
    }) => {
      try {
        const result = await client.updateIssue(workspace, repo_slug, issue_id, {
          title,
          ...(content !== undefined && { content: { raw: content } }),
          state,
          kind,
          priority,
          ...(assignee_uuid !== undefined && {
            assignee: assignee_uuid ? { uuid: assignee_uuid } : null,
          }),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Issue updated', issue: result },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Issue
  // ===========================================================================
  server.tool(
    'bitbucket_delete_issue',
    `Delete an issue.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - issue_id: The issue ID

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      issue_id: z.number().int().describe('Issue ID'),
    },
    async ({ workspace, repo_slug, issue_id }) => {
      try {
        await client.deleteIssue(workspace, repo_slug, issue_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Issue #${issue_id} deleted` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Issue Comments
  // ===========================================================================
  server.tool(
    'bitbucket_list_issue_comments',
    `List comments on an issue.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - issue_id: The issue ID
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of comments with id, content, author, and timestamps.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      issue_id: z.number().int().describe('Issue ID'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, issue_id, pagelen, page, format }) => {
      try {
        const result = await client.listIssueComments(workspace, repo_slug, issue_id, {
          pagelen,
          page,
        });
        return formatResponse(result, format, 'comments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Issue Comment
  // ===========================================================================
  server.tool(
    'bitbucket_create_issue_comment',
    `Add a comment to an issue.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - issue_id: The issue ID
  - content: Comment content (supports markdown)

Returns:
  The created comment.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      issue_id: z.number().int().describe('Issue ID'),
      content: z.string().describe('Comment content'),
    },
    async ({ workspace, repo_slug, issue_id, content }) => {
      try {
        const result = await client.createIssueComment(workspace, repo_slug, issue_id, content);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Comment created', comment: result },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
