/**
 * Repository Tools
 *
 * MCP tools for Bitbucket repository management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all repository-related tools
 */
export function registerRepositoryTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Repositories
  // ===========================================================================
  server.tool(
    'bitbucket_list_repositories',
    `List repositories in a workspace.

Returns a paginated list of repositories. Can filter by role (member, contributor, admin, owner).

Args:
  - workspace: The workspace slug or UUID
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - q: Query filter (e.g., 'name ~ "test"')
  - sort: Sort field (e.g., '-updated_on' for newest first)
  - format: Response format ('json' or 'markdown')

Returns:
  List of repositories with name, full_name, privacy status, and more.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      pagelen: z.number().int().min(1).max(100).default(20).describe('Items per page'),
      page: z.number().int().min(1).optional().describe('Page number'),
      q: z.string().optional().describe('Query filter'),
      sort: z.string().optional().describe('Sort field'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, pagelen, page, q, sort, format }) => {
      try {
        const result = await client.listRepositories(workspace, { pagelen, page, q, sort });
        return formatResponse(result, format, 'repositories');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Repository
  // ===========================================================================
  server.tool(
    'bitbucket_get_repository',
    `Get details for a specific repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - format: Response format ('json' or 'markdown')

Returns:
  Repository details including name, description, size, language, main branch, etc.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, format }) => {
      try {
        const result = await client.getRepository(workspace, repo_slug);
        return formatResponse(result, format, 'repository');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Repository
  // ===========================================================================
  server.tool(
    'bitbucket_create_repository',
    `Create a new repository in a workspace.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug (URL-friendly name)
  - name: Display name (optional, defaults to repo_slug)
  - description: Repository description
  - is_private: Whether the repository is private (default: true)
  - has_issues: Enable issue tracker (default: false)
  - has_wiki: Enable wiki (default: false)
  - language: Programming language
  - fork_policy: Fork policy ('allow_forks', 'no_public_forks', 'no_forks')
  - project_key: Project key to assign the repository to

Returns:
  The created repository.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      name: z.string().optional().describe('Display name'),
      description: z.string().optional().describe('Repository description'),
      is_private: z.boolean().default(true).describe('Private repository'),
      has_issues: z.boolean().default(false).describe('Enable issue tracker'),
      has_wiki: z.boolean().default(false).describe('Enable wiki'),
      language: z.string().optional().describe('Programming language'),
      fork_policy: z
        .enum(['allow_forks', 'no_public_forks', 'no_forks'])
        .optional()
        .describe('Fork policy'),
      project_key: z.string().optional().describe('Project key'),
    },
    async ({
      workspace,
      repo_slug,
      name,
      description,
      is_private,
      has_issues,
      has_wiki,
      language,
      fork_policy,
      project_key,
    }) => {
      try {
        const result = await client.createRepository(workspace, repo_slug, {
          scm: 'git',
          name,
          description,
          is_private,
          has_issues,
          has_wiki,
          language,
          fork_policy,
          ...(project_key && { project: { key: project_key } }),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Repository created', repository: result },
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
  // Update Repository
  // ===========================================================================
  server.tool(
    'bitbucket_update_repository',
    `Update an existing repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - description: New description
  - is_private: Change privacy setting
  - has_issues: Enable/disable issue tracker
  - has_wiki: Enable/disable wiki
  - language: Update programming language
  - fork_policy: Update fork policy

Returns:
  The updated repository.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      description: z.string().optional().describe('New description'),
      is_private: z.boolean().optional().describe('Private repository'),
      has_issues: z.boolean().optional().describe('Enable issue tracker'),
      has_wiki: z.boolean().optional().describe('Enable wiki'),
      language: z.string().optional().describe('Programming language'),
      fork_policy: z
        .enum(['allow_forks', 'no_public_forks', 'no_forks'])
        .optional()
        .describe('Fork policy'),
    },
    async ({ workspace, repo_slug, ...input }) => {
      try {
        const result = await client.updateRepository(workspace, repo_slug, input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Repository updated', repository: result },
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
  // Delete Repository
  // ===========================================================================
  server.tool(
    'bitbucket_delete_repository',
    `Delete a repository. This action is IRREVERSIBLE.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
    },
    async ({ workspace, repo_slug }) => {
      try {
        await client.deleteRepository(workspace, repo_slug);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Repository ${workspace}/${repo_slug} deleted` },
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
  // List Forks
  // ===========================================================================
  server.tool(
    'bitbucket_list_forks',
    `List forks of a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of forked repositories.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, format }) => {
      try {
        const result = await client.listForks(workspace, repo_slug, { pagelen, page });
        return formatResponse(result, format, 'repositories');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Fork Repository
  // ===========================================================================
  server.tool(
    'bitbucket_fork_repository',
    `Fork a repository to a target workspace.

Args:
  - workspace: The source workspace slug or UUID
  - repo_slug: The source repository slug
  - target_workspace: The workspace to fork into
  - name: Optional name for the forked repository

Returns:
  The forked repository.`,
    {
      workspace: z.string().describe('Source workspace slug or UUID'),
      repo_slug: z.string().describe('Source repository slug'),
      target_workspace: z.string().describe('Target workspace slug'),
      name: z.string().optional().describe('Name for the fork'),
    },
    async ({ workspace, repo_slug, target_workspace, name }) => {
      try {
        const result = await client.forkRepository(workspace, repo_slug, target_workspace, name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Repository forked', repository: result },
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
