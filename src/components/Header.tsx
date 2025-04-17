import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Check if the current path matches the link path
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <header>
      <div className="container">
        <div className="logo">
          <Link to="/">Request Forwarder</Link>
        </div>
        <nav className="nav-links">
          <Link to="/auth" className={isActive('/auth') ? 'active' : ''}>
            Authentication
          </Link>
          <Link to="/requests" className={isActive('/requests') ? 'active' : ''}>
            Requests
          </Link>
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
