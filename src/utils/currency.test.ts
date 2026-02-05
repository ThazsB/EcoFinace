import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, formatPercentage } from '@/utils/currency';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('R$ 1.000,00');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });

    it('should format decimal numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
    });

    it('should format large numbers correctly', () => {
      expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse formatted currency string to number', () => {
      expect(parseCurrency('R$ 1.000,50')).toBe(1000.5);
    });

    it('should handle empty string', () => {
      expect(parseCurrency('')).toBe(0);
    });

    it('should handle plain numbers', () => {
      expect(parseCurrency('1000')).toBe(1000);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly (pt-BR)', () => {
      // Intl in pt-BR uses comma as decimal separator and 1 fraction digit for percent formatter used in src
      expect(formatPercentage(25.5)).toBe('25,5%');
    });

    it('should format zero percentage', () => {
      expect(formatPercentage(0)).toBe('0,0%');
    });

    it('should format 100 percentage', () => {
      expect(formatPercentage(100)).toBe('100,0%');
    });
  });
});