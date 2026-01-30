/**
 * Refs Tools (Branches and Tags)
 *
 * MCP tools for Bitbucket branch and tag management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all branch and tag related tools
 */
export function registerRefsTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Branches
  // ===========================================================================
  server.tool(
    'bitbucket_list_branches',
    `List branches in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - q: Query filter (e.g., 'name ~ "feature"')
  - sort: Sort field (e.g., '-target.date' for newest first)
  - format: Response format ('json' or 'markdown')

Returns:
  List of branches with name and target commit.`,
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
        const result = await client.listBranches(workspace, repo_slug, { pagelen, page, q, sort });
        return formatResponse(result, format, 'branches');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Branch
  // ===========================================================================
  server.tool(
    'bitbucket_get_branch',
    `Get details for a specific branch.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - branch_name: The branch name
  - format: Response format ('json' or 'markdown')

Returns:
  Branch details including name, target commit, and merge strategies.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      branch_name: z.string().describe('Branch name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, branch_name, format }) => {
      try {
        const result = await client.getBranch(workspace, repo_slug, branch_name);
        return formatResponse(result, format, 'branch');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Branch
  // ===========================================================================
  server.tool(
    'bitbucket_create_branch',
    `Create a new branch in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - name: The new branch name
  - target: The commit hash or branch name to create from

Returns:
  The created branch.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      name: z.string().describe('New branch name'),
      target: z.string().describe('Commit hash or branch name to create from'),
    },
    async ({ workspace, repo_slug, name, target }) => {
      try {
        const result = await client.createBranch(workspace, repo_slug, name, target);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Branch created', branch: result },
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
  // Delete Branch
  // ===========================================================================
  server.tool(
    'bitbucket_delete_branch',
    `Delete a branch from a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - branch_name: The branch name to delete

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      branch_name: z.string().describe('Branch name to delete'),
    },
    async ({ workspace, repo_slug, branch_name }) => {
      try {
        await client.deleteBranch(workspace, repo_slug, branch_name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Branch '${branch_name}' deleted` },
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
  // List Tags
  // ===========================================================================
  server.tool(
    'bitbucket_list_tags',
    `List tags in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - q: Query filter
  - sort: Sort field
  - format: Response format ('json' or 'markdown')

Returns:
  List of tags with name, target commit, and message.`,
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
        const result = await client.listTags(workspace, repo_slug, { pagelen, page, q, sort });
        return formatResponse(result, format, 'tags');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Tag
  // ===========================================================================
  server.tool(
    'bitbucket_get_tag',
    `Get details for a specific tag.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - tag_name: The tag name
  - format: Response format ('json' or 'markdown')

Returns:
  Tag details including name, target commit, message, and tagger.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      tag_name: z.string().describe('Tag name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, tag_name, format }) => {
      try {
        const result = await client.getTag(workspace, repo_slug, tag_name);
        return formatResponse(result, format, 'tag');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Tag
  // ===========================================================================
  server.tool(
    'bitbucket_create_tag',
    `Create a new tag in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - name: The new tag name
  - target: The commit hash to tag
  - message: Optional tag message (for annotated tags)

Returns:
  The created tag.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      name: z.string().describe('New tag name'),
      target: z.string().describe('Commit hash to tag'),
      message: z.string().optional().describe('Tag message (for annotated tags)'),
    },
    async ({ workspace, repo_slug, name, target, message }) => {
      try {
        const result = await client.createTag(workspace, repo_slug, name, target, message);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Tag created', tag: result }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Tag
  // ===========================================================================
  server.tool(
    'bitbucket_delete_tag',
    `Delete a tag from a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - tag_name: The tag name to delete

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      tag_name: z.string().describe('Tag name to delete'),
    },
    async ({ workspace, repo_slug, tag_name }) => {
      try {
        await client.deleteTag(workspace, repo_slug, tag_name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Tag '${tag_name}' deleted` },
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
  // Get Branching Model
  // ===========================================================================
  server.tool(
    'bitbucket_get_branching_model',
    `Get the branching model configuration for a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - format: Response format ('json' or 'markdown')

Returns:
  Branching model configuration including development and production branches, and branch types.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, format }) => {
      try {
        const result = await client.getBranchingModel(workspace, repo_slug);
        return formatResponse(result, format, 'branching_model');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
