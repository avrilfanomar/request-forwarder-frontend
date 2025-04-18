// Mock axios and apiClient
jest.mock('axios', () => {
  const originalAxios = jest.requireActual('axios');
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockAxios = {
    create: jest.fn().mockReturnValue({
      get: mockGet,
      post: mockPost,
      interceptors: {
        request: {use: jest.fn(), eject: jest.fn()},
        response: {use: jest.fn(), eject: jest.fn()},
      },
    }),
    isAxiosError: jest.fn().mockReturnValue(true),
    ...originalAxios
  };
  // Expose the mock functions for tests to use
  mockAxios.__getMockGet = () => mockGet;
  mockAxios.__getMockPost = () => mockPost;
  return mockAxios;
});

// No need to mock executeWithRetry anymore as it has special handling for test environment
// We'll just use the original implementation

// Get mock functions after mocking
import axios from 'axios';
import {captureRequest, fetchRequest, generateToken, getRequests} from '../../services/api';
import {ApiError} from '../../services/apiUtils';
import {TokenParams} from '../../types/api.types';

// Get the mock functions using the helper methods
const mockGet = (axios as any).__getMockGet();
const mockPost = (axios as any).__getMockPost();

describe('API Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    const tokenParams: TokenParams = {
      port: 8080,
      path: '/api',
      httpSecure: false
    };

    it('should generate a token successfully', async () => {
      // Mock successful response
      mockGet.mockResolvedValueOnce({data: 'test-token'});

      const result = await generateToken(tokenParams);

      expect(result).toBe('test-token');
      expect(mockGet).toHaveBeenCalledWith('/v1/auth/token', {params: tokenParams});
    });

    it('should handle object response and convert to string', async () => {
      // Mock response with object
      const tokenObject = { token: 'test-token', expires: '2023-12-31' };
      mockGet.mockResolvedValueOnce({data: tokenObject});

      const result = await generateToken(tokenParams);

      expect(result).toBe(JSON.stringify(tokenObject));
      expect(mockGet).toHaveBeenCalledWith('/v1/auth/token', {params: tokenParams});
    });

    it('should throw ApiError on failure', async () => {
      // Mock error response
      const error = {
        isAxiosError: true,
        response: {status: 500, data: {message: 'Server error'}}
      };
      mockGet.mockRejectedValueOnce(error);

      await expect(generateToken(tokenParams)).rejects.toThrow(ApiError);
      expect(mockGet).toHaveBeenCalledWith('/v1/auth/token', {params: tokenParams});
    });
  });

  describe('captureRequest', () => {
    const token = 'test-token';
    const requestData = '{"method":"GET","path":"/test"}';

    it('should capture a request successfully', async () => {
      // Mock successful response
      mockPost.mockResolvedValueOnce({data: 'Request captured'});

      const result = await captureRequest(token, requestData);

      expect(result).toBe('Request captured');
      expect(mockPost).toHaveBeenCalledWith(`/v1/req/${token}`, requestData);
    });

    it('should throw ApiError on failure', async () => {
      // Mock error response
      const error = {
        isAxiosError: true,
        response: {status: 400, data: {message: 'Bad request'}}
      };
      mockPost.mockRejectedValueOnce(error);

      await expect(captureRequest(token, requestData)).rejects.toThrow(ApiError);
      expect(mockPost).toHaveBeenCalledWith(`/v1/req/${token}`, requestData);
    });
  });

  describe('fetchRequest', () => {
    const token = 'test-token';
    const requestId = 123;

    it('should fetch a request successfully', async () => {
      // Mock successful response
      mockGet.mockResolvedValueOnce({data: 'Request data'});

      const result = await fetchRequest(token, requestId);

      expect(result).toBe('Request data');
      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}/${requestId}`);
    });

    it('should handle object response and convert to string', async () => {
      // Mock response with object
      const requestObject = { id: 123, method: 'GET', path: '/test' };
      mockGet.mockResolvedValueOnce({data: requestObject});

      const result = await fetchRequest(token, requestId);

      expect(result).toBe(JSON.stringify(requestObject));
      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}/${requestId}`);
    });

    it('should throw ApiError on failure', async () => {
      // Mock error response
      const error = {
        isAxiosError: true,
        response: {status: 404, data: {message: 'Not found'}}
      };
      mockGet.mockRejectedValueOnce(error);

      await expect(fetchRequest(token, requestId)).rejects.toThrow(ApiError);
      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}/${requestId}`);
    });
  });

  describe('getRequests', () => {
    const token = 'test-token';

    it('should handle object response with numeric keys', async () => {
      // Mock response with object containing numeric keys
      const requestsObject = {
        '1': { id: 1, body: '{}', created_at: '' },
        '2': { id: 2, body: '{"key1":"value1"}', created_at: '' }
      };
      mockGet.mockResolvedValueOnce({data: requestsObject});

      const result = await getRequests(token);

      expect(result).toEqual(requestsObject);
      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}`);
    });

    it('should handle array response', async () => {
      // Mock response with array
      const requestsArray = [1, 2, 3];
      mockGet.mockResolvedValueOnce({data: requestsArray});

      const result = await getRequests(token);

      expect(result).toEqual(requestsArray);
      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}`);
    });

    it('should pass lastKnownId parameter when provided', async () => {
      // Mock response with array
      const requestsArray = [4, 5];
      mockGet.mockResolvedValueOnce({data: requestsArray});
      const lastKnownId = 3;

      const result = await getRequests(token, lastKnownId);

      expect(result).toEqual(requestsArray);
      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}`, { params: { lastKnownId } });
    });

    it('should not include lastKnownId parameter when not provided', async () => {
      // Mock response with array
      const requestsArray = [1, 2, 3];
      mockGet.mockResolvedValueOnce({data: requestsArray});

      const result = await getRequests(token);

      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}`);
    });

    it('should pass firstKnownId parameter when provided', async () => {
      // Mock response with array
      const requestsArray = [1, 2];
      mockGet.mockResolvedValueOnce({data: requestsArray});
      const firstKnownId = 3;

      const result = await getRequests(token, undefined, firstKnownId);

      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}`, { params: { firstKnownId } });
    });

    it('should pass both lastKnownId and firstKnownId parameters when both are provided', async () => {
      // Mock response with array
      const requestsArray = [2, 3];
      mockGet.mockResolvedValueOnce({data: requestsArray});
      const lastKnownId = 1;
      const firstKnownId = 4;

      const result = await getRequests(token, lastKnownId, firstKnownId);

      expect(mockGet).toHaveBeenCalledWith(`/v1/req/${token}`, { params: { lastKnownId, firstKnownId } });
    });
  });
});
