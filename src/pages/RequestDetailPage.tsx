// noinspection SuspiciousTypeOfGuard

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRequest } from '../services/api';

interface RequestDetail {
  id?: number;
  method?: string;
  timestamp?: string;
  created_at?: string;
  headers?: Record<string, string>;
  body?: string;
  raw?: string;
  params?: Record<string, string>;
}

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // No longer using tabs

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

  // Fetch request details
  useEffect(() => {
    if (!token || !id) return;

    const fetchRequestDetails = async () => {
      try {
        setLoading(true);
        const requestData = await fetchRequest(token, parseInt(id));

        // Parse the request data if it's a JSON string
        let parsedData: RequestDetail;
        try {
          parsedData = JSON.parse(requestData);
          // Keep the raw data as well
          parsedData.raw = requestData;

          // Parse headers if they are a string (JSON)
          if (parsedData.headers && typeof parsedData.headers === 'string') {
            try {
              parsedData.headers = JSON.parse(parsedData.headers);
            } catch (e) {
              console.error('Error parsing headers:', e);
              // If parsing fails, keep the original string
            }
          }

          // Parse params if they are a string (JSON)
          if (parsedData.params && typeof parsedData.params === 'string') {
            try {
              parsedData.params = JSON.parse(parsedData.params);
            } catch (e) {
              console.error('Error parsing params:', e);
              // If parsing fails, keep the original string
            }
          }

          // Ensure timestamp is properly formatted
          if (parsedData.created_at) {
            // Use created_at as the timestamp
            parsedData.timestamp = parsedData.created_at;
          } else if (parsedData.timestamp === null || parsedData.timestamp === undefined) {
            console.log('Timestamp is missing in the response (no created_at or timestamp field)');
          }

        } catch {
          parsedData = { raw: requestData };
        }

        setRequest(parsedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching request details:', err);
        setError('Failed to fetch request details. Please check your token and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [token, id]);

  const isValidXML = (xmlString: string): boolean => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      // Check if parsing was successful and no parsing errors were found
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      return parserError.length === 0;
    } catch {
      return false;
    }
  };

  const formatXML = (xmlString: string): string => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      // Check if parsing was successful
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        return xmlString;
      }

      // Format the XML with proper indentation
      const serializer = new XMLSerializer();
      let formatted = '';
      const xml = serializer.serializeToString(xmlDoc);

      // Add indentation
      let indent = '';
      const tab = '  '; // 2 spaces for indentation

      xml.split(/>\s*</).forEach(node => {
        if (node.match(/^\/\w/)) {
          // If this is a closing tag, decrease indentation
          indent = indent.substring(tab.length);
        }

        formatted += indent + '<' + node + '>\n';

        if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) {
          // If this is an opening tag (but not a self-closing tag), increase indentation
          indent += tab;
        }
      });

      // Remove the added '>' at the beginning and '<' at the end
      return formatted.substring(1, formatted.length - 2);
    } catch {
      return xmlString;
    }
  };

  const formatBody = (bodyString: string): string => {
    // First try to format as JSON
    try {
      // Check if the string is valid JSON
      const parsedJSON = JSON.parse(bodyString);
      // If it's valid JSON, prettify it
      return JSON.stringify(parsedJSON, null, 2);
    } catch {
      // If it's not valid JSON, try XML
      if (isValidXML(bodyString)) {
        return formatXML(bodyString);
      }
      // If it's neither valid JSON nor valid XML, return the original string
      return bodyString;
    }
  };

  if (!token) {
    return <div className="container">Redirecting to authentication...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="mb-4">
          <button onClick={() => navigate('/requests')} className="btn-secondary">
            &larr; Back to Requests
          </button>
        </div>

        <h1>Request Details #{id}</h1>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <p>Loading request details...</p>
          </div>
        ) : !request ? (
          <div className="alert alert-warning">
            <p>Request not found.</p>
          </div>
        ) : (
          <>
            <div className="request-content">
              {/* Basic request information */}
              <div className="request-info mb-4">
                <table className="detail-table">
                  <tbody>
                    <tr>
                      <th>ID</th>
                      <td>{request.id || id}</td>
                    </tr>
                    <tr>
                      <th>Method</th>
                      <td>{request.method || 'UNKNOWN'}</td>
                    </tr>
                    <tr>
                      <th>Timestamp</th>
                      <td>
                        {request.timestamp 
                          ? (() => {
                              try {
                                // Try to parse the timestamp as a date
                                const date = new Date(request.timestamp);
                                // Check if the date is valid
                                return isNaN(date.getTime()) 
                                  ? request.timestamp // If not valid, show the raw timestamp
                                  : date.toISOString(); // If valid, format it
                              } catch (e) {
                                console.error('Error formatting timestamp:', e);
                                return request.timestamp; // Return the raw timestamp if parsing fails
                              }
                            })()
                          : 'UNKNOWN'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Headers Section */}
              <div className="section mb-4">
                <h2 className="section-title">Headers</h2>
                <div className="headers-content">
                  {request.headers && Object.keys(request.headers).length > 0 ? (
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Header</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(request.headers).map(([key, value]) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No headers found.</p>
                  )}
                </div>
              </div>

              {/* Body Section */}
              <div className="section mb-4">
                <h2 className="section-title">Body</h2>
                <div className="body-content">
                  {request.body ? (
                    <pre className="request-body">
                      {formatBody(request.body)}
                    </pre>
                  ) : (
                    <p>No body content found.</p>
                  )}
                </div>
              </div>

              {/* Params Section */}
              <div className="section mb-4">
                <h2 className="section-title">Params</h2>
                <div className="params-content">
                  {request.params && Object.keys(request.params).length > 0 ? (
                    <table className="detail-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(request.params).map(([key, value]) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No URL parameters found.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestDetailPage;
