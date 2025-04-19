import axios from 'axios';
import { executeWithRetry, formatErrorMessage, ApiError } from './apiUtils';
import { TokenParams, GetRequestsResponse } from '../types/api.types';

/**
 * Helper function to handle API errors consistently
 * 
 * @param error - The error that occurred
 * @param operation - Description of the operation that failed
 * @throws ApiError with formatted message and status
 */
const handleApiError = (error: unknown, operation: string): never => {
  console.error(`Error ${operation}:`, formatErrorMessage(error));
  throw new ApiError(
    `Failed to ${operation}: ${formatErrorMessage(error)}`,
    axios.isAxiosError(error) ? error.response?.status : undefined
  );
};

// Base URL for the API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// API functions

/**
 * Generate a token for capturing requests
 * 
 * @param params - Parameters for token generation
 * @returns A token string
 */
export const generateToken = async (params: TokenParams): Promise<string> => {
  try {
    return await executeWithRetry(async () => {
      const response = await apiClient.get('/v1/auth/token', { params });
      // Ensure we return a string, even if the API returns an object
      if (typeof response.data === 'object') {
        return JSON.stringify(response.data);
      }
      return response.data;
    });
  } catch (error) {
    return handleApiError(error, 'generate token');
  }
};

/**
 * Capture a request with the given token
 * 
 * @param token - The token to use for capturing
 * @param data - The request data to capture
 * @returns Response from the server
 */
export const captureRequest = async (token: string, data: string): Promise<string> => {
  try {
    return await executeWithRetry(async () => {
      const response = await apiClient.post(`/v1/req/${token}`, data);
      return response.data;
    });
  } catch (error) {
    return handleApiError(error, 'capture request');
  }
};

/**
 * Fetch a specific request by ID
 * 
 * @param token - The token associated with the request
 * @param id - The ID of the request to fetch
 * @returns The request data as a string
 */
export const fetchRequest = async (token: string, id: number): Promise<string> => {
  try {
    return await executeWithRetry(async () => {
      const response = await apiClient.get(`/v1/req/${token}/${id}`);
      // Ensure we return a string, even if the API returns an object
      if (typeof response.data === 'object') {
        return JSON.stringify(response.data);
      }
      return response.data;
    });
  } catch (error) {
    return handleApiError(error, `fetch request ${id}`);
  }
};

/**
 * Get all requests for a token
 * 
 * @param token - The token to get requests for
 * @param lastKnownId - Optional parameter to fetch only requests newer than this ID
 * @param firstKnownId - Optional parameter to fetch only requests older than this ID
 * @returns Response containing request data or IDs
 */
export const getRequests = async (token: string, lastKnownId?: number, firstKnownId?: number): Promise<GetRequestsResponse> => {
  try {
    return await executeWithRetry(async () => {
      const url = `/v1/req/${token}`;
      const params: Record<string, number> = {};
      if (lastKnownId !== undefined) params.lastKnownId = lastKnownId;
      if (firstKnownId !== undefined) params.firstKnownId = firstKnownId;

      // Only include params object if there are actual parameters
      const response = Object.keys(params).length > 0 
        ? await apiClient.get(url, { params }) 
        : await apiClient.get(url);

      // Return the data directly, regardless of its format
      return response.data;
    });
  } catch (error) {
    return handleApiError(error, 'get requests');
  }
};

const apiService = {
  generateToken,
  captureRequest,
  fetchRequest,
  getRequests,
};

export default apiService;
