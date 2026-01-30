/**
 * Environment Bindings for Bitbucket MCP Server
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant-specific credentials are passed via request headers.
 *
 * Required Headers (one authentication method):
 * - X-Bitbucket-Username + X-Bitbucket-App-Password: Basic Auth with App Password
 * - X-Bitbucket-Access-Token: OAuth2 Bearer Token
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Bitbucket username (from X-Bitbucket-Username header) */
  username?: string;

  /** Bitbucket App Password (from X-Bitbucket-App-Password header) */
  appPassword?: string;

  /** OAuth2 Access Token (from X-Bitbucket-Access-Token header) */
  accessToken?: string;

  /** Override Bitbucket API base URL (from X-Bitbucket-Base-URL header) */
  baseUrl?: string;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    username: headers.get('X-Bitbucket-Username') || undefined,
    appPassword: headers.get('X-Bitbucket-App-Password') || undefined,
    accessToken: headers.get('X-Bitbucket-Access-Token') || undefined,
    baseUrl: headers.get('X-Bitbucket-Base-URL') || undefined,
  };
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(credentials: TenantCredentials): void {
  const hasBasicAuth = credentials.username && credentials.appPassword;
  const hasOAuth = credentials.accessToken;

  if (!hasBasicAuth && !hasOAuth) {
    throw new Error(
      'Missing credentials. Provide either X-Bitbucket-Username + X-Bitbucket-App-Password headers, ' +
        'or X-Bitbucket-Access-Token header.'
    );
  }
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  /** KV namespace for caching (optional) */
  CACHE_KV?: KVNamespace;

  /** Cloudflare AI binding (optional) */
  AI?: Ai;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 20);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 100);
}
