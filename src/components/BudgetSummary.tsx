import { Budget, Transaction } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface BudgetSummaryProps {
  budgets: Budget[];
  transactions: Transaction[];
}

export function BudgetSummary({ budgets, transactions }: BudgetSummaryProps) {
  // Calculate current month transactions
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const budgetStatus = budgets.map(budget => {
    const spent = monthlyTransactions
      .filter(tx => tx.type === 'expense' && tx.category === budget.category)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const percent = Math.min((spent / budget.limit) * 100, 100);
    let color = 'bg-green-500';

    if (percent > 80) color = 'bg-orange-500';
    if (percent >= 100) color = 'bg-red-500';

    return {
      ...budget,
      spent,
      percent,
      color
    };
  });

  // Debug information
  console.log('BudgetStatus:', budgetStatus);
  console.log('Transactions:', monthlyTransactions);

  return (
    <div className="space-y-6">
      {budgetStatus.map((budget) => (
        <div key={budget.category} className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">{budget.category}</span>
            <span className="text-muted-foreground">
              {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
            </span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-in-out ${budget.color}`}
              style={{ 
                width: `${budget.percent}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {budget.percent.toFixed(0)}% utilizado
            </span>
            <span>
              {formatCurrency(budget.limit - budget.spent)} restante
            </span>
          </div>
        </div>
      ))}
      
      {/* Empty state */}
      {budgetStatus.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nenhum orçamento cadastrado para este mês</p>
        </div>
      )}
    </div>
  );
}
