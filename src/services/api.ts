import axios from 'axios';
import { executeWithRetry, formatErrorMessage, ApiError } from './apiUtils';
import { TokenParams, RequestData, GetRequestsResponse } from '../types/api.types';

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
    console.error('Error generating token:', formatErrorMessage(error));
    throw new ApiError(
      `Failed to generate token: ${formatErrorMessage(error)}`,
      axios.isAxiosError(error) ? error.response?.status : undefined
    );
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
    console.error('Error capturing request:', formatErrorMessage(error));
    throw new ApiError(
      `Failed to capture request: ${formatErrorMessage(error)}`,
      axios.isAxiosError(error) ? error.response?.status : undefined
    );
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
    console.error('Error fetching request:', formatErrorMessage(error));
    throw new ApiError(
      `Failed to fetch request ${id}: ${formatErrorMessage(error)}`,
      axios.isAxiosError(error) ? error.response?.status : undefined
    );
  }
};

/**
 * Get all requests for a token
 * 
 * @param token - The token to get requests for
 * @param lastKnownId - Optional parameter to fetch only requests newer than this ID
 * @returns Response containing request data or IDs
 */
export const getRequests = async (token: string, lastKnownId?: number): Promise<GetRequestsResponse> => {
  try {
    return await executeWithRetry(async () => {
      const url = `/v1/req/${token}`;
      const params = lastKnownId ? { lastKnownId } : undefined;
      const response = await apiClient.get(url, { params });

      // Handle different response formats
      if (typeof response.data === 'object') {
        // If it's an object with numeric keys (like {1: {...}, 2: {...}}), return the full object
        const numericKeys = Object.keys(response.data)
          .filter(key => !isNaN(Number(key)));
        if (numericKeys.length > 0) {
          return response.data as Record<string, RequestData>;
        }

        // If it's an array, return the array itself (which should contain IDs)
        if (Array.isArray(response.data)) {
          return response.data as number[];
        }

        // If it has a length or count property, use that
        if ('length' in response.data) {
          return Number(response.data.length) || 0;
        }
        if ('count' in response.data) {
          return Number(response.data.count) || 0;
        }

        // Last resort: count all keys
        return Object.keys(response.data).length;
      }

      return Number(response.data) || 0; // Convert to number or default to 0
    });
  } catch (error) {
    console.error('Error getting requests:', formatErrorMessage(error));
    throw new ApiError(
      `Failed to get requests: ${formatErrorMessage(error)}`,
      axios.isAxiosError(error) ? error.response?.status : undefined
    );
  }
};

const apiService = {
  generateToken,
  captureRequest,
  fetchRequest,
  getRequests,
};

export default apiService;
