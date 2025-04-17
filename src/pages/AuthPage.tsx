import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateToken } from '../services/api';
import { TokenParams } from '../types/api.types';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TokenParams>({
    port: 8080,
    path: '/api',
    httpSecure: true,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'port' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const generatedToken = await generateToken(formData);

      // Ensure token is a string
      let tokenString: string;
      if (typeof generatedToken === 'object') {
        tokenString = JSON.stringify(generatedToken);
      } else {
        tokenString = String(generatedToken);
      }

      setToken(tokenString);

      // Store token in localStorage for later use
      localStorage.setItem('requestForwarderToken', tokenString);

      // Redirect to requests page after a short delay
      setTimeout(() => {
        navigate('/requests');
      }, 1500);
    } catch (err) {
      setError('Failed to generate token. Please check your inputs and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="text-center mb-4">Generate API Token</h1>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {token ? (
          <div className="alert alert-success" role="alert">
            <p>Token generated successfully!</p>
            <p className="mt-2">Your token: <strong>{token}</strong></p>
            <p className="mt-2">Redirecting to requests page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="port">Port Number</label>
              <input
                type="number"
                id="port"
                name="port"
                className="form-control"
                value={formData.port}
                onChange={handleChange}
                required
                min="1"
                max="65535"
                aria-describedby="portHelp"
              />
              <small id="portHelp" className="form-text text-muted">
                The port number for your API (1-65535)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="path">Path</label>
              <input
                type="text"
                id="path"
                name="path"
                className="form-control"
                value={formData.path}
                onChange={handleChange}
                required
                aria-describedby="pathHelp"
              />
              <small id="pathHelp" className="form-text text-muted">
                The base path for your API (e.g., /api)
              </small>
            </div>

            <div className="form-group">
              <div className="checkbox">
                <label>
                  <input
                    type="checkbox"
                    name="httpSecure"
                    checked={formData.httpSecure}
                    onChange={handleChange}
                    aria-describedby="secureHelp"
                  />
                  {' '}Use HTTPS (secure connection)
                </label>
              </div>
              <small id="secureHelp" className="form-text text-muted">
                Enable for secure connections (recommended for production)
              </small>
            </div>

            <div className="text-center mt-4">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Generating...' : 'Generate Token'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4">
          <h3>About this service</h3>
          <p>
            The Request Forwarder allows you to capture and inspect HTTP requests made to your API.
            Generate a token with your API details to get started.
          </p>
          <p className="mt-2">
            <strong>Note:</strong> This service will require a paid subscription for production use in the future.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
