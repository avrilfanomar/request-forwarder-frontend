import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Configuration for retry mechanism
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds between retries (will be exponentially increased) */
  baseDelayMs: number;
  /** Status codes that should trigger a retry */
  retryStatusCodes: number[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504]
};

/**
 * Custom error class for API errors with additional context
 */
export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Delay execution for specified milliseconds
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a request with automatic retries for transient errors
 * 
 * @param requestFn - Function that returns a promise for the request
 * @param retryConfig - Configuration for the retry mechanism
 * @param forceRetry - Force retry logic even in test environment (for testing retry logic)
 * @returns Promise with the response
 */
export async function executeWithRetry<T>(
  requestFn: () => Promise<T>,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  forceRetry: boolean = false
): Promise<T> {
  // Special handling for test environment
  if (process.env.NODE_ENV === 'test' && !forceRetry) {
    // In test environment, just execute the function without retries
    return requestFn();
  }

  let lastError: any;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Execute the request
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Check if we should retry based on the error
      const isAxiosError = axios.isAxiosError(error);
      const status = isAxiosError ? (error as AxiosError).response?.status : undefined;

      // Don't retry if:
      // 1. This was our last attempt
      // 2. It's not a status code we want to retry
      // 3. It's a 4xx error (except those in retryStatusCodes)
      if (
        attempt >= retryConfig.maxRetries || 
        (status && !retryConfig.retryStatusCodes.includes(status)) ||
        (status && status >= 400 && status < 500 && !retryConfig.retryStatusCodes.includes(status))
      ) {
        break;
      }

      // Calculate exponential backoff delay
      const delayMs = retryConfig.baseDelayMs * Math.pow(2, attempt);
      console.log(`API request failed, retrying in ${delayMs}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`);

      // Wait before the next retry
      await delay(delayMs);
    }
  }

  // If we got here, all retries failed
  if (axios.isAxiosError(lastError)) {
    const axiosError = lastError as AxiosError;
    throw new ApiError(
      axiosError.message || 'API request failed after multiple retries',
      axiosError.response?.status,
      axiosError.response?.data
    );
  }

  // For non-Axios errors, just rethrow
  throw lastError;
}

/**
 * Format error message from API error
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `Error ${error.status || ''}: ${error.message}`;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return `Error ${axiosError.response?.status || ''}: ${axiosError.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}
