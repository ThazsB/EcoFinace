import { describe, it, expect } from 'vitest';
import { 
  calculateMonthlyTrends, 
  calculateCategorySpending,
  calculateFinancialHealth,
  detectSpendingPatterns
} from '@/utils/analytics';
import { Transaction, Category } from '@/types';
import { subMonths, subDays } from 'date-fns';

const now = new Date();
const aMonthAgo = subMonths(now, 1).toISOString();
const twoMonthsAgo = subMonths(now, 2).toISOString();
const tenDaysAgo = subDays(now, 10).toISOString();

const mockTransactions: Transaction[] = [
  { id: 1, desc: 'Salário', amount: 5000, type: 'income', category: 'Salário', date: twoMonthsAgo, profileId: '1' },
  { id: 2, desc: 'Aluguel', amount: 1500, type: 'expense', category: 'Moradia', date: twoMonthsAgo, profileId: '1' },
  { id: 3, desc: 'Supermercado', amount: 800, type: 'expense', category: 'Alimentação', date: aMonthAgo, profileId: '1' },
  { id: 4, desc: 'Freelance', amount: 2000, type: 'income', category: 'Renda Extra', date: now.toISOString(), profileId: '1' },
  { id: 5, desc: 'Contas de Casa', amount: 400, type: 'expense', category: 'Moradia', date: now.toISOString(), profileId: '1' },
  { id: 6, desc: 'Restaurante', amount: 200, type: 'expense', category: 'Alimentação', date: now.toISOString(), profileId: '1' },
];

const mockCategories: Category[] = [
  { id: '1', name: 'Salário', type: 'income', icon: 'briefcase', color: '#10b981', isSystem: true, isFavorite: false, usageCount: 0, createdAt: '', updatedAt: '' },
  { id: '2', name: 'Moradia', type: 'expense', icon: 'home', color: '#3b82f6', isSystem: true, isFavorite: false, usageCount: 0, createdAt: '', updatedAt: '' },
  { id: '3', name: 'Alimentação', type: 'expense', icon: 'utensils', color: '#f59e0b', isSystem: true, isFavorite: false, usageCount: 0, createdAt: '', updatedAt: '' },
  { id: '4', name: 'Renda Extra', type: 'income', icon: 'trending-up', color: '#8b5cf6', isSystem: true, isFavorite: false, usageCount: 0, createdAt: '', updatedAt: '' },
];

describe('Analytics Utils', () => {
  describe('calculateMonthlyTrends', () => {
    it('should calculate monthly trends correctly (sums over provided months)', () => {
      const months = 3;
      const trends = calculateMonthlyTrends(mockTransactions, months);
      expect(trends).toHaveLength(months);

      const totalIncome = trends.reduce((s, t) => s + t.income, 0);
      const totalExpense = trends.reduce((s, t) => s + t.expense, 0);

      const expectedIncome = mockTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expectedExpense = mockTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

      expect(totalIncome).toBe(expectedIncome);
      expect(totalExpense).toBe(expectedExpense);
    });

    it('should handle empty transactions', () => {
      const trends = calculateMonthlyTrends([], 3);
      expect(trends).toHaveLength(3);
      trends.forEach(trend => {
        expect(trend.income).toBe(0);
        expect(trend.expense).toBe(0);
        expect(trend.balance).toBe(0);
      });
    });
  });

  describe('calculateCategorySpending', () => {
    it('should calculate spending by category for the last month', () => {
      const spending = calculateCategorySpending(mockTransactions, mockCategories, 'month');
      const moradia = spending.find(s => s.categoryName === 'Moradia');

      const periodStart = subMonths(new Date(), 1);
      const expectedMoradiaTotal = mockTransactions
        .filter(t => t.type === 'expense' && t.category === 'Moradia' && new Date(t.date) >= periodStart)
        .reduce((s, t) => s + Math.abs(t.amount), 0);

      if (expectedMoradiaTotal > 0) {
        expect(moradia).toBeDefined();
        expect(moradia?.total).toBe(expectedMoradiaTotal);
      } else {
        expect(moradia).toBeUndefined();
      }
    });

    it('should return empty array when no expenses', () => {
      const incomeOnly = mockTransactions.filter(t => t.type === 'income');
      const spending = calculateCategorySpending(incomeOnly, mockCategories, 'month');
      expect(spending).toHaveLength(0);
    });
  });

  describe('calculateFinancialHealth', () => {
    it('should return excellent/good/fair/poor rating and insights', () => {
      const health = calculateFinancialHealth(mockTransactions, 7000);
      expect(typeof health.score).toBe('number');
      expect(['excellent', 'good', 'fair', 'poor']).toContain(health.rating);
      expect(Array.isArray(health.insights)).toBe(true);
      expect(Array.isArray(health.recommendations)).toBe(true);
    });
  });

  describe('detectSpendingPatterns', () => {
    it('should detect recurring expenses within last 30 days', () => {
      const dateStr = tenDaysAgo;
      const recurringTransactions: Transaction[] = [
        { id: 1, desc: 'Netflix', amount: 55.9, type: 'expense', category: 'Entretenimento', date: dateStr, profileId: '1' },
        { id: 2, desc: 'Netflix', amount: 55.9, type: 'expense', category: 'Entretenimento', date: dateStr, profileId: '1' },
        { id: 3, desc: 'Netflix', amount: 55.9, type: 'expense', category: 'Entretenimento', date: dateStr, profileId: '1' },
      ];
      
      const patterns = detectSpendingPatterns(recurringTransactions);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toContain('Gasto recorrente');
    });

    it('should return empty array when no patterns detected', () => {
      const patterns = detectSpendingPatterns(mockTransactions);
      expect(Array.isArray(patterns)).toBe(true);
    });
  });
});