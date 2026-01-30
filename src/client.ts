/**
 * Bitbucket API Client
 *
 * Handles all HTTP communication with the Bitbucket Cloud REST API 2.0.
 * Supports both App Password (Basic Auth) and OAuth2 authentication.
 */

import type {
  BitbucketPaginatedResponse,
  Branch,
  BranchingModel,
  BranchRestriction,
  Comment,
  Commit,
  CommitStatus,
  DeployKey,
  Deployment,
  DeploymentEnvironment,
  Download,
  Issue,
  IssueCreateInput,
  IssueUpdateInput,
  PaginatedResponse,
  PaginationParams,
  Pipeline,
  PipelineStep,
  PipelineVariable,
  PullRequest,
  PullRequestCreateInput,
  PullRequestUpdateInput,
  Repository,
  RepositoryCreateInput,
  Tag,
  Webhook,
  WebhookCreateInput,
  Workspace,
  WorkspaceMembership,
} from './types/entities.js';
import type { TenantCredentials } from './types/env.js';
import { AuthenticationError, BitbucketApiError, RateLimitError } from './utils/errors.js';
import { buildPaginationQuery, convertPaginatedResponse } from './utils/pagination.js';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = 'https://api.bitbucket.org/2.0';

// =============================================================================
// Client Interface
// =============================================================================

export interface BitbucketClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string }>;

  // Workspaces
  listWorkspaces(params?: PaginationParams): Promise<PaginatedResponse<Workspace>>;
  getWorkspace(workspace: string): Promise<Workspace>;
  listWorkspaceMembers(
    workspace: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<WorkspaceMembership>>;

  // Repositories
  listRepositories(
    workspace: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Repository>>;
  getRepository(workspace: string, repoSlug: string): Promise<Repository>;
  createRepository(
    workspace: string,
    repoSlug: string,
    input: RepositoryCreateInput
  ): Promise<Repository>;
  updateRepository(
    workspace: string,
    repoSlug: string,
    input: Partial<RepositoryCreateInput>
  ): Promise<Repository>;
  deleteRepository(workspace: string, repoSlug: string): Promise<void>;
  listForks(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Repository>>;
  forkRepository(
    workspace: string,
    repoSlug: string,
    targetWorkspace: string,
    name?: string
  ): Promise<Repository>;

  // Branches
  listBranches(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Branch>>;
  getBranch(workspace: string, repoSlug: string, branchName: string): Promise<Branch>;
  createBranch(workspace: string, repoSlug: string, name: string, target: string): Promise<Branch>;
  deleteBranch(workspace: string, repoSlug: string, branchName: string): Promise<void>;

  // Tags
  listTags(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Tag>>;
  getTag(workspace: string, repoSlug: string, tagName: string): Promise<Tag>;
  createTag(
    workspace: string,
    repoSlug: string,
    name: string,
    target: string,
    message?: string
  ): Promise<Tag>;
  deleteTag(workspace: string, repoSlug: string, tagName: string): Promise<void>;

  // Commits
  listCommits(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams & { revision?: string; include?: string; exclude?: string }
  ): Promise<PaginatedResponse<Commit>>;
  getCommit(workspace: string, repoSlug: string, commitHash: string): Promise<Commit>;
  listCommitStatuses(
    workspace: string,
    repoSlug: string,
    commitHash: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<CommitStatus>>;
  createCommitStatus(
    workspace: string,
    repoSlug: string,
    commitHash: string,
    status: Partial<CommitStatus>
  ): Promise<CommitStatus>;

  // Pull Requests
  listPullRequests(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams & { state?: string }
  ): Promise<PaginatedResponse<PullRequest>>;
  getPullRequest(workspace: string, repoSlug: string, prId: number): Promise<PullRequest>;
  createPullRequest(
    workspace: string,
    repoSlug: string,
    input: PullRequestCreateInput
  ): Promise<PullRequest>;
  updatePullRequest(
    workspace: string,
    repoSlug: string,
    prId: number,
    input: PullRequestUpdateInput
  ): Promise<PullRequest>;
  approvePullRequest(workspace: string, repoSlug: string, prId: number): Promise<void>;
  unapprovePullRequest(workspace: string, repoSlug: string, prId: number): Promise<void>;
  declinePullRequest(workspace: string, repoSlug: string, prId: number): Promise<PullRequest>;
  mergePullRequest(
    workspace: string,
    repoSlug: string,
    prId: number,
    options?: { message?: string; close_source_branch?: boolean; merge_strategy?: string }
  ): Promise<PullRequest>;
  listPullRequestComments(
    workspace: string,
    repoSlug: string,
    prId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Comment>>;
  createPullRequestComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    content: string
  ): Promise<Comment>;
  getPullRequestDiff(workspace: string, repoSlug: string, prId: number): Promise<string>;

  // Issues
  listIssues(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Issue>>;
  getIssue(workspace: string, repoSlug: string, issueId: number): Promise<Issue>;
  createIssue(workspace: string, repoSlug: string, input: IssueCreateInput): Promise<Issue>;
  updateIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    input: IssueUpdateInput
  ): Promise<Issue>;
  deleteIssue(workspace: string, repoSlug: string, issueId: number): Promise<void>;
  listIssueComments(
    workspace: string,
    repoSlug: string,
    issueId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Comment>>;
  createIssueComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    content: string
  ): Promise<Comment>;

  // Pipelines
  listPipelines(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Pipeline>>;
  getPipeline(workspace: string, repoSlug: string, pipelineUuid: string): Promise<Pipeline>;
  triggerPipeline(
    workspace: string,
    repoSlug: string,
    target: {
      type: 'branch' | 'tag' | 'commit';
      name: string;
      selector?: { type: string; pattern?: string };
    }
  ): Promise<Pipeline>;
  stopPipeline(workspace: string, repoSlug: string, pipelineUuid: string): Promise<void>;
  listPipelineSteps(
    workspace: string,
    repoSlug: string,
    pipelineUuid: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<PipelineStep>>;
  getPipelineStepLog(
    workspace: string,
    repoSlug: string,
    pipelineUuid: string,
    stepUuid: string
  ): Promise<string>;
  listPipelineVariables(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<PipelineVariable>>;
  createPipelineVariable(
    workspace: string,
    repoSlug: string,
    key: string,
    value: string,
    secured?: boolean
  ): Promise<PipelineVariable>;
  deletePipelineVariable(workspace: string, repoSlug: string, variableUuid: string): Promise<void>;

  // Deployments
  listDeployments(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Deployment>>;
  getDeployment(workspace: string, repoSlug: string, deploymentUuid: string): Promise<Deployment>;
  listEnvironments(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<DeploymentEnvironment>>;
  getEnvironment(
    workspace: string,
    repoSlug: string,
    environmentUuid: string
  ): Promise<DeploymentEnvironment>;

  // Webhooks
  listWebhooks(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Webhook>>;
  getWebhook(workspace: string, repoSlug: string, webhookUuid: string): Promise<Webhook>;
  createWebhook(workspace: string, repoSlug: string, input: WebhookCreateInput): Promise<Webhook>;
  updateWebhook(
    workspace: string,
    repoSlug: string,
    webhookUuid: string,
    input: Partial<WebhookCreateInput>
  ): Promise<Webhook>;
  deleteWebhook(workspace: string, repoSlug: string, webhookUuid: string): Promise<void>;

  // Branch Restrictions
  listBranchRestrictions(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<BranchRestriction>>;
  getBranchRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number
  ): Promise<BranchRestriction>;
  createBranchRestriction(
    workspace: string,
    repoSlug: string,
    input: Partial<BranchRestriction>
  ): Promise<BranchRestriction>;
  updateBranchRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number,
    input: Partial<BranchRestriction>
  ): Promise<BranchRestriction>;
  deleteBranchRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number
  ): Promise<void>;

  // Branching Model
  getBranchingModel(workspace: string, repoSlug: string): Promise<BranchingModel>;

  // Deploy Keys
  listDeployKeys(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<DeployKey>>;
  getDeployKey(workspace: string, repoSlug: string, keyId: number): Promise<DeployKey>;
  createDeployKey(
    workspace: string,
    repoSlug: string,
    key: string,
    label: string
  ): Promise<DeployKey>;
  deleteDeployKey(workspace: string, repoSlug: string, keyId: number): Promise<void>;

  // Downloads
  listDownloads(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Download>>;
  deleteDownload(workspace: string, repoSlug: string, filename: string): Promise<void>;

  // Source (File browsing)
  getFileContent(workspace: string, repoSlug: string, path: string, ref?: string): Promise<string>;
  listDirectoryContents(
    workspace: string,
    repoSlug: string,
    path: string,
    ref?: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<{ path: string; type: string; size?: number }>>;

  // Diff
  getDiff(workspace: string, repoSlug: string, spec: string): Promise<string>;
}

// =============================================================================
// Client Implementation
// =============================================================================

class BitbucketClientImpl implements BitbucketClient {
  private credentials: TenantCredentials;
  private baseUrl: string;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.baseUrl || API_BASE_URL;
  }

  // ===========================================================================
  // HTTP Request Helper
  // ===========================================================================

  private getAuthHeaders(): Record<string, string> {
    // OAuth Access Token
    if (this.credentials.accessToken) {
      return {
        Authorization: `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/json',
      };
    }

    // Basic Auth with App Password
    if (this.credentials.username && this.credentials.appPassword) {
      const credentials = btoa(`${this.credentials.username}:${this.credentials.appPassword}`);
      return {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      };
    }

    throw new AuthenticationError(
      'No credentials provided. Include X-Bitbucket-Username + X-Bitbucket-App-Password headers, ' +
        'or X-Bitbucket-Access-Token header.'
    );
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        'Rate limit exceeded',
        retryAfter ? Number.parseInt(retryAfter, 10) : 60
      );
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError('Authentication failed. Check your Bitbucket credentials.');
    }

    // Handle other errors
    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        message = errorJson.error?.message || errorJson.message || errorJson.error || message;
      } catch {
        // Use default message
      }
      throw new BitbucketApiError(message, response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Check content type for text responses
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/plain') || contentType.includes('text/x-diff')) {
      return (await response.text()) as T;
    }

    return response.json() as Promise<T>;
  }

  private async requestRaw(endpoint: string, options: RequestInit = {}): Promise<string> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        Accept: 'text/plain',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new BitbucketApiError(`API error: ${response.status}`, response.status);
    }

    return response.text();
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.request('/user');
      return { connected: true, message: 'Successfully connected to Bitbucket' };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ===========================================================================
  // Workspaces
  // ===========================================================================

  async listWorkspaces(params?: PaginationParams): Promise<PaginatedResponse<Workspace>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Workspace>>(
      `/workspaces${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getWorkspace(workspace: string): Promise<Workspace> {
    return this.request<Workspace>(`/workspaces/${workspace}`);
  }

  async listWorkspaceMembers(
    workspace: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<WorkspaceMembership>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<WorkspaceMembership>>(
      `/workspaces/${workspace}/members${query}`
    );
    return convertPaginatedResponse(response);
  }

  // ===========================================================================
  // Repositories
  // ===========================================================================

  async listRepositories(
    workspace: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Repository>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Repository>>(
      `/repositories/${workspace}${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getRepository(workspace: string, repoSlug: string): Promise<Repository> {
    return this.request<Repository>(`/repositories/${workspace}/${repoSlug}`);
  }

  async createRepository(
    workspace: string,
    repoSlug: string,
    input: RepositoryCreateInput
  ): Promise<Repository> {
    return this.request<Repository>(`/repositories/${workspace}/${repoSlug}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateRepository(
    workspace: string,
    repoSlug: string,
    input: Partial<RepositoryCreateInput>
  ): Promise<Repository> {
    return this.request<Repository>(`/repositories/${workspace}/${repoSlug}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteRepository(workspace: string, repoSlug: string): Promise<void> {
    await this.request<void>(`/repositories/${workspace}/${repoSlug}`, {
      method: 'DELETE',
    });
  }

  async listForks(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Repository>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Repository>>(
      `/repositories/${workspace}/${repoSlug}/forks${query}`
    );
    return convertPaginatedResponse(response);
  }

  async forkRepository(
    workspace: string,
    repoSlug: string,
    targetWorkspace: string,
    name?: string
  ): Promise<Repository> {
    return this.request<Repository>(`/repositories/${workspace}/${repoSlug}/forks`, {
      method: 'POST',
      body: JSON.stringify({
        workspace: { slug: targetWorkspace },
        ...(name && { name }),
      }),
    });
  }

  // ===========================================================================
  // Branches
  // ===========================================================================

  async listBranches(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Branch>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Branch>>(
      `/repositories/${workspace}/${repoSlug}/refs/branches${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getBranch(workspace: string, repoSlug: string, branchName: string): Promise<Branch> {
    return this.request<Branch>(
      `/repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branchName)}`
    );
  }

  async createBranch(
    workspace: string,
    repoSlug: string,
    name: string,
    target: string
  ): Promise<Branch> {
    return this.request<Branch>(`/repositories/${workspace}/${repoSlug}/refs/branches`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        target: { hash: target },
      }),
    });
  }

  async deleteBranch(workspace: string, repoSlug: string, branchName: string): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/refs/branches/${encodeURIComponent(branchName)}`,
      { method: 'DELETE' }
    );
  }

  // ===========================================================================
  // Tags
  // ===========================================================================

  async listTags(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Tag>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Tag>>(
      `/repositories/${workspace}/${repoSlug}/refs/tags${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getTag(workspace: string, repoSlug: string, tagName: string): Promise<Tag> {
    return this.request<Tag>(
      `/repositories/${workspace}/${repoSlug}/refs/tags/${encodeURIComponent(tagName)}`
    );
  }

  async createTag(
    workspace: string,
    repoSlug: string,
    name: string,
    target: string,
    message?: string
  ): Promise<Tag> {
    return this.request<Tag>(`/repositories/${workspace}/${repoSlug}/refs/tags`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        target: { hash: target },
        ...(message && { message }),
      }),
    });
  }

  async deleteTag(workspace: string, repoSlug: string, tagName: string): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/refs/tags/${encodeURIComponent(tagName)}`,
      { method: 'DELETE' }
    );
  }

  // ===========================================================================
  // Commits
  // ===========================================================================

  async listCommits(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams & { revision?: string; include?: string; exclude?: string }
  ): Promise<PaginatedResponse<Commit>> {
    let query = buildPaginationQuery(params);
    if (params?.revision) {
      query += (query ? '&' : '?') + `revision=${encodeURIComponent(params.revision)}`;
    }
    if (params?.include) {
      query += (query ? '&' : '?') + `include=${encodeURIComponent(params.include)}`;
    }
    if (params?.exclude) {
      query += (query ? '&' : '?') + `exclude=${encodeURIComponent(params.exclude)}`;
    }
    const response = await this.request<BitbucketPaginatedResponse<Commit>>(
      `/repositories/${workspace}/${repoSlug}/commits${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getCommit(workspace: string, repoSlug: string, commitHash: string): Promise<Commit> {
    return this.request<Commit>(`/repositories/${workspace}/${repoSlug}/commit/${commitHash}`);
  }

  async listCommitStatuses(
    workspace: string,
    repoSlug: string,
    commitHash: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<CommitStatus>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<CommitStatus>>(
      `/repositories/${workspace}/${repoSlug}/commit/${commitHash}/statuses${query}`
    );
    return convertPaginatedResponse(response);
  }

  async createCommitStatus(
    workspace: string,
    repoSlug: string,
    commitHash: string,
    status: Partial<CommitStatus>
  ): Promise<CommitStatus> {
    return this.request<CommitStatus>(
      `/repositories/${workspace}/${repoSlug}/commit/${commitHash}/statuses/build`,
      {
        method: 'POST',
        body: JSON.stringify(status),
      }
    );
  }

  // ===========================================================================
  // Pull Requests
  // ===========================================================================

  async listPullRequests(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams & { state?: string }
  ): Promise<PaginatedResponse<PullRequest>> {
    let query = buildPaginationQuery(params);
    if (params?.state) {
      query += (query ? '&' : '?') + `state=${params.state}`;
    }
    const response = await this.request<BitbucketPaginatedResponse<PullRequest>>(
      `/repositories/${workspace}/${repoSlug}/pullrequests${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getPullRequest(workspace: string, repoSlug: string, prId: number): Promise<PullRequest> {
    return this.request<PullRequest>(`/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`);
  }

  async createPullRequest(
    workspace: string,
    repoSlug: string,
    input: PullRequestCreateInput
  ): Promise<PullRequest> {
    return this.request<PullRequest>(`/repositories/${workspace}/${repoSlug}/pullrequests`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updatePullRequest(
    workspace: string,
    repoSlug: string,
    prId: number,
    input: PullRequestUpdateInput
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
  }

  async approvePullRequest(workspace: string, repoSlug: string, prId: number): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/approve`,
      { method: 'POST' }
    );
  }

  async unapprovePullRequest(workspace: string, repoSlug: string, prId: number): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/approve`,
      { method: 'DELETE' }
    );
  }

  async declinePullRequest(
    workspace: string,
    repoSlug: string,
    prId: number
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/decline`,
      { method: 'POST' }
    );
  }

  async mergePullRequest(
    workspace: string,
    repoSlug: string,
    prId: number,
    options?: { message?: string; close_source_branch?: boolean; merge_strategy?: string }
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/merge`,
      {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }
    );
  }

  async listPullRequestComments(
    workspace: string,
    repoSlug: string,
    prId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Comment>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Comment>>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments${query}`
    );
    return convertPaginatedResponse(response);
  }

  async createPullRequestComment(
    workspace: string,
    repoSlug: string,
    prId: number,
    content: string
  ): Promise<Comment> {
    return this.request<Comment>(
      `/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ content: { raw: content } }),
      }
    );
  }

  async getPullRequestDiff(workspace: string, repoSlug: string, prId: number): Promise<string> {
    return this.requestRaw(`/repositories/${workspace}/${repoSlug}/pullrequests/${prId}/diff`);
  }

  // ===========================================================================
  // Issues
  // ===========================================================================

  async listIssues(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Issue>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Issue>>(
      `/repositories/${workspace}/${repoSlug}/issues${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getIssue(workspace: string, repoSlug: string, issueId: number): Promise<Issue> {
    return this.request<Issue>(`/repositories/${workspace}/${repoSlug}/issues/${issueId}`);
  }

  async createIssue(workspace: string, repoSlug: string, input: IssueCreateInput): Promise<Issue> {
    return this.request<Issue>(`/repositories/${workspace}/${repoSlug}/issues`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateIssue(
    workspace: string,
    repoSlug: string,
    issueId: number,
    input: IssueUpdateInput
  ): Promise<Issue> {
    return this.request<Issue>(`/repositories/${workspace}/${repoSlug}/issues/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteIssue(workspace: string, repoSlug: string, issueId: number): Promise<void> {
    await this.request<void>(`/repositories/${workspace}/${repoSlug}/issues/${issueId}`, {
      method: 'DELETE',
    });
  }

  async listIssueComments(
    workspace: string,
    repoSlug: string,
    issueId: number,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Comment>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Comment>>(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}/comments${query}`
    );
    return convertPaginatedResponse(response);
  }

  async createIssueComment(
    workspace: string,
    repoSlug: string,
    issueId: number,
    content: string
  ): Promise<Comment> {
    return this.request<Comment>(
      `/repositories/${workspace}/${repoSlug}/issues/${issueId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ content: { raw: content } }),
      }
    );
  }

  // ===========================================================================
  // Pipelines
  // ===========================================================================

  async listPipelines(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Pipeline>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Pipeline>>(
      `/repositories/${workspace}/${repoSlug}/pipelines${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getPipeline(workspace: string, repoSlug: string, pipelineUuid: string): Promise<Pipeline> {
    return this.request<Pipeline>(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}`
    );
  }

  async triggerPipeline(
    workspace: string,
    repoSlug: string,
    target: {
      type: 'branch' | 'tag' | 'commit';
      name: string;
      selector?: { type: string; pattern?: string };
    }
  ): Promise<Pipeline> {
    const body: Record<string, unknown> = {
      target: {
        type: 'pipeline_ref_target',
        ref_type: target.type === 'commit' ? 'branch' : target.type,
        ref_name: target.name,
        ...(target.selector && { selector: target.selector }),
      },
    };

    if (target.type === 'commit') {
      body.target = {
        type: 'pipeline_commit_target',
        commit: { hash: target.name },
      };
    }

    return this.request<Pipeline>(`/repositories/${workspace}/${repoSlug}/pipelines`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async stopPipeline(workspace: string, repoSlug: string, pipelineUuid: string): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}/stopPipeline`,
      { method: 'POST' }
    );
  }

  async listPipelineSteps(
    workspace: string,
    repoSlug: string,
    pipelineUuid: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<PipelineStep>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<PipelineStep>>(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}/steps${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getPipelineStepLog(
    workspace: string,
    repoSlug: string,
    pipelineUuid: string,
    stepUuid: string
  ): Promise<string> {
    return this.requestRaw(
      `/repositories/${workspace}/${repoSlug}/pipelines/${pipelineUuid}/steps/${stepUuid}/log`
    );
  }

  async listPipelineVariables(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<PipelineVariable>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<PipelineVariable>>(
      `/repositories/${workspace}/${repoSlug}/pipelines_config/variables${query}`
    );
    return convertPaginatedResponse(response);
  }

  async createPipelineVariable(
    workspace: string,
    repoSlug: string,
    key: string,
    value: string,
    secured?: boolean
  ): Promise<PipelineVariable> {
    return this.request<PipelineVariable>(
      `/repositories/${workspace}/${repoSlug}/pipelines_config/variables`,
      {
        method: 'POST',
        body: JSON.stringify({ key, value, secured: secured || false }),
      }
    );
  }

  async deletePipelineVariable(
    workspace: string,
    repoSlug: string,
    variableUuid: string
  ): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/pipelines_config/variables/${variableUuid}`,
      { method: 'DELETE' }
    );
  }

  // ===========================================================================
  // Deployments
  // ===========================================================================

  async listDeployments(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Deployment>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Deployment>>(
      `/repositories/${workspace}/${repoSlug}/deployments${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getDeployment(
    workspace: string,
    repoSlug: string,
    deploymentUuid: string
  ): Promise<Deployment> {
    return this.request<Deployment>(
      `/repositories/${workspace}/${repoSlug}/deployments/${deploymentUuid}`
    );
  }

  async listEnvironments(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<DeploymentEnvironment>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<DeploymentEnvironment>>(
      `/repositories/${workspace}/${repoSlug}/environments${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getEnvironment(
    workspace: string,
    repoSlug: string,
    environmentUuid: string
  ): Promise<DeploymentEnvironment> {
    return this.request<DeploymentEnvironment>(
      `/repositories/${workspace}/${repoSlug}/environments/${environmentUuid}`
    );
  }

  // ===========================================================================
  // Webhooks
  // ===========================================================================

  async listWebhooks(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Webhook>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Webhook>>(
      `/repositories/${workspace}/${repoSlug}/hooks${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getWebhook(workspace: string, repoSlug: string, webhookUuid: string): Promise<Webhook> {
    return this.request<Webhook>(`/repositories/${workspace}/${repoSlug}/hooks/${webhookUuid}`);
  }

  async createWebhook(
    workspace: string,
    repoSlug: string,
    input: WebhookCreateInput
  ): Promise<Webhook> {
    return this.request<Webhook>(`/repositories/${workspace}/${repoSlug}/hooks`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateWebhook(
    workspace: string,
    repoSlug: string,
    webhookUuid: string,
    input: Partial<WebhookCreateInput>
  ): Promise<Webhook> {
    return this.request<Webhook>(`/repositories/${workspace}/${repoSlug}/hooks/${webhookUuid}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteWebhook(workspace: string, repoSlug: string, webhookUuid: string): Promise<void> {
    await this.request<void>(`/repositories/${workspace}/${repoSlug}/hooks/${webhookUuid}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Branch Restrictions
  // ===========================================================================

  async listBranchRestrictions(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<BranchRestriction>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<BranchRestriction>>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getBranchRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number
  ): Promise<BranchRestriction> {
    return this.request<BranchRestriction>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions/${restrictionId}`
    );
  }

  async createBranchRestriction(
    workspace: string,
    repoSlug: string,
    input: Partial<BranchRestriction>
  ): Promise<BranchRestriction> {
    return this.request<BranchRestriction>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
  }

  async updateBranchRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number,
    input: Partial<BranchRestriction>
  ): Promise<BranchRestriction> {
    return this.request<BranchRestriction>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions/${restrictionId}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    );
  }

  async deleteBranchRestriction(
    workspace: string,
    repoSlug: string,
    restrictionId: number
  ): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/branch-restrictions/${restrictionId}`,
      { method: 'DELETE' }
    );
  }

  // ===========================================================================
  // Branching Model
  // ===========================================================================

  async getBranchingModel(workspace: string, repoSlug: string): Promise<BranchingModel> {
    return this.request<BranchingModel>(`/repositories/${workspace}/${repoSlug}/branching-model`);
  }

  // ===========================================================================
  // Deploy Keys
  // ===========================================================================

  async listDeployKeys(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<DeployKey>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<DeployKey>>(
      `/repositories/${workspace}/${repoSlug}/deploy-keys${query}`
    );
    return convertPaginatedResponse(response);
  }

  async getDeployKey(workspace: string, repoSlug: string, keyId: number): Promise<DeployKey> {
    return this.request<DeployKey>(`/repositories/${workspace}/${repoSlug}/deploy-keys/${keyId}`);
  }

  async createDeployKey(
    workspace: string,
    repoSlug: string,
    key: string,
    label: string
  ): Promise<DeployKey> {
    return this.request<DeployKey>(`/repositories/${workspace}/${repoSlug}/deploy-keys`, {
      method: 'POST',
      body: JSON.stringify({ key, label }),
    });
  }

  async deleteDeployKey(workspace: string, repoSlug: string, keyId: number): Promise<void> {
    await this.request<void>(`/repositories/${workspace}/${repoSlug}/deploy-keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Downloads
  // ===========================================================================

  async listDownloads(
    workspace: string,
    repoSlug: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Download>> {
    const query = buildPaginationQuery(params);
    const response = await this.request<BitbucketPaginatedResponse<Download>>(
      `/repositories/${workspace}/${repoSlug}/downloads${query}`
    );
    return convertPaginatedResponse(response);
  }

  async deleteDownload(workspace: string, repoSlug: string, filename: string): Promise<void> {
    await this.request<void>(
      `/repositories/${workspace}/${repoSlug}/downloads/${encodeURIComponent(filename)}`,
      { method: 'DELETE' }
    );
  }

  // ===========================================================================
  // Source (File browsing)
  // ===========================================================================

  async getFileContent(
    workspace: string,
    repoSlug: string,
    path: string,
    ref?: string
  ): Promise<string> {
    const refPath = ref ? `/${encodeURIComponent(ref)}` : '';
    return this.requestRaw(`/repositories/${workspace}/${repoSlug}/src${refPath}/${path}`);
  }

  async listDirectoryContents(
    workspace: string,
    repoSlug: string,
    path: string,
    ref?: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<{ path: string; type: string; size?: number }>> {
    const refPath = ref ? `/${encodeURIComponent(ref)}` : '';
    const query = buildPaginationQuery(params);
    const response = await this.request<
      BitbucketPaginatedResponse<{ path: string; type: string; size?: number }>
    >(`/repositories/${workspace}/${repoSlug}/src${refPath}/${path}${query}`);
    return convertPaginatedResponse(response);
  }

  // ===========================================================================
  // Diff
  // ===========================================================================

  async getDiff(workspace: string, repoSlug: string, spec: string): Promise<string> {
    return this.requestRaw(`/repositories/${workspace}/${repoSlug}/diff/${spec}`);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Bitbucket client instance with tenant-specific credentials.
 */
export function createBitbucketClient(credentials: TenantCredentials): BitbucketClient {
  return new BitbucketClientImpl(credentials);
}
