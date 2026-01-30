# Bitbucket MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Bitbucket. Manage repositories, pull requests, pipelines, issues, and deployments across your Bitbucket workspaces.

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-6366f1)](https://primrose.dev/mcp/bitbucket)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[View on Primrose](https://primrose.dev/mcp/bitbucket)** | **[Documentation](https://primrose.dev/docs)**

---

## Features

- **Commits** - Browse and manage commit history
- **Deployments** - Track deployment status and environments
- **Downloads** - Manage repository downloads
- **Issues** - Create and track issues
- **Pipelines** - Trigger and monitor CI/CD pipelines
- **Pull Requests** - Create, review, and merge pull requests
- **Refs** - Manage branches and tags
- **Repositories** - Create and configure repositories
- **Restrictions** - Configure branch restrictions
- **Webhooks** - Set up repository webhooks
- **Workspaces** - Manage workspace settings and members

## Quick Start

### Using Primrose SDK (Recommended)

The fastest way to get started is with the [Primrose SDK](https://github.com/primrose-mcp/primrose-sdk), which handles authentication and provides tool definitions formatted for your LLM provider.

```bash
npm install primrose-mcp
```

```typescript
import { Primrose } from 'primrose-mcp';

const primrose = new Primrose({
  apiKey: 'prm_xxxxx',
  provider: 'anthropic', // or 'openai', 'google', 'amazon', etc.
});

// List available Bitbucket tools
const tools = await primrose.listTools({ mcpServer: 'bitbucket' });

// Call a tool
const result = await primrose.callTool('bitbucket_list_repositories', {
  workspace: 'my-workspace',
  pagelen: 20
});
```

[Get your Primrose API key](https://primrose.dev) to start building.

### Manual Installation

If you prefer to self-host, you can deploy this MCP server directly to Cloudflare Workers.

```bash
git clone https://github.com/primrose-mcp/primrose-mcp-bitbucket.git
cd primrose-mcp-bitbucket
bun install
bun run deploy
```

## Configuration

This server uses a multi-tenant architecture where credentials are passed via request headers.

### Authentication Option 1: App Password

| Header | Description |
|--------|-------------|
| `X-Bitbucket-Username` | Bitbucket username |
| `X-Bitbucket-App-Password` | Bitbucket App Password |

### Authentication Option 2: OAuth2

| Header | Description |
|--------|-------------|
| `X-Bitbucket-Access-Token` | OAuth2 Access Token |

### Getting Credentials

**App Password:**
1. Log in to [Bitbucket](https://bitbucket.org/)
2. Go to Personal Settings > App passwords
3. Create an App Password with appropriate permissions

**OAuth2:**
1. Create an OAuth consumer in your workspace settings
2. Implement OAuth 2.0 flow to obtain access tokens

## Available Tools

### Repositories
- `bitbucket_list_repositories` - List repositories in a workspace
- `bitbucket_get_repository` - Get repository details
- `bitbucket_create_repository` - Create a new repository
- `bitbucket_delete_repository` - Delete a repository

### Pull Requests
- `bitbucket_list_pullrequests` - List pull requests
- `bitbucket_get_pullrequest` - Get PR details
- `bitbucket_create_pullrequest` - Create a pull request
- `bitbucket_merge_pullrequest` - Merge a pull request
- `bitbucket_decline_pullrequest` - Decline a pull request

### Pipelines
- `bitbucket_list_pipelines` - List pipeline runs
- `bitbucket_get_pipeline` - Get pipeline details
- `bitbucket_trigger_pipeline` - Trigger a pipeline
- `bitbucket_stop_pipeline` - Stop a running pipeline

### Commits
- `bitbucket_list_commits` - List commits
- `bitbucket_get_commit` - Get commit details

### Issues
- `bitbucket_list_issues` - List issues
- `bitbucket_get_issue` - Get issue details
- `bitbucket_create_issue` - Create an issue
- `bitbucket_update_issue` - Update an issue

### Refs (Branches & Tags)
- `bitbucket_list_branches` - List branches
- `bitbucket_create_branch` - Create a branch
- `bitbucket_list_tags` - List tags

### Workspaces
- `bitbucket_list_workspaces` - List workspaces
- `bitbucket_get_workspace` - Get workspace details

## Development

```bash
bun run dev
bun run typecheck
bun run lint
bun run inspector
```

## Related Resources

- [Primrose SDK](https://github.com/primrose-mcp/primrose-sdk)
- [Bitbucket API Documentation](https://developer.atlassian.com/cloud/bitbucket/rest/)
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT License - see [LICENSE](LICENSE) for details.
