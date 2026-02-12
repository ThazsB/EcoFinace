/**
 * Dashboard - Página Principal
 * Refatorado com skeleton loading e utilitários centralizados
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/utils/currency';
import { PieChart, LineChart } from '../components/charts';
import { TransactionList } from '../components/TransactionList';
import { BudgetSummary } from '../components/BudgetSummary';
import { Transaction } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useToast } from '@/components/notifications/ToastContainer';
import { checkToastDuplicate } from '@/services/deduplicationService';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, init, loading, getActiveFixedExpenses } = useAppStore();
  const [hasInitialized, setHasInitialized] = useState(false);
  const { showToast } = useToast();

  // Inicializar dados do app store
  useEffect(() => {
    const initialize = async () => {
      if (user && !hasInitialized) {
        // Toast de carregamento SEMPRE é mostrado (feedback importante para o usuário)
        showToast({
          title: 'Carregando dados',
          message: 'Preparando seu painel financeiro...',
          type: 'info',
        });

        await init(user.id);
        setHasInitialized(true);

        // Toast de conclusão sempre é mostrado - não verificar duplicidade
        showToast({
          title: 'Dados carregados',
          message: 'Seu painel está pronto!',
          type: 'success',
          duration: 4000,
        });
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, init]);

  // Todos os hooks devem ser chamados sempre na mesma ordem
  const stats = useMemo(() => {
    // Calcular saldo total das transações
    const totalBalanceFromTransactions = data.transactions.reduce(
      (sum: number, tx: Transaction) => (tx.type === 'income' ? sum + tx.amount : sum - tx.amount),
      0
    );

    // Calcular valores fixos ativos
    const activeFixedExpenses = getActiveFixedExpenses();
    const monthlyFixedIncome = activeFixedExpenses
      .filter((expense: any) => expense.type === 'income')
      .reduce((sum: number, expense: any) => sum + expense.amount, 0);

    const monthlyFixedExpense = activeFixedExpenses
      .filter((expense: any) => expense.type === 'expense')
      .reduce((sum: number, expense: any) => sum + expense.amount, 0);

    const totalBalance = totalBalanceFromTransactions + monthlyFixedIncome - monthlyFixedExpense;

    const now = new Date();
    const monthlyTransactions = data.transactions.filter((tx: Transaction) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });

    const monthlyIncomeFromTransactions = monthlyTransactions
      .filter((tx: Transaction) => tx.type === 'income')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

    const monthlyExpenseFromTransactions = monthlyTransactions
      .filter((tx: Transaction) => tx.type === 'expense')
      .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

    const monthlyIncome = monthlyIncomeFromTransactions + monthlyFixedIncome;
    const monthlyExpense = monthlyExpenseFromTransactions + monthlyFixedExpense;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyTransactions,
      incomeFromTransactions: monthlyIncomeFromTransactions,
      expenseFromTransactions: monthlyExpenseFromTransactions,
      monthlyFixedIncome,
      monthlyFixedExpense,
    };
  }, [data.transactions, data.fixedExpenses, getActiveFixedExpenses]);

  const pieChartData = useMemo(() => {
    return stats.monthlyTransactions
      .filter((tx: Transaction) => tx.type === 'expense')
      .reduce(
        (acc: Record<string, number>, tx: Transaction) => {
          acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
          return acc;
        },
        {} as Record<string, number>
      );
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

  // Notificações inteligentes baseadas nos dados
  useEffect(() => {
    if (!hasInitialized || isLoading) return;

    const checkForInsights = () => {
      // Alert de orçamento excedido
      const budgets = data.budgets || [];
      budgets.forEach((budget) => {
        const spent = stats.monthlyTransactions
          .filter((tx) => tx.category === budget.category && tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0);

        const percentage = (spent / budget.limit) * 100;

        if (percentage >= 100) {
          const dupCheck = checkToastDuplicate(
            'Orçamento Excedido',
            `Você superou o orçamento de ${budget.category}`,
            'insight'
          );
          if (!dupCheck.isDuplicate) {
            showToast({
              title: 'Orçamento Excedido',
              message: `Você superou o orçamento de ${budget.category}`,
              type: 'warning',
            });
          }
        } else if (percentage >= 80) {
          const dupCheck = checkToastDuplicate(
            'Atenção ao Orçamento',
            `${budget.category} está em ${percentage.toFixed(0)}% do limite`,
            'insight'
          );
          if (!dupCheck.isDuplicate) {
            showToast({
              title: 'Atenção ao Orçamento',
              message: `${budget.category} está em ${percentage.toFixed(0)}% do limite`,
              type: 'info',
            });
          }
        }
      });

      // Alert de gastos incomuns
      if (stats.monthlyExpense > stats.monthlyIncome * 0.9) {
        const dupCheck = checkToastDuplicate(
          'Gastos Elevados',
          'Seus gastos estão próximos da sua renda este mês',
          'insight'
        );
        if (!dupCheck.isDuplicate) {
          showToast({
            title: 'Gastos Elevados',
            message: 'Seus gastos estão próximos da sua renda este mês',
            type: 'warning',
          });
        }
      }

      // Insight de economia
      if (stats.monthlyIncome - stats.monthlyExpense > 0) {
        const savingsAmount = stats.monthlyIncome - stats.monthlyExpense;
        const dupCheck = checkToastDuplicate(
          'Boa Economia!',
          `Você economizou ${formatCurrency(savingsAmount)} este mês`,
          'insight'
        );
        if (!dupCheck.isDuplicate) {
          showToast({
            title: 'Boa Economia!',
            message: `Você economizou ${formatCurrency(savingsAmount)} este mês`,
            type: 'success',
          });
        }
      }
    };

    // Executar verificação após um delay para não spammar
    const timer = setTimeout(checkForInsights, 2000);
    return () => clearTimeout(timer);
  }, [hasInitialized, isLoading, data.budgets, stats, showToast]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Olá, {user?.name}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Aqui está o resumo das suas finanças para {currentMonth}.
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card p-4 sm:p-6 rounded-lg border border-border">
              <Skeleton className="h-4 w-20 sm:w-24 mb-2" />
              <Skeleton className="h-7 w-28 sm:w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

        <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Evolução Mensal</h3>
          {isLoading ? (
            <div className="h-48 sm:h-64 bg-muted animate-pulse rounded-lg" />
          ) : (
            <LineChart data={lineChartData} />
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Transações Recentes</h3>
          <a href="/transactions" className="text-sm text-primary hover:underline">
            Ver todas
          </a>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 sm:p-4 border-b border-border"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28 sm:w-32" />
                    <Skeleton className="h-3 w-20 sm:w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 sm:h-6 sm:w-20" />
              </div>
            ))}
          </div>
        ) : (
          <TransactionList transactions={data.transactions.slice(0, 5)} showActions={false} />
        )}
      </div>

      {/* Budget Summary */}
      {data.budgets.length > 0 && (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Orçamentos</h3>
            <a href="/budgets" className="text-sm text-primary hover:underline">
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
    <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
        <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
      </div>
      <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{value}</p>
    </div>
  );
}
