import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { PieChart, LineChart } from '@/components/charts';
import { formatCurrency } from '@/utils/currency';

export default function Reports() {
  const { user } = useAuthStore();
  const { data, init } = useAppStore();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      init(user.id);
    }
  }, [user, init]);

  // Filter transactions by selected year and month
  const filteredTransactions = data.transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const matchesYear = txDate.getFullYear() === currentYear;
    const matchesMonth = selectedMonth !== null ? txDate.getMonth() === selectedMonth : true;
    return matchesYear && matchesMonth;
  });

  // Calculate stats
  const totalIncome = filteredTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filteredTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netIncome = totalIncome - totalExpense;

  // Prepare data for charts
  const expenseByCategory = filteredTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthTransactions = data.transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === i;
    });

    const income = monthTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expense = monthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      month: new Date(currentYear, i).toLocaleString('pt-BR', { month: 'short' }),
      income,
      expense,
    };
  });

  // Generate year range for select
  const yearRange = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada das suas finanças</p>
        </div>
        <div className="flex gap-3">
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {yearRange.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth ?? 'all'}
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? null : parseInt(e.target.value))}
            className="px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todo Ano</option>
            <option value={0}>Janeiro</option>
            <option value={1}>Fevereiro</option>
            <option value={2}>Março</option>
            <option value={3}>Abril</option>
            <option value={4}>Maio</option>
            <option value={5}>Junho</option>
            <option value={6}>Julho</option>
            <option value={7}>Agosto</option>
            <option value={8}>Setembro</option>
            <option value={9}>Outubro</option>
            <option value={10}>Novembro</option>
            <option value={11}>Dezembro</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Total de Receitas</p>
          <p className="text-3xl font-bold mt-2 text-green-500">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Total de Despesas</p>
          <p className="text-3xl font-bold mt-2 text-orange-500">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">Saldo Líquido</p>
          <p className={`text-3xl font-bold mt-2 ${netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(netIncome)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
          <PieChart data={expenseByCategory} />
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
          <LineChart data={monthlyData} />
        </div>
      </div>

      {/* Detailed Transactions */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-4">Transações Detalhadas</h3>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            <p>Nenhuma transação encontrada para o período selecionado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  tx.type === 'income'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-orange-500/10 border-orange-500/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-xl">
                    {getCategoryIcon(tx.category)}
                  </div>
                  
                  <div>
                    <p className="font-medium">{tx.desc}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-orange-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{' '}{formatCurrency(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ICONS: Record<string, string> = {
  'Alimentação': '🍔', 'Restaurante': '🍽️', 'Mercado': '🛒', 'Feira': '🥦',
  'Casa': '🏠', 'Moradia': '🏡', 'Aluguel': '🔑', 'Condomínio': 'building',
  'Transporte': '🚗', 'Combustível': '⛽', 'Uber': '🚖', 'Ônibus': '🚌',
  'Lazer': '🎉', 'Cinema': '🍿', 'Jogos': '🎮', 'Séries': '📺',
  'Saúde': '💊', 'Farmácia': '🏥', 'Médico': '👨‍⚕', 'Academia': '💪',
  'Educação': '📚', 'Curso': '🎓', 'Livros': '📖',
  'Viagem': '✈️', 'Hotel': '🏨',
  'Salário': '💰', 'Investimentos': '📈', 'Poupança': '🐷',
  'Outros': '📦'
};

function getCategoryIcon(category: string): string {
  const normalizedCategory = category.toLowerCase();
  
  const directMatch = Object.keys(ICONS).find(key => 
    key.toLowerCase() === normalizedCategory
  );
  if (directMatch) return ICONS[directMatch];

  const keywordMatch = Object.keys(ICONS).find(key => 
    normalizedCategory.includes(key.toLowerCase())
  );
  if (keywordMatch) return ICONS[keywordMatch];

  return '📦';
}
