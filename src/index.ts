/**
 * Bitbucket MCP Server - Main Entry Point
 *
 * This file sets up the MCP server for Bitbucket Cloud API.
 * It supports multi-tenant deployments where credentials are passed via request headers.
 *
 * Required Headers (one authentication method):
 * - X-Bitbucket-Username + X-Bitbucket-App-Password: Basic Auth with App Password
 * - X-Bitbucket-Access-Token: OAuth2 Bearer Token
 *
 * Optional Headers:
 * - X-Bitbucket-Base-URL: Override the default Bitbucket API base URL
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createBitbucketClient } from './client.js';
import { registerCommitTools } from './tools/commits.js';
import { registerDeploymentTools } from './tools/deployments.js';
import { registerDownloadTools } from './tools/downloads.js';
import { registerIssueTools } from './tools/issues.js';
import { registerPipelineTools } from './tools/pipelines.js';
import { registerPullRequestTools } from './tools/pullrequests.js';
import { registerRefsTools } from './tools/refs.js';
import { registerRepositoryTools } from './tools/repositories.js';
import { registerRestrictionTools } from './tools/restrictions.js';
import { registerWebhookTools } from './tools/webhooks.js';
import { registerWorkspaceTools } from './tools/workspaces.js';
import {
  type Env,
  parseTenantCredentials,
  type TenantCredentials,
  validateCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-bitbucket';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 * For multi-tenant deployments, use the stateless mode instead.
 */
export class BitbucketMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with appropriate auth headers instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended for multi-tenant)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createBitbucketClient(credentials);

  // Register all tools
  registerWorkspaceTools(server, client);
  registerRepositoryTools(server, client);
  registerRefsTools(server, client);
  registerCommitTools(server, client);
  registerPullRequestTools(server, client);
  registerIssueTools(server, client);
  registerPipelineTools(server, client);
  registerDeploymentTools(server, client);
  registerWebhookTools(server, client);
  registerRestrictionTools(server, client);
  registerDownloadTools(server, client);

  // Test connection tool
  server.tool(
    'bitbucket_test_connection',
    'Test the connection to the Bitbucket API',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stateless MCP endpoint
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Validate credentials are present
      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: [
              'X-Bitbucket-Username + X-Bitbucket-App-Password',
              'or X-Bitbucket-Access-Token',
            ],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint for legacy clients
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Multi-tenant Bitbucket MCP Server',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass tenant credentials via request headers',
          methods: {
            basic_auth: {
              headers: {
                'X-Bitbucket-Username': 'Your Bitbucket username',
                'X-Bitbucket-App-Password': 'Your Bitbucket App Password',
              },
            },
            oauth2: {
              headers: {
                'X-Bitbucket-Access-Token': 'OAuth2 access token',
              },
            },
          },
          optional_headers: {
            'X-Bitbucket-Base-URL': 'Override the default Bitbucket API base URL',
          },
        },
        tools: {
          workspaces: [
            'bitbucket_list_workspaces',
            'bitbucket_get_workspace',
            'bitbucket_list_workspace_members',
          ],
          repositories: [
            'bitbucket_list_repositories',
            'bitbucket_get_repository',
            'bitbucket_create_repository',
            'bitbucket_update_repository',
            'bitbucket_delete_repository',
            'bitbucket_list_forks',
            'bitbucket_fork_repository',
          ],
          branches_tags: [
            'bitbucket_list_branches',
            'bitbucket_get_branch',
            'bitbucket_create_branch',
            'bitbucket_delete_branch',
            'bitbucket_list_tags',
            'bitbucket_get_tag',
            'bitbucket_create_tag',
            'bitbucket_delete_tag',
            'bitbucket_get_branching_model',
          ],
          commits: [
            'bitbucket_list_commits',
            'bitbucket_get_commit',
            'bitbucket_list_commit_statuses',
            'bitbucket_create_commit_status',
            'bitbucket_get_diff',
          ],
          pull_requests: [
            'bitbucket_list_pull_requests',
            'bitbucket_get_pull_request',
            'bitbucket_create_pull_request',
            'bitbucket_update_pull_request',
            'bitbucket_approve_pull_request',
            'bitbucket_unapprove_pull_request',
            'bitbucket_decline_pull_request',
            'bitbucket_merge_pull_request',
            'bitbucket_list_pull_request_comments',
            'bitbucket_create_pull_request_comment',
            'bitbucket_get_pull_request_diff',
          ],
          issues: [
            'bitbucket_list_issues',
            'bitbucket_get_issue',
            'bitbucket_create_issue',
            'bitbucket_update_issue',
            'bitbucket_delete_issue',
            'bitbucket_list_issue_comments',
            'bitbucket_create_issue_comment',
          ],
          pipelines: [
            'bitbucket_list_pipelines',
            'bitbucket_get_pipeline',
            'bitbucket_trigger_pipeline',
            'bitbucket_stop_pipeline',
            'bitbucket_list_pipeline_steps',
            'bitbucket_get_pipeline_step_log',
            'bitbucket_list_pipeline_variables',
            'bitbucket_create_pipeline_variable',
            'bitbucket_delete_pipeline_variable',
          ],
          deployments: [
            'bitbucket_list_deployments',
            'bitbucket_get_deployment',
            'bitbucket_list_environments',
            'bitbucket_get_environment',
          ],
          webhooks: [
            'bitbucket_list_webhooks',
            'bitbucket_get_webhook',
            'bitbucket_create_webhook',
            'bitbucket_update_webhook',
            'bitbucket_delete_webhook',
          ],
          branch_restrictions: [
            'bitbucket_list_branch_restrictions',
            'bitbucket_get_branch_restriction',
            'bitbucket_create_branch_restriction',
            'bitbucket_update_branch_restriction',
            'bitbucket_delete_branch_restriction',
          ],
          deploy_keys: [
            'bitbucket_list_deploy_keys',
            'bitbucket_get_deploy_key',
            'bitbucket_create_deploy_key',
            'bitbucket_delete_deploy_key',
          ],
          downloads_source: [
            'bitbucket_list_downloads',
            'bitbucket_delete_download',
            'bitbucket_get_file_content',
            'bitbucket_list_directory',
          ],
          connection: ['bitbucket_test_connection'],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
