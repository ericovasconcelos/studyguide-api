// Create mock for localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Create mock for fetch
global.fetch = jest.fn();

// Set up global mocks
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Create dummy mock for console methods to keep tests clean
global.console = {
  ...global.console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};