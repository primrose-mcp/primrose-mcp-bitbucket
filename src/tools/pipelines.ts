/**
 * Pipeline Tools
 *
 * MCP tools for Bitbucket Pipelines management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all pipeline-related tools
 */
export function registerPipelineTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Pipelines
  // ===========================================================================
  server.tool(
    'bitbucket_list_pipelines',
    `List pipelines in a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - sort: Sort field (e.g., '-created_on' for newest first)
  - format: Response format ('json' or 'markdown')

Returns:
  List of pipelines with build number, state, target, duration, and timestamps.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      sort: z.string().optional().describe('Sort field'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, sort, format }) => {
      try {
        const result = await client.listPipelines(workspace, repo_slug, { pagelen, page, sort });
        return formatResponse(result, format, 'pipelines');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Pipeline
  // ===========================================================================
  server.tool(
    'bitbucket_get_pipeline',
    `Get details for a specific pipeline.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pipeline_uuid: The pipeline UUID
  - format: Response format ('json' or 'markdown')

Returns:
  Pipeline details including state, target, trigger, duration, and timestamps.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pipeline_uuid: z.string().describe('Pipeline UUID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pipeline_uuid, format }) => {
      try {
        const result = await client.getPipeline(workspace, repo_slug, pipeline_uuid);
        return formatResponse(result, format, 'pipeline');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Trigger Pipeline
  // ===========================================================================
  server.tool(
    'bitbucket_trigger_pipeline',
    `Trigger a new pipeline run.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - target_type: Target type ('branch', 'tag', or 'commit')
  - target_name: Branch name, tag name, or commit hash
  - selector_type: Optional selector type ('custom', 'branches', 'tags', 'pull-requests')
  - selector_pattern: Optional selector pattern for custom pipelines

Returns:
  The triggered pipeline.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      target_type: z.enum(['branch', 'tag', 'commit']).describe('Target type'),
      target_name: z.string().describe('Branch name, tag name, or commit hash'),
      selector_type: z
        .enum(['custom', 'branches', 'tags', 'pull-requests', 'default'])
        .optional()
        .describe('Selector type'),
      selector_pattern: z.string().optional().describe('Selector pattern for custom pipelines'),
    },
    async ({ workspace, repo_slug, target_type, target_name, selector_type, selector_pattern }) => {
      try {
        const result = await client.triggerPipeline(workspace, repo_slug, {
          type: target_type,
          name: target_name,
          ...(selector_type && {
            selector: {
              type: selector_type,
              pattern: selector_pattern,
            },
          }),
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Pipeline triggered', pipeline: result },
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
  // Stop Pipeline
  // ===========================================================================
  server.tool(
    'bitbucket_stop_pipeline',
    `Stop a running pipeline.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pipeline_uuid: The pipeline UUID

Returns:
  Confirmation that the pipeline was stopped.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pipeline_uuid: z.string().describe('Pipeline UUID'),
    },
    async ({ workspace, repo_slug, pipeline_uuid }) => {
      try {
        await client.stopPipeline(workspace, repo_slug, pipeline_uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Pipeline stopped' }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Pipeline Steps
  // ===========================================================================
  server.tool(
    'bitbucket_list_pipeline_steps',
    `List steps for a pipeline.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pipeline_uuid: The pipeline UUID
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of pipeline steps with name, state, duration, and timestamps.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pipeline_uuid: z.string().describe('Pipeline UUID'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pipeline_uuid, pagelen, page, format }) => {
      try {
        const result = await client.listPipelineSteps(workspace, repo_slug, pipeline_uuid, {
          pagelen,
          page,
        });
        return formatResponse(result, format, 'steps');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Pipeline Step Log
  // ===========================================================================
  server.tool(
    'bitbucket_get_pipeline_step_log',
    `Get the log output for a pipeline step.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pipeline_uuid: The pipeline UUID
  - step_uuid: The step UUID

Returns:
  The log output as text.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pipeline_uuid: z.string().describe('Pipeline UUID'),
      step_uuid: z.string().describe('Step UUID'),
    },
    async ({ workspace, repo_slug, pipeline_uuid, step_uuid }) => {
      try {
        const result = await client.getPipelineStepLog(
          workspace,
          repo_slug,
          pipeline_uuid,
          step_uuid
        );
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

  // ===========================================================================
  // List Pipeline Variables
  // ===========================================================================
  server.tool(
    'bitbucket_list_pipeline_variables',
    `List pipeline variables for a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of pipeline variables with key, value (if not secured), and secured flag.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, format }) => {
      try {
        const result = await client.listPipelineVariables(workspace, repo_slug, { pagelen, page });
        return formatResponse(result, format, 'variables');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Pipeline Variable
  // ===========================================================================
  server.tool(
    'bitbucket_create_pipeline_variable',
    `Create a pipeline variable for a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - key: Variable key/name
  - value: Variable value
  - secured: Whether the variable is secured (hidden in logs)

Returns:
  The created pipeline variable.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      key: z.string().describe('Variable key/name'),
      value: z.string().describe('Variable value'),
      secured: z.boolean().default(false).describe('Whether the variable is secured'),
    },
    async ({ workspace, repo_slug, key, value, secured }) => {
      try {
        const result = await client.createPipelineVariable(
          workspace,
          repo_slug,
          key,
          value,
          secured
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Pipeline variable created', variable: result },
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
  // Delete Pipeline Variable
  // ===========================================================================
  server.tool(
    'bitbucket_delete_pipeline_variable',
    `Delete a pipeline variable.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - variable_uuid: The variable UUID

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      variable_uuid: z.string().describe('Variable UUID'),
    },
    async ({ workspace, repo_slug, variable_uuid }) => {
      try {
        await client.deletePipelineVariable(workspace, repo_slug, variable_uuid);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: 'Pipeline variable deleted' },
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
