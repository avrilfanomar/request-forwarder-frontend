import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the components used in App
jest.mock('./components/Header', () => () => <div data-testid="header-mock" />);
jest.mock('./components/Footer', () => () => <div data-testid="footer-mock" />);
jest.mock('./pages/AuthPage', () => () => <div data-testid="auth-page-mock" />);
jest.mock('./pages/RequestsPage', () => () => <div data-testid="requests-page-mock" />);
jest.mock('./pages/RequestDetailPage', () => () => <div data-testid="request-detail-page-mock" />);
jest.mock('./pages/NotFoundPage', () => () => <div data-testid="not-found-page-mock" />);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: () => <div />,
  Navigate: () => <div />,
}));

// Mock the ThemeProvider
jest.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn() }),
}));

describe('App', () => {
  it('renders header and footer', () => {
    render(<App />);

    expect(screen.getByTestId('header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('footer-mock')).toBeInTheDocument();
  });
});