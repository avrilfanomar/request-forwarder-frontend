import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRequests, fetchRequest } from '../services/api';

interface RequestItem {
  id: number;
  method?: string;
  timestamp?: string;
  body?: string;
}

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  totalItems, 
  itemsPerPage, 
  currentPage, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination mt-3 d-flex justify-content-center">
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className="btn-secondary mr-2"
      >
        Previous
      </button>

      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="btn-secondary mr-1">1</button>
          {startPage > 2 && <span className="mx-1">...</span>}
        </>
      )}

      {pageNumbers.map(number => (
        <button
          key={number}
          onClick={() => onPageChange(number)}
          className={`btn-${currentPage === number ? 'primary' : 'secondary'} mx-1`}
        >
          {number}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="mx-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="btn-secondary ml-1">{totalPages}</button>
        </>
      )}

      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className="btn-secondary ml-2"
      >
        Next
      </button>
    </div>
  );
};

const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showTokenForm, setShowTokenForm] = useState<boolean>(false);
  const [newToken, setNewToken] = useState<string>('');
  const [lastKnownId, setLastKnownId] = useState<number | undefined>(undefined);
  const [firstKnownId, setFirstKnownId] = useState<number | undefined>(undefined);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const savedPage = localStorage.getItem('requestsCurrentPage');
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    const savedItemsPerPage = localStorage.getItem('requestsItemsPerPage');
    return savedItemsPerPage ? parseInt(savedItemsPerPage, 10) : 15;
  });

  // Load token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('requestForwarderToken');
    if (!storedToken) {
      navigate('/auth');
      return;
    }
    // Ensure token is a string
    try {
      // If it's a JSON object, convert it to string
      const parsedToken = JSON.parse(storedToken);
      if (typeof parsedToken === 'object') {
        setToken(JSON.stringify(parsedToken));
      } else {
        setToken(storedToken);
      }
    } catch (e) {
      // If it's already a string and not valid JSON, use as is
      setToken(storedToken);
    }
  }, [navigate]);

  // Fetch request count and details
  useEffect(() => {
    if (!token) return;

    // Helper function to add delay between requests
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Flag to track if we're currently fetching
    let isFetching = false;

    // Reference to the current requests length to avoid dependency on state
    let currentRequestsLength = requests.length;

    const fetchRequestCount = async () => {
      // Prevent concurrent fetches
      if (isFetching) return;

      isFetching = true;
      try {
        setLoading(true);
        const response = await getRequests(token, lastKnownId, firstKnownId);

        // Handle different response formats
        if (typeof response === 'object' && !Array.isArray(response)) {
          // If it's an object with request data (like {19: {...}, 20: {...}})
          const requestIds = Object.keys(response).map(Number);
          const count = requestIds.length;
          setRequestCount(count);

          if (count > 0) {
            const newRequests: RequestItem[] = [];

            // Find the highest request ID to update lastKnownId
            const highestId = Math.max(...requestIds);
            const lowestId = Math.min(...requestIds);
            if (!lastKnownId || highestId > lastKnownId) {
              setLastKnownId(highestId);
            }
            // Always update firstKnownId to the lowest ID in the current batch
            setFirstKnownId(lowestId);

            // Process all requests from the response object
            for (const requestId of requestIds) {
              const requestData = response[requestId];

              if (requestData) {
                // Parse the request data if needed
                let parsedData;
                if (typeof requestData === 'string') {
                  try {
                    parsedData = JSON.parse(requestData);
                  } catch {
                    parsedData = { raw: requestData };
                  }
                } else {
                  parsedData = requestData;
                }

                // Ensure all properties are strings
                const method = typeof parsedData.method === 'object'
                  ? JSON.stringify(parsedData.method)
                  : parsedData.method || 'UNKNOWN';

                const timestamp = typeof parsedData.created_at === 'object'
                  ? JSON.stringify(parsedData.created_at)
                  : parsedData.created_at || "";

                const body = typeof parsedData.body === 'object'
                  ? JSON.stringify(parsedData.body)
                  : parsedData.body || "";

                newRequests.push({
                  id: requestId,
                  method,
                  timestamp,
                  body,
                });
              } else {
                // If we don't have data for this request, add a placeholder
                newRequests.push({ id: requestId });
              }
            }

            setRequests(prev => {
              // Create a map of existing requests by ID for quick lookup
              const requestMap = new Map(prev.map(req => [req.id, req]));

              // Add new requests, overwriting any with the same ID
              newRequests.forEach(req => {
                requestMap.set(req.id, req);
              });

              // Convert map back to array and sort by timestamp (newest first)
              const updated = Array.from(requestMap.values())
                .sort((a, b) => {
                  // Handle missing timestamps
                  if (!a.timestamp) return 1;
                  if (!b.timestamp) return -1;
                  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

              currentRequestsLength = updated.length; // Update the reference
              return updated;
            });
          }
        } else if (Array.isArray(response)) {
          // If it's an array of request IDs
          const requestIds = response as number[];
          const count = requestIds.length;
          setRequestCount(count);

          // Find the highest and lowest request IDs to update lastKnownId and firstKnownId
          if (count > 0) {
            const highestId = Math.max(...requestIds);
            const lowestId = Math.min(...requestIds);
            if (!lastKnownId || highestId > lastKnownId) {
              setLastKnownId(highestId);
            }
            // Always update firstKnownId to the lowest ID in the current batch
            setFirstKnownId(lowestId);
          }

          // We don't need to fetch individual requests anymore as the backend handles it
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to fetch requests. Please check your token and try again.');

        // Add a longer delay after any error
        await delay(3000); // 3 second delay after errors
      } finally {
        setLoading(false);
        isFetching = false;
      }
    };

    // Initial fetch with a small delay to allow component to fully mount
    setTimeout(fetchRequestCount, 500);

    // Set up polling with a longer interval
    const interval = setInterval(fetchRequestCount, 5000); // Increased to 5 seconds
    setPollingInterval(interval);

    // Clean up on unmount
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, lastKnownId, firstKnownId]); // Removed requests.length and pollingInterval from dependencies

  // Reset to first page when requests array changes significantly
  useEffect(() => {
    // Only reset if we're not on the first page and the current page would be empty
    if (currentPage > 1 && (currentPage - 1) * itemsPerPage >= requests.length) {
      setCurrentPage(Math.max(1, Math.ceil(requests.length / itemsPerPage)));
    }
  }, [requests.length, currentPage, itemsPerPage]);

  // Save currentPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('requestsCurrentPage', currentPage.toString());
  }, [currentPage]);

  // Save itemsPerPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('requestsItemsPerPage', itemsPerPage.toString());
  }, [itemsPerPage]);

  // Update lastKnownId whenever requests array changes
  useEffect(() => {
    if (requests.length > 0) {
      const highestId = Math.max(...requests.map(req => req.id));
      if (!lastKnownId || highestId > lastKnownId) {
        setLastKnownId(highestId);
      }
    }
  }, [requests, lastKnownId]);

  // Update firstKnownId whenever requests array changes or current page changes
  useEffect(() => {
    if (requests.length > 0) {
      const lowestId = Math.min(...requests.map(req => req.id));
      const totalPages = Math.ceil(requests.length / itemsPerPage);

      // Only use the lowest ID when the user is on the last page
      if (currentPage === totalPages) {
        setFirstKnownId(lowestId);
      } else {
        // Use -1 as firstKnownId unless customer wants to see older requests
        setFirstKnownId(-1);
      }
    }
  }, [requests, currentPage, itemsPerPage]);

  // Memoize the sorted and paginated requests to avoid unnecessary re-sorting
  const paginatedRequests = useMemo(() => {
    return requests
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [requests, currentPage, itemsPerPage]);


  const handleTokenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewToken(e.target.value);
  };

  const handleTokenChange = () => {
    if (newToken.trim()) {
      localStorage.setItem('requestForwarderToken', newToken.trim());
      setToken(newToken.trim());
      setShowTokenForm(false);
      setNewToken('');
    }
  };

  const handleCopyToken = () => {
    const tokenValue = typeof token === 'object' ? JSON.stringify(token) : token;
    navigator.clipboard.writeText(tokenValue || '')
      .then(() => {
        // Could add a toast notification here if desired
        console.log('Token copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy token: ', err);
      });
  };

  if (!token) {
    return <div className="container">Redirecting to authentication...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Captured Requests</h1>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <p className="mb-0 mr-2">
                <strong>Your Token:</strong> {typeof token === 'object' ? JSON.stringify(token) : token}
              </p>
              <button 
                onClick={handleCopyToken} 
                className="btn-primary ml-2"
                title="Copy token to clipboard"
              >
                Copy
              </button>
            </div>
            <button 
              onClick={() => setShowTokenForm(!showTokenForm)} 
              className="btn-secondary"
            >
              {showTokenForm ? 'Cancel' : 'Change Token'}
            </button>
          </div>

          {showTokenForm && (
            <div className="mt-2 mb-3">
              <div className="d-flex">
                <input
                  type="text"
                  value={newToken}
                  onChange={handleTokenInputChange}
                  placeholder="Enter new token"
                  className="form-control"
                />
                <button 
                  onClick={handleTokenChange} 
                  className="btn-primary ml-2"
                  disabled={!newToken.trim()}
                >
                  Update Token
                </button>
              </div>
            </div>
          )}

          <p className="mt-2">
            <small>Requests are automatically refreshed every 5 seconds. Only new requests since the last known ID are fetched.</small>
          </p>
        </div>

        {loading && requests.length === 0 ? (
          <div className="text-center">
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="alert alert-warning">
            <p>No requests captured yet.</p>
            <p className="mt-2">
              Make HTTP requests to your API to see them appear here.
            </p>
          </div>
        ) : (
          <div className="request-list">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <label htmlFor="pageSize" className="mr-2">Items per page:</label>
                <select 
                  id="pageSize" 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  className="form-control form-control-sm d-inline-block" 
                  style={{ width: 'auto' }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
              <div>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, requests.length)} to {Math.min(currentPage * itemsPerPage, requests.length)} of {requests.length} requests
              </div>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Body preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map(request => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.timestamp ? new Date(request.timestamp).toISOString() : 'UNKNOWN'}</td>
                    <td>
                      {request.body ? (
                        <div className="body-preview" style={{ maxHeight: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {request.body.length > 150 
                            ? `${request.body.substring(0, 150)}...` 
                            : request.body}
                        </div>
                      ) : 'No body content'}
                    </td>
                    <td>
                      <button 
                        onClick={() => navigate(`/requests/${request.id}`)} 
                        className="btn-primary"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination 
              totalItems={requests.length} 
              itemsPerPage={itemsPerPage} 
              currentPage={currentPage} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsPage;
