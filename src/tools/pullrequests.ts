/**
 * Pull Request Tools
 *
 * MCP tools for Bitbucket pull request management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all pull request related tools
 */
export function registerPullRequestTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Pull Requests
  // ===========================================================================
  server.tool(
    'bitbucket_list_pull_requests',
    `List pull requests in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - state: Filter by state ('OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'). Can specify multiple by repeating.
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - q: Query filter
  - sort: Sort field (e.g., '-created_on' for newest first)
  - format: Response format ('json' or 'markdown')

Returns:
  List of pull requests with id, title, state, author, and branches.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      state: z.string().optional().describe('Filter by state (OPEN, MERGED, DECLINED, SUPERSEDED)'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      q: z.string().optional().describe('Query filter'),
      sort: z.string().optional().describe('Sort field'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, state, pagelen, page, q, sort, format }) => {
      try {
        const result = await client.listPullRequests(workspace, repo_slug, {
          state,
          pagelen,
          page,
          q,
          sort,
        });
        return formatResponse(result, format, 'pullrequests');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Pull Request
  // ===========================================================================
  server.tool(
    'bitbucket_get_pull_request',
    `Get details for a specific pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID
  - format: Response format ('json' or 'markdown')

Returns:
  Pull request details including title, description, state, branches, reviewers, and more.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pr_id, format }) => {
      try {
        const result = await client.getPullRequest(workspace, repo_slug, pr_id);
        return formatResponse(result, format, 'pullrequest');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Pull Request
  // ===========================================================================
  server.tool(
    'bitbucket_create_pull_request',
    `Create a new pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - title: Pull request title
  - source_branch: Source branch name
  - destination_branch: Destination branch name (optional, defaults to main branch)
  - description: Pull request description
  - close_source_branch: Close source branch after merge (default: false)
  - reviewers: Array of reviewer UUIDs

Returns:
  The created pull request.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      title: z.string().describe('Pull request title'),
      source_branch: z.string().describe('Source branch name'),
      destination_branch: z.string().optional().describe('Destination branch name'),
      description: z.string().optional().describe('Pull request description'),
      close_source_branch: z.boolean().default(false).describe('Close source branch after merge'),
      reviewers: z.array(z.string()).optional().describe('Array of reviewer UUIDs'),
    },
    async ({
      workspace,
      repo_slug,
      title,
      source_branch,
      destination_branch,
      description,
      close_source_branch,
      reviewers,
    }) => {
      try {
        const result = await client.createPullRequest(workspace, repo_slug, {
          title,
          source: { branch: { name: source_branch } },
          ...(destination_branch && { destination: { branch: { name: destination_branch } } }),
          description,
          close_source_branch,
          ...(reviewers && { reviewers: reviewers.map((uuid) => ({ uuid })) }),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Pull request created', pullrequest: result },
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
  // Update Pull Request
  // ===========================================================================
  server.tool(
    'bitbucket_update_pull_request',
    `Update an existing pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID
  - title: New title
  - description: New description
  - destination_branch: New destination branch
  - reviewers: New list of reviewer UUIDs

Returns:
  The updated pull request.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      destination_branch: z.string().optional().describe('New destination branch'),
      reviewers: z.array(z.string()).optional().describe('New reviewer UUIDs'),
    },
    async ({ workspace, repo_slug, pr_id, title, description, destination_branch, reviewers }) => {
      try {
        const result = await client.updatePullRequest(workspace, repo_slug, pr_id, {
          title,
          description,
          ...(destination_branch && { destination: { branch: { name: destination_branch } } }),
          ...(reviewers && { reviewers: reviewers.map((uuid) => ({ uuid })) }),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Pull request updated', pullrequest: result },
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
  // Approve Pull Request
  // ===========================================================================
  server.tool(
    'bitbucket_approve_pull_request',
    `Approve a pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID

Returns:
  Confirmation of approval.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
    },
    async ({ workspace, repo_slug, pr_id }) => {
      try {
        await client.approvePullRequest(workspace, repo_slug, pr_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Pull request #${pr_id} approved` },
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
  // Unapprove Pull Request
  // ===========================================================================
  server.tool(
    'bitbucket_unapprove_pull_request',
    `Remove approval from a pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID

Returns:
  Confirmation of unapproval.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
    },
    async ({ workspace, repo_slug, pr_id }) => {
      try {
        await client.unapprovePullRequest(workspace, repo_slug, pr_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Approval removed from pull request #${pr_id}` },
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
  // Decline Pull Request
  // ===========================================================================
  server.tool(
    'bitbucket_decline_pull_request',
    `Decline a pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID

Returns:
  The declined pull request.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
    },
    async ({ workspace, repo_slug, pr_id }) => {
      try {
        const result = await client.declinePullRequest(workspace, repo_slug, pr_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Pull request #${pr_id} declined`, pullrequest: result },
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
  // Merge Pull Request
  // ===========================================================================
  server.tool(
    'bitbucket_merge_pull_request',
    `Merge a pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID
  - message: Merge commit message
  - close_source_branch: Close source branch after merge
  - merge_strategy: Merge strategy ('merge_commit', 'squash', 'fast_forward')

Returns:
  The merged pull request.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
      message: z.string().optional().describe('Merge commit message'),
      close_source_branch: z.boolean().optional().describe('Close source branch after merge'),
      merge_strategy: z
        .enum(['merge_commit', 'squash', 'fast_forward'])
        .optional()
        .describe('Merge strategy'),
    },
    async ({ workspace, repo_slug, pr_id, message, close_source_branch, merge_strategy }) => {
      try {
        const result = await client.mergePullRequest(workspace, repo_slug, pr_id, {
          message,
          close_source_branch,
          merge_strategy,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Pull request #${pr_id} merged`, pullrequest: result },
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
  // List Pull Request Comments
  // ===========================================================================
  server.tool(
    'bitbucket_list_pull_request_comments',
    `List comments on a pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of comments with id, content, author, and timestamps.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pr_id, pagelen, page, format }) => {
      try {
        const result = await client.listPullRequestComments(workspace, repo_slug, pr_id, {
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
  // Create Pull Request Comment
  // ===========================================================================
  server.tool(
    'bitbucket_create_pull_request_comment',
    `Add a comment to a pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID
  - content: Comment content (supports markdown)

Returns:
  The created comment.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
      content: z.string().describe('Comment content'),
    },
    async ({ workspace, repo_slug, pr_id, content }) => {
      try {
        const result = await client.createPullRequestComment(workspace, repo_slug, pr_id, content);
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

  // ===========================================================================
  // Get Pull Request Diff
  // ===========================================================================
  server.tool(
    'bitbucket_get_pull_request_diff',
    `Get the diff for a pull request.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pr_id: The pull request ID

Returns:
  The unified diff as text.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pr_id: z.number().int().describe('Pull request ID'),
    },
    async ({ workspace, repo_slug, pr_id }) => {
      try {
        const result = await client.getPullRequestDiff(workspace, repo_slug, pr_id);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
