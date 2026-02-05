import { Transaction, Category } from '@/types';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface TrendData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

export interface FinancialHealth {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  insights: string[];
  recommendations: string[];
}

export interface AnalyticsFilters {
  startDate: Date;
  endDate: Date;
  categories: string[];
  transactionTypes: ('income' | 'expense')[];
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

// Função para calcular tendências mensais
export function calculateMonthlyTrends(
  transactions: Transaction[],
  months: number = 6
): TrendData[] {
  const endDate = new Date();
  const startDate = subMonths(endDate, months - 1);
  
  const monthLabels = eachMonthOfInterval({ start: startDate, end: endDate });
  
  return monthLabels.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= monthStart && date <= monthEnd;
    });
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      month: format(month, 'MMM/yyyy', { locale: ptBR }),
      income,
      expense,
      balance: income - expense,
    };
  });
}

// Função para calcular gastos por categoria
export function calculateCategorySpending(
  transactions: Transaction[],
  categories: Category[],
  period: 'month' | 'quarter' | 'year' = 'month'
): CategorySpending[] {
  const endDate = new Date();
  const startDate = subMonths(endDate, period === 'month' ? 1 : period === 'quarter' ? 3 : 12);
  
  const periodTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= startDate && date <= endDate && t.type === 'expense';
  });
  
  const totalExpenses = periodTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const categoryTotals = new Map<string, number>();
  
  periodTransactions.forEach(t => {
    const current = categoryTotals.get(t.category) || 0;
    categoryTotals.set(t.category, current + Math.abs(t.amount));
  });
  
  return Array.from(categoryTotals.entries())
    .map(([categoryName, total]) => {
      const category = categories.find(c => c.name === categoryName);
      return {
        categoryId: category?.id || categoryName,
        categoryName,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
        trend: 'stable' as const,
        trendValue: 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

// Função para calcular saúde financeira
export function calculateFinancialHealth(
  transactions: Transaction[],
  monthlyIncome: number
): FinancialHealth {
  const last3Months = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= subMonths(new Date(), 3);
  });
  
  const totalIncome = last3Months
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = last3Months
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  let score = 0;
  let rating: FinancialHealth['rating'] = 'poor';
  const insights: string[] = [];
  const recommendations: string[] = [];
  
  if (savingsRate >= 20) {
    score = 100;
    rating = 'excellent';
    insights.push('Parabéns! Você está economizando mais de 20% da renda.');
  } else if (savingsRate >= 10) {
    score = 75;
    rating = 'good';
    insights.push('Bom trabalho! Você está economizando uma parcela saudável.');
  } else if (savingsRate >= 0) {
    score = 50;
    rating = 'fair';
    insights.push('Você está economizando, mas pode melhorar.');
  } else {
    score = 25;
    rating = 'poor';
    insights.push('Atenção: seus gastos estão superando sua renda.');
    recommendations.push('Revise seus gastos variáveis');
    recommendations.push('Considere reduzir assinaturas não essenciais');
  }
  
  return { score, rating, insights, recommendations };
}

// Função para detectar padrões de gastos
export function detectSpendingPatterns(transactions: Transaction[]): string[] {
  const patterns: string[] = [];
  const last30Days = transactions.filter(t => {
    const date = new Date(t.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });
  
  // Detectar gastos recorrentes
  const amountGroups = new Map<number, Date[]>();
  last30Days.forEach(t => {
    if (t.type === 'expense') {
      const amount = Math.round(Math.abs(t.amount));
      const dates = amountGroups.get(amount) || [];
      dates.push(new Date(t.date));
      amountGroups.set(amount, dates);
    }
  });
  
  amountGroups.forEach((dates, amount) => {
    if (dates.length >= 2) {
      const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
      let sameDayCount = 0;
      for (let i = 1; i < sortedDates.length; i++) {
        if (sortedDates[i].getDate() === sortedDates[i-1].getDate()) {
          sameDayCount++;
        }
      }
      if (sameDayCount >= sortedDates.length - 1) {
        patterns.push(`Gasto recorrente de R$ ${amount} no mesmo dia do mês`);
      }
    }
  });
  
  return patterns;
}
