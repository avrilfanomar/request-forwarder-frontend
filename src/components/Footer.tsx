import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="container">
        <p>
          &copy; {currentYear} Request Forwarder Web UI
        </p>
        <p className="mt-2">
          <a 
            href="https://github.com/avrilfanomar/request-forwarder-frontend/issues" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Report an Issue
          </a>
        </p>
        <p className="mt-2">
          <small>This service requires a paid subscription for production use.</small>
        </p>
      </div>
    </footer>
  );
};

export default Footer;