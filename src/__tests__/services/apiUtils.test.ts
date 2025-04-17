// Mock axios before imports
jest.mock('axios', () => {
  const originalAxios = jest.requireActual('axios');
  return {
    create: jest.fn().mockReturnValue({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    }),
    isAxiosError: jest.fn().mockReturnValue(true),
    ...originalAxios
  };
});

import axios from 'axios';
import { 
  executeWithRetry, 
  formatErrorMessage, 
  ApiError, 
  DEFAULT_RETRY_CONFIG 
} from '../../services/apiUtils';

describe('apiUtils', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeWithRetry', () => {
    it('should return data on successful request', async () => {
      // Mock a successful response
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await executeWithRetry(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      // Mock a function that fails twice then succeeds
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      // Use a faster retry config for testing
      const testRetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        baseDelayMs: 10 // Use a small delay for faster tests
      };

      const result = await executeWithRetry(mockFn, testRetryConfig);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw an error after max retries', async () => {
      // Mock a function that always fails
      const mockError = new Error('Always fails');
      const mockFn = jest.fn().mockRejectedValue(mockError);

      // Use a faster retry config for testing
      const testRetryConfig = {
        maxRetries: 2,
        baseDelayMs: 10,
        retryStatusCodes: [500]
      };

      await expect(executeWithRetry(mockFn, testRetryConfig))
        .rejects.toThrow('Always fails');

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry on 4xx errors (except specified ones)', async () => {
      // Mock a function that returns a 404 error
      const axiosError = {
        isAxiosError: true,
        response: { status: 404 },
        message: 'Not Found'
      };
      const mockFn = jest.fn().mockRejectedValue(axiosError);

      // Use a faster retry config for testing
      const testRetryConfig = {
        maxRetries: 2,
        baseDelayMs: 10,
        retryStatusCodes: [429, 500] // 404 not included
      };

      await expect(executeWithRetry(mockFn, testRetryConfig))
        .rejects.toThrow('Not Found');

      expect(mockFn).toHaveBeenCalledTimes(1); // No retries
    });

    it('should retry on specified 4xx errors', async () => {
      // Mock a function that returns a 429 error then succeeds
      const axiosError = {
        isAxiosError: true,
        response: { status: 429 },
        message: 'Too Many Requests'
      };
      const mockFn = jest.fn()
        .mockRejectedValueOnce(axiosError)
        .mockResolvedValue('success');

      // Use a faster retry config for testing
      const testRetryConfig = {
        maxRetries: 2,
        baseDelayMs: 10,
        retryStatusCodes: [429, 500] // 429 included
      };

      const result = await executeWithRetry(mockFn, testRetryConfig);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('ApiError', () => {
    it('should create an error with status and data', () => {
      const error = new ApiError('Test error', 404, { message: 'Not found' });

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.data).toEqual({ message: 'Not found' });
      expect(error.name).toBe('ApiError');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format ApiError correctly', () => {
      const error = new ApiError('Test error', 404);
      const message = formatErrorMessage(error);

      expect(message).toBe('Error 404: Test error');
    });

    it('should format Axios error correctly', () => {
      const error = {
        isAxiosError: true,
        response: { status: 500 },
        message: 'Server error'
      };
      const message = formatErrorMessage(error);

      expect(message).toBe('Error 500: Server error');
    });

    it('should format standard Error correctly', () => {
      const error = new Error('Standard error');
      const message = formatErrorMessage(error);

      expect(message).toBe('Standard error');
    });

    it('should handle unknown error types', () => {
      const message = formatErrorMessage('Not an error');

      expect(message).toBe('An unknown error occurred');
    });
  });
});
