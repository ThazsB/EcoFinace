/**
 * Dashboard - Página Principal
 * Refatorado com skeleton loading e utilitários centralizados
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/utils/currency';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { PieChart, LineChart } from '../components/charts';
import { TransactionList } from '../components/TransactionList';
import { BudgetSummary } from '../components/BudgetSummary';
import { Transaction } from '@/types';
import { DashboardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, init, loading } = useAppStore();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Inicializar dados do app store
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
  const stats = useMemo(() => {
    const totalBalance = data.transactions.reduce(
      (sum: number, tx: Transaction) =>
        tx.type === 'income' ? sum + tx.amount : sum - tx.amount,
      0
    );

    const now = new Date();
    const monthlyTransactions = data.transactions.filter((tx: Transaction) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });

    const monthlyIncome = monthlyTransactions
      .filter((tx: Transaction) => tx.type === 'income')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter((tx: Transaction) => tx.type === 'expense')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyTransactions,
    };
  }, [data.transactions]);

  const pieChartData = useMemo(() => {
    return stats.monthlyTransactions
      .filter((tx: Transaction) => tx.type === 'expense')
      .reduce((acc: Record<string, number>, tx: Transaction) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [stats.monthlyTransactions]);

  const lineChartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthTransactions = data.transactions.filter((tx: Transaction) => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
      });
      const income = monthTransactions
        .filter((tx: Transaction) => tx.type === 'income')
        .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
      const expense = monthTransactions
        .filter((tx: Transaction) => tx.type === 'expense')
        .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
      return {
        month: date.toLocaleString('pt-BR', { month: 'short' }),
        income,
        expense,
      };
    }).reverse();
  }, [data.transactions]);

  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const isLoading = loading || !hasInitialized;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Olá, {user?.name}</h1>
        <p className="text-muted-foreground">
          Aqui está o resumo das suas finanças para {currentMonth}.
        </p>
      </div>

      {/* Stats Cards */}
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
            title="Saldo Total"
            value={formatCurrency(stats.totalBalance)}
            icon={Wallet}
            color="text-blue-500"
          />
          <StatCard
            title="Receitas do Mês"
            value={formatCurrency(stats.monthlyIncome)}
            icon={TrendingUp}
            color="text-green-500"
          />
          <StatCard
            title="Despesas do Mês"
            value={formatCurrency(stats.monthlyExpense)}
            icon={TrendingDown}
            color="text-orange-500"
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
            <PieChart data={pieChartData} />
          )}
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
          {isLoading ? (
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          ) : (
            <LineChart data={lineChartData} />
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transações Recentes</h3>
          <a
            href="/transactions"
            className="text-sm text-primary hover:underline"
          >
            Ver todas
          </a>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-border">
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
        ) : (
          <TransactionList
            transactions={data.transactions.slice(0, 5)}
            showActions={false}
          />
        )}
      </div>

      {/* Budget Summary */}
      {data.budgets.length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Orçamentos</h3>
            <a
              href="/budgets"
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </a>
          </div>
          <BudgetSummary budgets={data.budgets} transactions={data.transactions} />
        </div>
      )}
    </div>
  );
}

// Componente StatCard
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
