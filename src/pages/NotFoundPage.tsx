import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="container">
      <div className="card text-center">
        <h1>404 - Page Not Found</h1>
        <p className="mb-4">
          The page you are looking for does not exist or has been moved.
        </p>
        <div>
          <Link to="/" className="btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;