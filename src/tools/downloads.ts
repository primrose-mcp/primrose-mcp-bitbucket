/**
 * Download and Source Tools
 *
 * MCP tools for Bitbucket downloads and source file browsing.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BitbucketClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all download and source tools
 */
export function registerDownloadTools(server: McpServer, client: BitbucketClient): void {
  // ===========================================================================
  // List Downloads
  // ===========================================================================
  server.tool(
    'bitbucket_list_downloads',
    `List downloadable files/artifacts for a repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of downloads with name, size, and download count.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, pagelen, page, format }) => {
      try {
        const result = await client.listDownloads(workspace, repo_slug, { pagelen, page });
        return formatResponse(result, format, 'downloads');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Download
  // ===========================================================================
  server.tool(
    'bitbucket_delete_download',
    `Delete a downloadable file/artifact.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - filename: The filename to delete

Returns:
  Confirmation of deletion.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      filename: z.string().describe('Filename to delete'),
    },
    async ({ workspace, repo_slug, filename }) => {
      try {
        await client.deleteDownload(workspace, repo_slug, filename);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Download '${filename}' deleted` },
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
  // Get File Content
  // ===========================================================================
  server.tool(
    'bitbucket_get_file_content',
    `Get the content of a file from the repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - path: Path to the file (e.g., 'src/index.ts')
  - ref: Branch, tag, or commit hash (optional, defaults to main branch)

Returns:
  The file content as text.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      path: z.string().describe('File path'),
      ref: z.string().optional().describe('Branch, tag, or commit hash'),
    },
    async ({ workspace, repo_slug, path, ref }) => {
      try {
        const result = await client.getFileContent(workspace, repo_slug, path, ref);
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
  // List Directory Contents
  // ===========================================================================
  server.tool(
    'bitbucket_list_directory',
    `List the contents of a directory in the repository.

Args:
  - workspace: The workspace slug or UUID
  - repo_slug: The repository slug
  - path: Directory path (e.g., 'src' or '' for root)
  - ref: Branch, tag, or commit hash (optional, defaults to main branch)
  - pagelen: Number of items per page (1-100, default: 20)
  - page: Page number (1-based)
  - format: Response format ('json' or 'markdown')

Returns:
  List of files and directories with path, type, and size.`,
    {
      workspace: z.string().describe('Workspace slug or UUID'),
      repo_slug: z.string().describe('Repository slug'),
      path: z.string().default('').describe('Directory path'),
      ref: z.string().optional().describe('Branch, tag, or commit hash'),
      pagelen: z.number().int().min(1).max(100).default(20),
      page: z.number().int().min(1).optional(),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ workspace, repo_slug, path, ref, pagelen, page, format }) => {
      try {
        const result = await client.listDirectoryContents(workspace, repo_slug, path, ref, {
          pagelen,
          page,
        });
        return formatResponse(result, format, 'files');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
