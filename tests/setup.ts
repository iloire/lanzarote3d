// Jest setup file for additional configuration
import '@testing-library/jest-dom';

// Mock Three.js for testing environment
jest.mock('three', () => {
  const THREE = jest.requireActual('three');

  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
    })),
    // Add other Three.js mocks as needed
  };
});

// Mock WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn().mockImplementation((type) => {
    if (type === 'webgl' || type === 'webgl2') {
      return {
        // Mock WebGL context methods
        clearColor: jest.fn(),
        clear: jest.fn(),
        drawArrays: jest.fn(),
        // Add other WebGL methods as needed
      };
    }
    return null;
  }),
});

// Silence console errors in tests unless explicitly testing for them
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});