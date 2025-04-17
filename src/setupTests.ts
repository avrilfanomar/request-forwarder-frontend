// Import Jest DOM for custom DOM element matchers
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: query.includes('dark'),
  media: query,
  onchange: null,
  addListener: jest.fn(cb => cb({ matches: query.includes('dark') })), // Deprecated
  removeListener: jest.fn(), // Deprecated
  addEventListener: jest.fn((_event, cb) => cb({ matches: query.includes('dark') })),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
