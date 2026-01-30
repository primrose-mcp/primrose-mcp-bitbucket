/**
 * Bitbucket Entity Types
 *
 * Type definitions for Bitbucket API entities.
 */

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationParams {
  /** Number of items to return per page */
  pagelen?: number;
  /** Page number (1-based) */
  page?: number;
  /** Query string for filtering */
  q?: string;
  /** Sort field and direction */
  sort?: string;
}

export interface BitbucketPaginatedResponse<T> {
  /** Total number of items */
  size?: number;
  /** Current page */
  page?: number;
  /** Number of items per page */
  pagelen?: number;
  /** URL to next page */
  next?: string;
  /** URL to previous page */
  previous?: string;
  /** Array of items */
  values: T[];
}

export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Number of items in this response */
  count: number;
  /** Total count (if available) */
  total?: number;
  /** Whether more items are available */
  hasMore: boolean;
  /** Cursor/URL for next page */
  nextCursor?: string;
}

// =============================================================================
// Workspace
// =============================================================================

export interface Workspace {
  type: 'workspace';
  uuid: string;
  name: string;
  slug: string;
  is_private?: boolean;
  created_on?: string;
  links?: Links;
}

// =============================================================================
// Project
// =============================================================================

export interface Project {
  type: 'project';
  uuid: string;
  key: string;
  name: string;
  description?: string;
  is_private?: boolean;
  created_on?: string;
  updated_on?: string;
  owner?: Workspace;
  links?: Links;
}

// =============================================================================
// Repository
// =============================================================================

export interface Repository {
  type: 'repository';
  uuid: string;
  name: string;
  full_name: string;
  slug: string;
  description?: string;
  is_private: boolean;
  fork_policy?: 'allow_forks' | 'no_public_forks' | 'no_forks';
  language?: string;
  created_on?: string;
  updated_on?: string;
  size?: number;
  has_issues?: boolean;
  has_wiki?: boolean;
  mainbranch?: Branch;
  owner?: Account;
  workspace?: Workspace;
  project?: Project;
  links?: Links;
  scm?: 'git' | 'hg';
}

export interface RepositoryCreateInput {
  scm?: 'git';
  name?: string;
  description?: string;
  is_private?: boolean;
  fork_policy?: 'allow_forks' | 'no_public_forks' | 'no_forks';
  language?: string;
  has_issues?: boolean;
  has_wiki?: boolean;
  project?: { key: string };
  mainbranch?: { type: 'branch'; name: string };
}

// =============================================================================
// Branch
// =============================================================================

export interface Branch {
  type: 'branch' | 'named_branch';
  name: string;
  target?: Commit;
  links?: Links;
  default_merge_strategy?: string;
  merge_strategies?: string[];
}

export interface BranchRestriction {
  type: 'branchrestriction';
  id: number;
  kind: string;
  branch_match_kind: 'branching_model' | 'glob' | 'regex';
  branch_type?: string;
  pattern?: string;
  users?: Account[];
  groups?: Group[];
  value?: number;
  links?: Links;
}

// =============================================================================
// Tag
// =============================================================================

export interface Tag {
  type: 'tag';
  name: string;
  target?: Commit;
  message?: string;
  date?: string;
  tagger?: Author;
  links?: Links;
}

// =============================================================================
// Commit
// =============================================================================

export interface Commit {
  type: 'commit';
  hash: string;
  message?: string;
  author?: Author;
  date?: string;
  parents?: Commit[];
  repository?: Repository;
  links?: Links;
  summary?: { raw?: string; markup?: string; html?: string };
}

export interface Author {
  type?: 'author';
  raw?: string;
  user?: Account;
}

// =============================================================================
// Commit Status
// =============================================================================

export interface CommitStatus {
  type: 'build';
  uuid?: string;
  key: string;
  refname?: string;
  url: string;
  state: 'SUCCESSFUL' | 'FAILED' | 'INPROGRESS' | 'STOPPED';
  name?: string;
  description?: string;
  created_on?: string;
  updated_on?: string;
  links?: Links;
}

// =============================================================================
// Pull Request
// =============================================================================

export interface PullRequest {
  type: 'pullrequest';
  id: number;
  title: string;
  description?: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  author?: Account;
  source: PullRequestEndpoint;
  destination: PullRequestEndpoint;
  merge_commit?: Commit;
  close_source_branch?: boolean;
  closed_by?: Account;
  reason?: string;
  created_on?: string;
  updated_on?: string;
  reviewers?: Account[];
  participants?: Participant[];
  links?: Links;
  summary?: { raw?: string; markup?: string; html?: string };
  task_count?: number;
  comment_count?: number;
}

export interface PullRequestEndpoint {
  branch: { name: string };
  commit?: { hash: string };
  repository?: Repository;
}

export interface PullRequestCreateInput {
  title: string;
  source: { branch: { name: string }; repository?: { full_name: string } };
  destination?: { branch: { name: string } };
  description?: string;
  close_source_branch?: boolean;
  reviewers?: Array<{ uuid: string }>;
}

export interface PullRequestUpdateInput {
  title?: string;
  description?: string;
  destination?: { branch: { name: string } };
  reviewers?: Array<{ uuid: string }>;
}

export interface Participant {
  type: 'participant';
  user?: Account;
  role?: 'PARTICIPANT' | 'REVIEWER';
  approved?: boolean;
  state?: 'approved' | 'changes_requested' | null;
  participated_on?: string;
}

// =============================================================================
// Comment
// =============================================================================

export interface Comment {
  type: 'pullrequest_comment' | 'issue_comment';
  id: number;
  content?: { raw?: string; markup?: string; html?: string };
  user?: Account;
  created_on?: string;
  updated_on?: string;
  deleted?: boolean;
  inline?: InlineComment;
  parent?: { id: number };
  links?: Links;
}

export interface InlineComment {
  from?: number;
  to?: number;
  path: string;
}

// =============================================================================
// Issue
// =============================================================================

export interface Issue {
  type: 'issue';
  id: number;
  title: string;
  content?: { raw?: string; markup?: string; html?: string };
  state: 'new' | 'open' | 'resolved' | 'on hold' | 'invalid' | 'duplicate' | 'wontfix' | 'closed';
  priority: 'trivial' | 'minor' | 'major' | 'critical' | 'blocker';
  kind: 'bug' | 'enhancement' | 'proposal' | 'task';
  assignee?: Account;
  reporter?: Account;
  created_on?: string;
  updated_on?: string;
  edited_on?: string;
  votes?: number;
  links?: Links;
  component?: Component;
  milestone?: Milestone;
  version?: Version;
}

export interface IssueCreateInput {
  title: string;
  content?: { raw: string };
  kind?: 'bug' | 'enhancement' | 'proposal' | 'task';
  priority?: 'trivial' | 'minor' | 'major' | 'critical' | 'blocker';
  assignee?: { uuid: string };
  component?: { name: string };
  milestone?: { name: string };
  version?: { name: string };
}

export interface IssueUpdateInput {
  title?: string;
  content?: { raw: string };
  state?: 'new' | 'open' | 'resolved' | 'on hold' | 'invalid' | 'duplicate' | 'wontfix' | 'closed';
  kind?: 'bug' | 'enhancement' | 'proposal' | 'task';
  priority?: 'trivial' | 'minor' | 'major' | 'critical' | 'blocker';
  assignee?: { uuid: string } | null;
  component?: { name: string } | null;
  milestone?: { name: string } | null;
  version?: { name: string } | null;
}

export interface Component {
  type: 'component';
  id?: number;
  name: string;
  links?: Links;
}

export interface Milestone {
  type: 'milestone';
  id?: number;
  name: string;
  links?: Links;
}

export interface Version {
  type: 'version';
  id?: number;
  name: string;
  links?: Links;
}

// =============================================================================
// Pipeline
// =============================================================================

export interface Pipeline {
  type: 'pipeline';
  uuid: string;
  build_number: number;
  state?: PipelineState;
  creator?: Account;
  repository?: Repository;
  target?: PipelineTarget;
  trigger?: PipelineTrigger;
  created_on?: string;
  completed_on?: string;
  duration_in_seconds?: number;
  links?: Links;
}

export interface PipelineState {
  type: 'pipeline_state_completed' | 'pipeline_state_in_progress' | 'pipeline_state_pending';
  name: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'HALTED' | 'PAUSED';
  result?: PipelineStateResult;
  stage?: PipelineStateStage;
}

export interface PipelineStateResult {
  type:
    | 'pipeline_state_completed_successful'
    | 'pipeline_state_completed_failed'
    | 'pipeline_state_completed_stopped'
    | 'pipeline_state_completed_expired'
    | 'pipeline_state_completed_error';
  name: 'SUCCESSFUL' | 'FAILED' | 'STOPPED' | 'EXPIRED' | 'ERROR';
}

export interface PipelineStateStage {
  type: 'pipeline_state_in_progress_running' | 'pipeline_state_in_progress_halted';
  name: 'RUNNING' | 'HALTED' | 'PAUSED';
}

export interface PipelineTarget {
  type: 'pipeline_ref_target' | 'pipeline_commit_target' | 'pipeline_pullrequest_target';
  ref_type?: 'branch' | 'tag' | 'bookmark' | 'named_branch';
  ref_name?: string;
  commit?: { hash: string };
  selector?: PipelineSelector;
}

export interface PipelineSelector {
  type: 'branches' | 'tags' | 'bookmarks' | 'default' | 'custom' | 'pull-requests';
  pattern?: string;
}

export interface PipelineTrigger {
  type: 'pipeline_trigger_manual' | 'pipeline_trigger_push';
}

export interface PipelineStep {
  type: 'pipeline_step';
  uuid: string;
  name?: string;
  state?: PipelineStepState;
  image?: PipelineImage;
  script_commands?: PipelineCommand[];
  started_on?: string;
  completed_on?: string;
  duration_in_seconds?: number;
  run_number?: number;
  links?: Links;
}

export interface PipelineStepState {
  type:
    | 'pipeline_step_state_completed'
    | 'pipeline_step_state_in_progress'
    | 'pipeline_step_state_pending'
    | 'pipeline_step_state_ready';
  name: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'READY' | 'HALTED' | 'PAUSED' | 'NOT_RUN';
  result?: PipelineStateResult;
}

export interface PipelineImage {
  name?: string;
}

export interface PipelineCommand {
  name?: string;
  command?: string;
  action?: string;
}

export interface PipelineVariable {
  type: 'pipeline_variable';
  uuid: string;
  key: string;
  value?: string;
  secured?: boolean;
}

export interface PipelineSchedule {
  type: 'pipeline_schedule';
  uuid: string;
  enabled?: boolean;
  cron_pattern?: string;
  target?: PipelineTarget;
  created_on?: string;
  updated_on?: string;
}

// =============================================================================
// Deployment
// =============================================================================

export interface Deployment {
  type: 'deployment';
  uuid: string;
  name?: string;
  key?: string;
  version?: number;
  state?: DeploymentState;
  deployable?: Pipeline;
  release?: DeploymentRelease;
  environment?: DeploymentEnvironment;
  last_update_time?: string;
}

export interface DeploymentState {
  type:
    | 'deployment_state_in_progress'
    | 'deployment_state_completed'
    | 'deployment_state_undeployed';
  name: 'IN_PROGRESS' | 'COMPLETED' | 'UNDEPLOYED';
  status?: DeploymentStatus;
}

export interface DeploymentStatus {
  type:
    | 'deployment_state_completed_successful'
    | 'deployment_state_completed_failed'
    | 'deployment_state_completed_stopped';
  name: 'SUCCESSFUL' | 'FAILED' | 'STOPPED';
}

export interface DeploymentRelease {
  type: 'deployment_release';
  uuid: string;
  name?: string;
  url?: string;
  commit?: Commit;
  created_on?: string;
}

export interface DeploymentEnvironment {
  type: 'deployment_environment';
  uuid: string;
  name: string;
  slug?: string;
  rank?: number;
  environment_type?: EnvironmentType;
  deployment_gate_enabled?: boolean;
  lock?: EnvironmentLock;
  restrictions?: EnvironmentRestrictions;
  hidden?: boolean;
  category?: EnvironmentCategory;
}

export interface EnvironmentType {
  type: 'deployment_environment_type';
  name: 'Test' | 'Staging' | 'Production';
}

export interface EnvironmentLock {
  type: 'deployment_environment_lock_open' | 'deployment_environment_lock_locked';
  name: 'OPEN' | 'LOCKED';
}

export interface EnvironmentRestrictions {
  admin_only?: boolean;
  type: 'deployment_restrictions_configuration';
}

export interface EnvironmentCategory {
  name: 'Test' | 'Staging' | 'Production';
}

// =============================================================================
// Webhook
// =============================================================================

export interface Webhook {
  type: 'webhook_subscription';
  uuid: string;
  url: string;
  description?: string;
  subject_type: 'workspace' | 'repository';
  subject?: Repository | Workspace;
  active?: boolean;
  created_at?: string;
  events?: string[];
  links?: Links;
}

export interface WebhookCreateInput {
  url: string;
  description?: string;
  active?: boolean;
  events: string[];
}

// =============================================================================
// Deploy Key
// =============================================================================

export interface DeployKey {
  type: 'deploy_key';
  id: number;
  key: string;
  label: string;
  comment?: string;
  added_on?: string;
  last_used?: string;
  links?: Links;
  repository?: Repository;
}

// =============================================================================
// Download / Artifact
// =============================================================================

export interface Download {
  type: 'download';
  name: string;
  size?: number;
  downloads?: number;
  created_on?: string;
  user?: Account;
  links?: Links;
}

// =============================================================================
// User / Account
// =============================================================================

export interface Account {
  type: 'user' | 'team';
  uuid: string;
  username?: string;
  display_name?: string;
  nickname?: string;
  account_id?: string;
  created_on?: string;
  is_staff?: boolean;
  links?: Links;
}

export interface User extends Account {
  type: 'user';
  account_status?: string;
  has_2fa_enabled?: boolean;
}

export interface Group {
  type: 'group';
  name: string;
  slug?: string;
  full_slug?: string;
  owner?: Account;
  workspace?: Workspace;
  links?: Links;
}

export interface WorkspaceMembership {
  type: 'workspace_membership';
  user: Account;
  workspace: Workspace;
  permission?: 'owner' | 'collaborator' | 'member';
  added_on?: string;
  links?: Links;
}

// =============================================================================
// SSH Key
// =============================================================================

export interface SshKey {
  type: 'ssh_key';
  uuid?: string;
  key?: string;
  comment?: string;
  label?: string;
  added_on?: string;
  last_used?: string;
  links?: Links;
  owner?: Account;
}

// =============================================================================
// Diff / Patch
// =============================================================================

export interface DiffStat {
  type: 'diffstat';
  status: 'added' | 'removed' | 'modified' | 'renamed';
  old?: DiffStatFile;
  new?: DiffStatFile;
  lines_added?: number;
  lines_removed?: number;
}

export interface DiffStatFile {
  path: string;
  type?: 'commit_file';
  escaped_path?: string;
}

// =============================================================================
// Branching Model
// =============================================================================

export interface BranchingModel {
  type: 'branching_model';
  development?: BranchingModelBranch;
  production?: BranchingModelBranch;
  branch_types?: BranchType[];
}

export interface BranchingModelBranch {
  name?: string;
  branch?: Branch;
  use_mainbranch?: boolean;
}

export interface BranchType {
  kind: 'feature' | 'bugfix' | 'release' | 'hotfix';
  prefix?: string;
  enabled?: boolean;
}

// =============================================================================
// Common Types
// =============================================================================

export interface Links {
  self?: Link;
  html?: Link;
  avatar?: Link;
  clone?: Link[];
  commits?: Link;
  watchers?: Link;
  forks?: Link;
  downloads?: Link;
  pullrequests?: Link;
  issues?: Link;
  pipelines?: Link;
  branches?: Link;
  tags?: Link;
  source?: Link;
  diff?: Link;
  diffstat?: Link;
  patch?: Link;
  approve?: Link;
  decline?: Link;
  merge?: Link;
  [key: string]: Link | Link[] | undefined;
}

export interface Link {
  href: string;
  name?: string;
}

export type ResponseFormat = 'json' | 'markdown';
