/**
 * Workspace Tools
 *
 * MCP tools for Bitbucket workspace management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all workspace-related tools
 */
export function registerWorkspaceTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Workspaces
  // ===========================================================================
  server.tool(
    'bitbucket_list_workspaces',
    `List all workspaces accessible by the authenticated user.

Returns a paginated list of workspaces.

Args:
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of workspaces with slug, name, and UUID.`,
    {
      pagelen: z.number().int().min(1).max(100).default(20).describe('Items per page'),
      page: z.number().int().min(1).optional().describe('Page number'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ pagelen, page, format }) => {
      try {
        const result = await client.listWorkspaces({ pagelen, page });
        return formatResponse(result, format, 'workspaces');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Workspace
  // ===========================================================================
  server.tool(
    'bitbucket_get_workspace',
    `Get details for a specific workspace.

Args:
  - workspace: The workspace slug or UUID
  - format: Response format ('json' or 'markdown')

Returns:
  Workspace details including name, slug, UUID, and links.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, format }) => {
      try {
        const result = await client.getWorkspace(workspace);
        return formatResponse(result, format, 'workspace');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Workspace Members
  // ===========================================================================
  server.tool(
    'bitbucket_list_workspace_members',
    `List all members of a workspace.

Args:
  - workspace: The workspace slug or UUID
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of workspace members with their roles and permissions.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      pagelen: z.number().int().min(1).max(100).default(20).describe('Items per page'),
      page: z.number().int().min(1).optional().describe('Page number'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, pagelen, page, format }) => {
      try {
        const result = await client.listWorkspaceMembers(workspace, { pagelen, page });
        return formatResponse(result, format, 'members');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
