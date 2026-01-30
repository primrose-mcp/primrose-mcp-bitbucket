/**
 * Webhook Tools
 *
 * MCP tools for Bitbucket webhook management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all webhook-related tools
 */
export function registerWebhookTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Webhooks
  // ===========================================================================
  server.tool(
    'bitbucket_list_webhooks',
    `List webhooks for a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of webhooks with UUID, URL, active status, and events.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, format }) => {
      try {
        const result = await client.listWebhooks(workspace, repo_slug, { pagelen, page });
        return formatResponse(result, format, 'webhooks');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Webhook
  // ===========================================================================
  server.tool(
    'bitbucket_get_webhook',
    `Get details for a specific webhook.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - webhook_uuid: The webhook UUID
  - format: Response format ('json' or 'markdown')

Returns:
  Webhook details including URL, description, active status, and events.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      webhook_uuid: z.string().describe('Webhook UUID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, webhook_uuid, format }) => {
      try {
        const result = await client.getWebhook(workspace, repo_slug, webhook_uuid);
        return formatResponse(result, format, 'webhook');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Webhook
  // ===========================================================================
  server.tool(
    'bitbucket_create_webhook',
    `Create a webhook for a repository.

Common events:
- repo:push - Repository push
- repo:fork - Repository forked
- repo:commit_status_created - Commit status created
- repo:commit_status_updated - Commit status updated
- pullrequest:created - Pull request created
- pullrequest:updated - Pull request updated
- pullrequest:approved - Pull request approved
- pullrequest:unapproved - Pull request unapproved
- pullrequest:fulfilled - Pull request merged
- pullrequest:rejected - Pull request declined
- pullrequest:comment_created - Comment on pull request
- issue:created - Issue created
- issue:updated - Issue updated
- issue:comment_created - Comment on issue

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - url: Webhook URL
  - description: Webhook description
  - events: Array of events to trigger the webhook
  - active: Whether the webhook is active (default: true)

Returns:
  The created webhook.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      url: z.string().url().describe('Webhook URL'),
      description: z.string().optional().describe('Webhook description'),
      events: z.array(z.string()).min(1).describe('Events to trigger the webhook'),
      active: z.boolean().default(true).describe('Whether the webhook is active'),
    },
    async ({ workspace, repo_slug, url, description, events, active }) => {
      try {
        const result = await client.createWebhook(workspace, repo_slug, {
          url,
          description,
          events,
          active,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Webhook created', webhook: result },
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
  // Update Webhook
  // ===========================================================================
  server.tool(
    'bitbucket_update_webhook',
    `Update an existing webhook.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - webhook_uuid: The webhook UUID
  - url: New webhook URL
  - description: New description
  - events: New list of events
  - active: New active status

Returns:
  The updated webhook.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      webhook_uuid: z.string().describe('Webhook UUID'),
      url: z.string().url().optional().describe('New webhook URL'),
      description: z.string().optional().describe('New description'),
      events: z.array(z.string()).optional().describe('New events'),
      active: z.boolean().optional().describe('New active status'),
    },
    async ({ workspace, repo_slug, webhook_uuid, url, description, events, active }) => {
      try {
        const result = await client.updateWebhook(workspace, repo_slug, webhook_uuid, {
          url,
          description,
          events,
          active,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Webhook updated', webhook: result },
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
  // Delete Webhook
  // ===========================================================================
  server.tool(
    'bitbucket_delete_webhook',
    `Delete a webhook.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - webhook_uuid: The webhook UUID

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      webhook_uuid: z.string().describe('Webhook UUID'),
    },
    async ({ workspace, repo_slug, webhook_uuid }) => {
      try {
        await client.deleteWebhook(workspace, repo_slug, webhook_uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Webhook deleted' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
