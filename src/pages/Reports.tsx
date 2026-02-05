/**
 * Relatórios - Página de Análise Financeira
 * Refatorado com skeleton loading e utilitários centralizados
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { PieChart, LineChart } from '@/components/charts';
import { formatCurrency } from '@/utils/currency';
import { getCategoryIcon, getCategoryColor } from '@/utils/categoryIcons';
import { Transaction } from '@/types';
import { Download, Filter, Calendar } from 'lucide-react';
import { ReportsSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { ExportModal, useExportModal } from '@/components/export/ExportModal';

export default function Reports() {
  const { user } = useAuthStore();
  const { data, init, loading } = useAppStore();
  const { isOpen, open, close } = useExportModal();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (user) {
        await init(user.id);
        setHasInitialized(true);
      }
    };
    
    initialize();
  }, [user, init]);

  // Todos os hooks devem ser chamados sempre na mesma ordem
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter((tx: Transaction) => {
      const txDate = new Date(tx.date);
      const matchesYear = txDate.getFullYear() === currentYear;
      const matchesMonth = selectedMonth !== null ? txDate.getMonth() === selectedMonth : true;
      return matchesYear && matchesMonth;
    });
  }, [data.transactions, currentYear, selectedMonth]);

  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((tx: Transaction) => tx.type === 'income')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

    const totalExpense = filteredTransactions
      .filter((tx: Transaction) => tx.type === 'expense')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
    };
  }, [filteredTransactions]);

  const expenseByCategory = useMemo(() => {
    return filteredTransactions
      .filter((tx: Transaction) => tx.type === 'expense')
      .reduce((acc: Record<string, number>, tx: Transaction) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthTransactions = data.transactions.filter((tx: Transaction) => {
        const txDate = new Date(tx.date);
        return txDate.getFullYear() === currentYear && txDate.getMonth() === i;
      });

      const income = monthTransactions
        .filter((tx: Transaction) => tx.type === 'income')
        .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

      const expense = monthTransactions
        .filter((tx: Transaction) => tx.type === 'expense')
        .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

      return {
        month: new Date(currentYear, i).toLocaleString('pt-BR', { month: 'short' }),
        income,
        expense,
      };
    });
  }, [data.transactions, currentYear]);

  const detailedTransactions = useMemo(() => {
    return [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  const yearRange = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const isLoading = loading || !hasInitialized;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise detalhada das suas finanças
            </p>
          </div>
          <button
            disabled={isLoading}
            onClick={open}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <select
                value={currentYear}
                disabled={isLoading}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {yearRange.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedMonth ?? 'all'}
                disabled={isLoading}
                onChange={(e) =>
                  setSelectedMonth(e.target.value === 'all' ? null : parseInt(e.target.value))
                }
                className="px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="all">Todo o Ano</option>
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card p-6 rounded-lg border border-border">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total de Receitas"
              value={formatCurrency(stats.totalIncome)}
              color="text-green-500"
              trend={stats.totalIncome > 0 ? 'up' : 'neutral'}
            />
            <StatCard
              title="Total de Despesas"
              value={formatCurrency(stats.totalExpense)}
              color="text-orange-500"
              trend={stats.totalExpense > 0 ? 'down' : 'neutral'}
            />
            <StatCard
              title="Saldo Líquido"
              value={formatCurrency(stats.netIncome)}
              color={stats.netIncome >= 0 ? 'text-green-500' : 'text-red-500'}
              trend={stats.netIncome >= 0 ? 'up' : 'down'}
            />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
            {isLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : (
              <PieChart data={expenseByCategory} />
            )}
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Evolução Mensal ({currentYear})</h3>
            {isLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : (
              <LineChart data={monthlyData} />
            )}
          </div>
        </div>

        {/* Detailed Transactions */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Transações Detalhadas</h3>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : detailedTransactions.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <p>Nenhuma transação encontrada para o período selecionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {detailedTransactions.map((tx: Transaction) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    tx.type === 'income'
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-orange-500/10 border-orange-500/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${getCategoryColor(tx.category)}20` }}
                    >
                      {(() => {
                        const IconComponent = getCategoryIcon(tx.category);
                        const color = getCategoryColor(tx.category);
                        return IconComponent ? <IconComponent size={24} style={{ color }} className="lucide-icon" /> : null;
                      })()}
                    </div>

                    <div>
                      <p className="font-medium">{tx.desc}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.category} • {(() => {
                          const date = new Date(tx.date);
                          date.setTime(date.getTime() + date.getTimezoneOffset() * 60000);
                          return date.toLocaleDateString('pt-BR');
                        })()}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`font-bold ${
                      tx.type === 'income' ? 'text-green-500' : 'text-orange-500'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ExportModal
        isOpen={isOpen}
        onClose={close}
        data={{
          transactions: data.transactions,
          budgets: data.budgets,
          goals: data.goals
        }}
        profileName={user?.name || 'usuario'}
      />
    </>
  );
}

// Componente StatCard
interface StatCardProps {
  title: string;
  value: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, color, trend }: StatCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}
