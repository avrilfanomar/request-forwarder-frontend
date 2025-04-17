/**
 * Types for the API service
 */

/**
 * Parameters for generating a token
 */
export interface TokenParams {
  /** Port number for the service */
  port: number;
  /** Path for the service */
  path: string;
  /** Whether to use HTTPS */
  httpSecure: boolean;
}

/**
 * Request data structure
 */
export interface RequestData {
  /** Unique identifier for the request */
  id: number;
  /** Timestamp when the request was received */
  timestamp: string;
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** Request path */
  path: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body */
  body: string;
  /** When the request was created */
  created_at?: string;
}

/**
 * Response format for getRequests API call
 * Can be one of:
 * - Record<string, RequestData> - Object with request IDs as keys and request data as values
 * - number[] - Array of request IDs
 * - number - Count of requests
 */
export type GetRequestsResponse = Record<string, RequestData> | number[] | number;