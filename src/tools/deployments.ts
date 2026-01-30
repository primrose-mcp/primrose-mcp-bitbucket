/**
 * Deployment Tools
 *
 * MCP tools for Bitbucket deployment management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all deployment-related tools
 */
export function registerDeploymentTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Deployments
  // ===========================================================================
  server.tool(
    'bitbucket_list_deployments',
    `List deployments in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of deployments with state, environment, and release information.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, format }) => {
      try {
        const result = await client.listDeployments(workspace, repo_slug, { pagelen, page });
        return formatResponse(result, format, 'deployments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Deployment
  // ===========================================================================
  server.tool(
    'bitbucket_get_deployment',
    `Get details for a specific deployment.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - deployment_uuid: The deployment UUID
  - format: Response format ('json' or 'markdown')

Returns:
  Deployment details including state, environment, release, and pipeline information.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      deployment_uuid: z.string().describe('Deployment UUID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, deployment_uuid, format }) => {
      try {
        const result = await client.getDeployment(workspace, repo_slug, deployment_uuid);
        return formatResponse(result, format, 'deployment');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Environments
  // ===========================================================================
  server.tool(
    'bitbucket_list_environments',
    `List deployment environments in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of deployment environments with name, type, and configuration.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, format }) => {
      try {
        const result = await client.listEnvironments(workspace, repo_slug, { pagelen, page });
        return formatResponse(result, format, 'environments');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Environment
  // ===========================================================================
  server.tool(
    'bitbucket_get_environment',
    `Get details for a specific deployment environment.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - environment_uuid: The environment UUID
  - format: Response format ('json' or 'markdown')

Returns:
  Environment details including name, type, restrictions, and lock status.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      environment_uuid: z.string().describe('Environment UUID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, environment_uuid, format }) => {
      try {
        const result = await client.getEnvironment(workspace, repo_slug, environment_uuid);
        return formatResponse(result, format, 'environment');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
