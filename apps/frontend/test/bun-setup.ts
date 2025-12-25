import { expect, afterEach, describe, it, beforeAll, jest } from 'bun:test';

// Mock LocalStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

global.localStorage = localStorageMock as any;

// Stub window if needed (some libs check window)
if (typeof global.window === 'undefined') {
    global.window = {
        localStorage: localStorageMock,
    } as any;
}

afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
});
