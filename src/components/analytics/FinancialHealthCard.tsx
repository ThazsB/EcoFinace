import React from 'react';
import { FinancialHealth } from '@/utils/analytics';
import { TrendingUp, TrendingDown, CheckCircle, Lightbulb } from 'lucide-react';

interface FinancialHealthCardProps {
  health: FinancialHealth;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export function FinancialHealthCard({
  health,
  monthlyIncome,
  monthlyExpenses,
}: FinancialHealthCardProps) {
  const savingsRate =
    monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  const getRatingColor = () => {
    switch (health.rating) {
      case 'excellent':
        return 'text-emerald-500';
      case 'good':
        return 'text-blue-500';
      case 'fair':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
    }
  };

  const getRatingBg = () => {
    switch (health.rating) {
      case 'excellent':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'good':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'fair':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'poor':
        return 'bg-red-500/10 border-red-500/20';
    }
  };

  const getRatingLabel = () => {
    switch (health.rating) {
      case 'excellent':
        return 'Excelente';
      case 'good':
        return 'Bom';
      case 'fair':
        return 'Regular';
      case 'poor':
        return 'Atenção';
    }
  };

  return (
    <div className={`p-6 rounded-xl border ${getRatingBg()} transition-all`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle size={20} className={getRatingColor()} />
            Saúde Financeira
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Avaliação baseada nos últimos 3 meses
          </p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getRatingColor()}`}>{health.score}</div>
          <div className={`text-sm font-medium ${getRatingColor()}`}>{getRatingLabel()}</div>
        </div>
      </div>

      {/* Savings Rate */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Taxa de Economia</span>
          <span
            className={`font-semibold ${savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 10 ? 'text-blue-500' : savingsRate >= 0 ? 'text-yellow-500' : 'text-red-500'}`}
          >
            {savingsRate.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              savingsRate >= 20
                ? 'bg-emerald-500'
                : savingsRate >= 10
                  ? 'bg-blue-500'
                  : savingsRate >= 0
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(Math.abs(savingsRate), 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>0%</span>
          <span>20%</span>
          <span>40%</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Receitas</p>
          <p className="text-lg font-bold text-emerald-500 mt-1">
            R$ {monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-background/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Despesas</p>
          <p className="text-lg font-bold text-red-500 mt-1">
            R$ {monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Insights */}
      {health.insights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb size={14} className="text-yellow-500" />
            Insights
          </h4>
          <ul className="space-y-1">
            {health.insights.map((insight, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {health.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-blue-500" />
            Recomendações
          </h4>
          <ul className="space-y-1">
            {health.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
