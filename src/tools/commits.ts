/**
 * Commit Tools
 *
 * MCP tools for Bitbucket commit management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all commit-related tools
 */
export function registerCommitTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Commits
  // ===========================================================================
  server.tool(
    'bitbucket_list_commits',
    `List commits in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - revision: Branch name, tag, or commit hash to start from
  - include: Include commits reachable from this ref
  - exclude: Exclude commits reachable from this ref
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of commits with hash, message, author, and date.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      revision: z.string().optional().describe('Branch, tag, or commit to start from'),
      include: z.string().optional().describe('Include commits reachable from this ref'),
      exclude: z.string().optional().describe('Exclude commits reachable from this ref'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, revision, include, exclude, pagelen, page, format }) => {
      try {
        const result = await client.listCommits(workspace, repo_slug, {
          revision,
          include,
          exclude,
          pagelen,
          page,
        });
        return formatResponse(result, format, 'commits');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Commit
  // ===========================================================================
  server.tool(
    'bitbucket_get_commit',
    `Get details for a specific commit.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - commit_hash: The commit hash (full or abbreviated)
  - format: Response format ('json' or 'markdown')

Returns:
  Commit details including hash, message, author, date, and parents.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      commit_hash: z.string().describe('Commit hash'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, commit_hash, format }) => {
      try {
        const result = await client.getCommit(workspace, repo_slug, commit_hash);
        return formatResponse(result, format, 'commit');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Commit Statuses
  // ===========================================================================
  server.tool(
    'bitbucket_list_commit_statuses',
    `List build statuses for a commit.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - commit_hash: The commit hash
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of build statuses with state, key, name, and URL.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      commit_hash: z.string().describe('Commit hash'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, commit_hash, pagelen, page, format }) => {
      try {
        const result = await client.listCommitStatuses(workspace, repo_slug, commit_hash, {
          pagelen,
          page,
        });
        return formatResponse(result, format, 'statuses');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Commit Status
  // ===========================================================================
  server.tool(
    'bitbucket_create_commit_status',
    `Create a build status for a commit.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - commit_hash: The commit hash
  - state: Status state ('SUCCESSFUL', 'FAILED', 'INPROGRESS', 'STOPPED')
  - key: Unique key for this status
  - url: URL to the build/CI system
  - name: Display name for the status
  - description: Status description

Returns:
  The created commit status.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      commit_hash: z.string().describe('Commit hash'),
      state: z.enum(['SUCCESSFUL', 'FAILED', 'INPROGRESS', 'STOPPED']).describe('Status state'),
      key: z.string().describe('Unique key for this status'),
      url: z.string().url().describe('URL to the build system'),
      name: z.string().optional().describe('Display name'),
      description: z.string().optional().describe('Status description'),
    },
    async ({ workspace, repo_slug, commit_hash, state, key, url, name, description }) => {
      try {
        const result = await client.createCommitStatus(workspace, repo_slug, commit_hash, {
          state,
          key,
          url,
          name,
          description,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Commit status created', status: result },
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
  // Get Diff
  // ===========================================================================
  server.tool(
    'bitbucket_get_diff',
    `Get the diff between two commits or a commit and its parent.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - spec: Diff specification (e.g., 'commit1..commit2' or just 'commit')

Returns:
  The unified diff as text.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      spec: z.string().describe('Diff spec (e.g., "commit1..commit2" or "commit")'),
    },
    async ({ workspace, repo_slug, spec }) => {
      try {
        const result = await client.getDiff(workspace, repo_slug, spec);
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
