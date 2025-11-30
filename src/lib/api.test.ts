import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getApiEnv, setApiEnv, getApiBase, getAppMode, setAppMode } from './api';

describe('API Utils', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    document.cookie = 'api_env=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.clear();
  });

  describe('getApiEnv', () => {
    it('should return "test" by default', () => {
      expect(getApiEnv()).toBe('test');
    });

    it('should return "product" when cookie is set to product', () => {
      setApiEnv('product');
      expect(getApiEnv()).toBe('product');
    });

    it('should return "test" when cookie is set to test', () => {
      setApiEnv('test');
      expect(getApiEnv()).toBe('test');
    });
  });

  describe('getAppMode', () => {
    it('should return "dev" by default', () => {
      expect(getAppMode()).toBe('dev');
    });

    it('should return "prod" when localStorage is set to prod', () => {
      setAppMode('prod');
      expect(getAppMode()).toBe('prod');
    });

    it('should return "dev" when localStorage is set to dev', () => {
      setAppMode('dev');
      expect(getAppMode()).toBe('dev');
    });

    it('should return "dev" when localStorage access fails', () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(getAppMode()).toBe('dev');

      // Restore
      localStorage.getItem = originalGetItem;
    });
  });

  describe('getApiBase', () => {
    it('should return test API base by default', () => {
      const base = getApiBase();
      expect(base).toContain('/webhook-test');
    });

    it('should return product API base when env is product', () => {
      setApiEnv('product');
      const base = getApiBase();
      expect(base).toContain('/webhook');
      expect(base).not.toContain('/webhook-test');
    });
  });
});



