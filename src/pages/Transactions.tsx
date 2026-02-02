import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { TransactionList } from '@/components/TransactionList';
import { DEFAULT_CATEGORIES } from '@/types';

export default function Transactions() {
  const { user } = useAuthStore();
  const { data, init, deleteTransaction, addTransaction } = useAppStore();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [spendingPatterns, setSpendingPatterns] = useState<Array<{ category: string; average: number; trend: 'up' | 'down' | 'stable' }>>([]);
  const [showPatterns, setShowPatterns] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    desc: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      init(user.id);
    }
  }, [user, init]);

  // Analyze spending patterns when transactions change
  useEffect(() => {
    if (data.transactions.length > 0) {
      const patterns = analyzeSpendingPatterns(data.transactions);
      setSpendingPatterns(patterns);
    }
  }, [data.transactions]);

  const analyzeSpendingPatterns = (transactions: any[]) => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    
    const recentTransactions = transactions.filter(tx => 
      new Date(tx.date) >= threeMonthsAgo && tx.type === 'expense'
    );
    
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    
    recentTransactions.forEach(tx => {
      if (!categoryTotals[tx.category]) {
        categoryTotals[tx.category] = { total: 0, count: 0 };
      }
      categoryTotals[tx.category].total += tx.amount;
      categoryTotals[tx.category].count += 1;
    });
    
    const currentMonthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });
    
    const currentMonthTotals: Record<string, number> = {};
    currentMonthTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
      currentMonthTotals[tx.category] = (currentMonthTotals[tx.category] || 0) + tx.amount;
    });
    
    return Object.entries(categoryTotals).map(([category, data]) => {
      const average = data.total / 3;
      const currentMonth = currentMonthTotals[category] || 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      
      if (currentMonth > average * 1.1) {
        trend = 'up';
      } else if (currentMonth < average * 0.9) {
        trend = 'down';
      }
      
      return { category, average, trend };
    });
  };

  const filteredTransactions = data.transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch = 
      tx.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTransaction.desc.trim()) {
      alert('Por favor, digite uma descrição');
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, digite um valor válido');
      return;
    }

    if (!newTransaction.category) {
      alert('Por favor, selecione uma categoria');
      return;
    }

    addTransaction({
      ...newTransaction,
      desc: newTransaction.desc.trim(),
      amount,
    });

    setNewTransaction({
      desc: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Nova Transação
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar transação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            className="px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
          
          <button
            onClick={() => setShowPatterns(!showPatterns)}
            className={`px-4 py-2 rounded-lg transition-colors ${showPatterns ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
          >
            Análise
          </button>
        </div>
      </div>

      {/* Spending Patterns Panel */}
      {showPatterns && spendingPatterns.length > 0 && (
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Padrões de Gastos (Últimos 3 meses)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {spendingPatterns.slice(0, 6).map(pattern => (
              <div 
                key={pattern.category}
                className={`p-3 rounded-lg border ${
                  pattern.trend === 'up' ? 'bg-red-500/10 border-red-500/30' : 
                  pattern.trend === 'down' ? 'bg-green-500/10 border-green-500/30' : 
                  'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{pattern.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    pattern.trend === 'up' ? 'bg-red-500/20 text-red-400' :
                    pattern.trend === 'down' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {pattern.trend === 'up' ? '↑ Crescendo' : pattern.trend === 'down' ? '↓ Diminuindo' : '→ Estável'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Média: R${pattern.average.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <TransactionList
        transactions={sortedTransactions}
        onDelete={handleDelete}
        showActions={true}
      />

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Nova Transação</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <input
                  type="text"
                  value={newTransaction.desc}
                  onChange={(e) => setNewTransaction({ ...newTransaction, desc: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Supermercado"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense' })}
                    className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  {DEFAULT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  {data.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
