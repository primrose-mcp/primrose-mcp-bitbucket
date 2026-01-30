/**
 * Branch Restriction and Deploy Key Tools
 *
 * MCP tools for Bitbucket branch restrictions and deploy keys.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all branch restriction and deploy key tools
 */
export function registerRestrictionTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Branch Restrictions
  // ===========================================================================
  server.tool(
    'bitbucket_list_branch_restrictions',
    `List branch restrictions for a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of branch restrictions with kind, pattern, and users/groups.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, format }) => {
      try {
        const result = await client.listBranchRestrictions(workspace, repo_slug, { pagelen, page });
        return formatResponse(result, format, 'restrictions');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Branch Restriction
  // ===========================================================================
  server.tool(
    'bitbucket_get_branch_restriction',
    `Get details for a specific branch restriction.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - restriction_id: The restriction ID
  - format: Response format ('json' or 'markdown')

Returns:
  Branch restriction details including kind, pattern, and users/groups.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      restriction_id: z.number().int().describe('Restriction ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, restriction_id, format }) => {
      try {
        const result = await client.getBranchRestriction(workspace, repo_slug, restriction_id);
        return formatResponse(result, format, 'restriction');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Branch Restriction
  // ===========================================================================
  server.tool(
    'bitbucket_create_branch_restriction',
    `Create a branch restriction for a repository.

Restriction kinds:
- push - Restrict pushes
- force - Restrict force pushes
- delete - Restrict branch deletion
- restrict_merges - Restrict merges
- require_tasks_to_be_completed - Require all tasks completed before merge
- require_passing_builds_to_merge - Require passing builds before merge
- require_approvals_to_merge - Require approvals before merge
- require_default_reviewer_approvals_to_merge - Require default reviewer approvals
- reset_pullrequest_approvals_on_change - Reset approvals on push
- require_no_changes_requested - Require no changes requested

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - kind: Restriction kind
  - branch_match_kind: How to match branches ('branching_model', 'glob', 'regex')
  - pattern: Branch pattern (for glob/regex)
  - branch_type: Branch type (for branching_model: 'feature', 'bugfix', 'release', 'hotfix', 'development', 'production')
  - value: Value for numeric restrictions (e.g., minimum approvals)
  - users: Array of user UUIDs that can bypass the restriction
  - groups: Array of group slugs that can bypass the restriction

Returns:
  The created branch restriction.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      kind: z.string().describe('Restriction kind'),
      branch_match_kind: z
        .enum(['branching_model', 'glob', 'regex'])
        .describe('How to match branches'),
      pattern: z.string().optional().describe('Branch pattern (for glob/regex)'),
      branch_type: z.string().optional().describe('Branch type (for branching_model)'),
      value: z.number().optional().describe('Value for numeric restrictions'),
      users: z.array(z.string()).optional().describe('User UUIDs that can bypass'),
      groups: z.array(z.string()).optional().describe('Group slugs that can bypass'),
    },
    async ({
      workspace,
      repo_slug,
      kind,
      branch_match_kind,
      pattern,
      branch_type,
      value,
      users,
      groups,
    }) => {
      try {
        const result = await client.createBranchRestriction(workspace, repo_slug, {
          kind,
          branch_match_kind,
          pattern,
          branch_type,
          value,
          ...(users && { users: users.map((uuid) => ({ uuid })) as any }),
          ...(groups && { groups: groups.map((slug) => ({ slug })) as any }),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Branch restriction created', restriction: result },
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
  // Update Branch Restriction
  // ===========================================================================
  server.tool(
    'bitbucket_update_branch_restriction',
    `Update an existing branch restriction.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - restriction_id: The restriction ID
  - pattern: New branch pattern
  - value: New value for numeric restrictions
  - users: New user UUIDs that can bypass
  - groups: New group slugs that can bypass

Returns:
  The updated branch restriction.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      restriction_id: z.number().int().describe('Restriction ID'),
      pattern: z.string().optional().describe('New branch pattern'),
      value: z.number().optional().describe('New value'),
      users: z.array(z.string()).optional().describe('New user UUIDs'),
      groups: z.array(z.string()).optional().describe('New group slugs'),
    },
    async ({ workspace, repo_slug, restriction_id, pattern, value, users, groups }) => {
      try {
        const result = await client.updateBranchRestriction(workspace, repo_slug, restriction_id, {
          pattern,
          value,
          ...(users && { users: users.map((uuid) => ({ uuid })) as any }),
          ...(groups && { groups: groups.map((slug) => ({ slug })) as any }),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Branch restriction updated', restriction: result },
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
  // Delete Branch Restriction
  // ===========================================================================
  server.tool(
    'bitbucket_delete_branch_restriction',
    `Delete a branch restriction.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - restriction_id: The restriction ID

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      restriction_id: z.number().int().describe('Restriction ID'),
    },
    async ({ workspace, repo_slug, restriction_id }) => {
      try {
        await client.deleteBranchRestriction(workspace, repo_slug, restriction_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Branch restriction deleted' },
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
  // List Deploy Keys
  // ===========================================================================
  server.tool(
    'bitbucket_list_deploy_keys',
    `List deploy keys for a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of deploy keys with id, label, and key information.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, format }) => {
      try {
        const result = await client.listDeployKeys(workspace, repo_slug, { pagelen, page });
        return formatResponse(result, format, 'deploy_keys');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Deploy Key
  // ===========================================================================
  server.tool(
    'bitbucket_get_deploy_key',
    `Get details for a specific deploy key.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - key_id: The deploy key ID
  - format: Response format ('json' or 'markdown')

Returns:
  Deploy key details including key, label, and timestamps.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      key_id: z.number().int().describe('Deploy key ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, key_id, format }) => {
      try {
        const result = await client.getDeployKey(workspace, repo_slug, key_id);
        return formatResponse(result, format, 'deploy_key');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Deploy Key
  // ===========================================================================
  server.tool(
    'bitbucket_create_deploy_key',
    `Create a deploy key for a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - key: SSH public key
  - label: Key label/description

Returns:
  The created deploy key.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      key: z.string().describe('SSH public key'),
      label: z.string().describe('Key label'),
    },
    async ({ workspace, repo_slug, key, label }) => {
      try {
        const result = await client.createDeployKey(workspace, repo_slug, key, label);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Deploy key created', deploy_key: result },
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
  // Delete Deploy Key
  // ===========================================================================
  server.tool(
    'bitbucket_delete_deploy_key',
    `Delete a deploy key.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - key_id: The deploy key ID

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      key_id: z.number().int().describe('Deploy key ID'),
    },
    async ({ workspace, repo_slug, key_id }) => {
      try {
        await client.deleteDeployKey(workspace, repo_slug, key_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Deploy key deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
