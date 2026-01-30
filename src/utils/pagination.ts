/**
 * Pagination Utilities for Bitbucket MCP Server
 */

import type {
  BitbucketPaginatedResponse,
  PaginatedResponse,
  PaginationParams,
} from '../types/entities.js';

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  pagelen: 20,
  maxPagelen: 100,
} as const;

/**
 * Normalize pagination parameters for Bitbucket API
 */
export function normalizePaginationParams(
  params?: PaginationParams,
  maxPagelen = PAGINATION_DEFAULTS.maxPagelen
): Required<Pick<PaginationParams, 'pagelen'>> & Omit<PaginationParams, 'pagelen'> {
  return {
    pagelen: Math.min(params?.pagelen || PAGINATION_DEFAULTS.pagelen, maxPagelen),
    page: params?.page,
    q: params?.q,
    sort: params?.sort,
  };
}

/**
 * Convert Bitbucket paginated response to standard format
 */
export function convertPaginatedResponse<T>(
  response: BitbucketPaginatedResponse<T>
): PaginatedResponse<T> {
  return {
    items: response.values,
    count: response.values.length,
    total: response.size,
    hasMore: !!response.next,
    nextCursor: response.next,
  };
}

/**
 * Create an empty paginated response
 */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    items: [],
    count: 0,
    hasMore: false,
  };
}

/**
 * Build query string from pagination params
 */
export function buildPaginationQuery(params?: PaginationParams): string {
  if (!params) return '';

  const queryParts: string[] = [];

  if (params.pagelen) {
    queryParts.push(`pagelen=${params.pagelen}`);
  }
  if (params.page) {
    queryParts.push(`page=${params.page}`);
  }
  if (params.q) {
    queryParts.push(`q=${encodeURIComponent(params.q)}`);
  }
  if (params.sort) {
    queryParts.push(`sort=${encodeURIComponent(params.sort)}`);
  }

  return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
}
