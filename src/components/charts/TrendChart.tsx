import React, { useMemo } from 'react';
import { TrendData } from '@/utils/analytics';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendChartProps {
  data: TrendData[];
  title?: string;
  showLegend?: boolean;
  height?: number;
}

export function TrendChart({
  data,
  title = 'Tendência de Receitas e Despesas',
  showLegend = true,
  height = 300,
}: TrendChartProps) {
  const maxValue = useMemo(() => {
    const maxIncome = Math.max(...data.map((d) => d.income));
    const maxExpense = Math.max(...data.map((d) => d.expense));
    return Math.max(maxIncome, maxExpense);
  }, [data]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return `R$ ${value}`;
  };

  const totalIncome = useMemo(() => data.reduce((sum, d) => sum + d.income, 0), [data]);
  const totalExpense = useMemo(() => data.reduce((sum, d) => sum + d.expense, 0), [data]);
  const netBalance = totalIncome - totalExpense;
  const trendPercentage = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      {/* Summary */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-muted-foreground">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-muted-foreground">Despesas</span>
        </div>
        {netBalance >= 0 ? (
          <div className="ml-auto flex items-center gap-2 text-emerald-500">
            <TrendingUp size={18} />
            <span className="font-semibold">+R$ {netBalance.toLocaleString('pt-BR')}</span>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2 text-red-500">
            <TrendingDown size={18} />
            <span className="font-semibold">
              -R$ {Math.abs(netBalance).toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height }} className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-muted-foreground py-2">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency(maxValue / 2)}</span>
          <span>R$ 0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full flex items-end gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              {/* Bars */}
              <div className="w-full flex items-end justify-center gap-1 h-[calc(100%-24px)]">
                {/* Income bar */}
                <div
                  className="w-1/2 bg-emerald-500 rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${maxValue > 0 ? (item.income / maxValue) * 100 : 0}%`,
                    minHeight: item.income > 0 ? '4px' : '0',
                  }}
                  title={`Receita: R$ ${item.income.toLocaleString('pt-BR')}`}
                />
                {/* Expense bar */}
                <div
                  className="w-1/2 bg-red-500 rounded-t transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${maxValue > 0 ? (item.expense / maxValue) * 100 : 0}%`,
                    minHeight: item.expense > 0 ? '4px' : '0',
                  }}
                  title={`Despesa: R$ ${item.expense.toLocaleString('pt-BR')}`}
                />
              </div>

              {/* Balance indicator */}
              {item.balance >= 0 ? (
                <TrendingUp size={12} className="text-emerald-500" />
              ) : (
                <TrendingDown size={12} className="text-red-500" />
              )}

              {/* Month label */}
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Total Receitas:{' '}
              <span className="text-emerald-500 font-medium">
                R$ {totalIncome.toLocaleString('pt-BR')}
              </span>
            </span>
            <span className="text-muted-foreground">
              Total Despesas:{' '}
              <span className="text-red-500 font-medium">
                R$ {totalExpense.toLocaleString('pt-BR')}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
