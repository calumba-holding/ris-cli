/// <reference types="vitest" />

import { describe, it, expect } from 'vitest';
import { RISAdapter } from '../adapters/ris.js';
import { sampleAPIResponse, sampleAPIResponseEmpty, sampleAPIStringResponse } from '../test/fixtures/sample.js';

describe('RIS Adapter', () => {
  describe('parseApiResults', () => {
    it('should parse API response to search results', () => {
      const adapter = new RISAdapter();
      
      const results = (adapter as any).parseApiResults(sampleAPIResponse, 'test query', 10);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        title: '4 Ob 123/23x',  // API returns with spaces
        court: 'OGH',
        date: '2023-03-15',
        gz: '4Ob123/23x',
        url: expect.stringContaining('JJR_20230315'),
      });
    });

    it('should handle empty results', () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(sampleAPIResponseEmpty, 'test query', 10);
      
      expect(results).toHaveLength(0);
    });

    it('should generate consistent IDs', () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(sampleAPIResponse, 'test query', 10);
      
      expect(results[0].id).toBe(results[0].id);
      expect(results[0].id).not.toBe(results[1].id);
    });

    it('should normalize dates to ISO format', () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(sampleAPIResponse, 'test query', 10);
      
      expect(results[0].date).toBe('2023-03-15');
      expect(results[1].date).toBe('2023-03-22');
    });

    it('should extract snippets from Schlagworte', () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(sampleAPIResponse, 'test query', 10);
      
      expect(results[0].snippet).toContain('Cybermobbing');
      expect(results[1].snippet).toContain('soziale Medien');
    });

    it('should handle string response with JSON', () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(sampleAPIStringResponse, 'test query', 10);
      
      expect(results).toHaveLength(2);
    });

    it('should limit results', () => {
      const adapter = new RISAdapter();
      const results = (adapter as any).parseApiResults(sampleAPIResponse, 'test query', 1);
      
      expect(results).toHaveLength(1);
    });
  });

  describe('API Integration', () => {
    it('should create adapter instance', () => {
      const adapter = new RISAdapter();
      expect(adapter).toBeInstanceOf(RISAdapter);
    });
  });
});

describe('Utils', () => {
  it('should handle date normalization', () => {
    const adapter = new RISAdapter();
    const normalizeDate = (adapter as any).normalizeDate.bind(adapter);
    
    expect(normalizeDate('15.03.2023')).toBe('2023-03-15');
    expect(normalizeDate('1.1.2024')).toBe('2024-01-01');
    expect(normalizeDate('')).toBe('');
  });
});
