import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { useNotificationEngine } from '@/engine/notification-engine';
import { TransactionList } from '@/components/TransactionList';
import { useTransactionToast } from '@/components/notifications';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DEFAULT_CATEGORIES, Transaction, Budget } from '@/types';
import { TrendingDown, TrendingUp, ChevronDown, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { TransactionListSkeleton } from '@/components/ui/Skeleton';
import { CATEGORY_ICONS as LUCIDE_ICONS_ARRAY } from '@/types/categories';
import { CATEGORY_ICON_MAP } from '@/utils/categoryIcons';

// Manter compatibilidade: CATEGORY_ICONS é o array de objetos com component, id, color, name
const CATEGORY_ICONS = LUCIDE_ICONS_ARRAY;

interface BudgetStatus {
  category: string;
  spent: number;
  limit: number;
}

export default function Transactions() {
  const { user } = useAuthStore();
  const { 
    data, 
    init, 
    deleteTransaction, 
    addTransaction, 
    loading, 
    addFixedExpense, 
    updateFixedExpense, 
    deleteFixedExpense, 
    toggleFixedExpenseActive,
    getActiveFixedExpenses
  } = useAppStore();
  const { categories: storeCategories } = useCategoriesStore();
  const { checkBudgetAlerts } = useNotificationEngine();
  const { showTransactionSuccess, showTransactionError, showTransactionDelete } = useTransactionToast();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFixedExpenseModalOpen, setIsFixedExpenseModalOpen] = useState(false);
  const [editingFixedExpense, setEditingFixedExpense] = useState<any | null>(null);
  const [spendingPatterns, setSpendingPatterns] = useState<Array<{ category: string; average: number; trend: 'up' | 'down' | 'stable' }>>([]);
  const [showPatterns, setShowPatterns] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    desc: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [fixedExpenseFormData, setFixedExpenseFormData] = useState({
    name: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    active: true,
    dayOfMonth: 1 // Valor padrão: 1º dia do mês
  });
  const [showFixedExpenseCategoryDropdown, setShowFixedExpenseCategoryDropdown] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    transaction: null,
    isDeleting: false,
  });

  // Fixed Expenses management
  const handleOpenCreateFixedExpense = () => {
    setEditingFixedExpense(null);
    setFixedExpenseFormData({
      name: '',
      amount: '',
      type: 'expense',
      category: '',
      active: true,
      dayOfMonth: 1
    });
    setIsFixedExpenseModalOpen(true);
  };

  const handleOpenEditFixedExpense = (expense: any) => {
    setEditingFixedExpense(expense);
    setFixedExpenseFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      type: expense.type,
      category: expense.category,
      active: expense.active,
      dayOfMonth: expense.dayOfMonth || 1
    });
    setIsFixedExpenseModalOpen(true);
  };

  const handleSubmitFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fixedExpenseFormData.name.trim()) {
      alert('Por favor, digite um nome');
      return;
    }

    const amount = parseFloat(fixedExpenseFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, digite um valor válido');
      return;
    }

    if (!fixedExpenseFormData.category) {
      alert('Por favor, selecione uma categoria');
      return;
    }

    const expenseData = {
      name: fixedExpenseFormData.name.trim(),
      amount,
      type: fixedExpenseFormData.type,
      category: fixedExpenseFormData.category,
      active: fixedExpenseFormData.active,
      dayOfMonth: fixedExpenseFormData.dayOfMonth
    };

    try {
      if (editingFixedExpense) {
        await updateFixedExpense(editingFixedExpense.id, expenseData);
      } else {
        await addFixedExpense(expenseData);
      }
      setIsFixedExpenseModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar valor fixo:', error);
      alert('Ocorreu um erro ao salvar');
    }
  };

  const handleDeleteFixedExpense = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este valor fixo?')) {
      return;
    }

    try {
      await deleteFixedExpense(id);
    } catch (error) {
      console.error('Erro ao excluir valor fixo:', error);
      alert('Ocorreu um erro ao excluir');
    }
  };

  const toggleActiveFixedExpense = async (id: number) => {
    try {
      await toggleFixedExpenseActive(id);
    } catch (error) {
      console.error('Erro ao toggle active:', error);
      alert('Ocorreu um erro');
    }
  };

  // Calculate budget statuses for notifications
  const getBudgetStatuses = useCallback((): BudgetStatus[] => {
    const now = new Date();
    const currentMonthTransactions = data.transactions.filter((tx: Transaction) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });

    return data.budgets.map((budget: Budget) => {
      const currentSpent = currentMonthTransactions
        .filter((tx: Transaction) => tx.type === 'expense' && tx.category === budget.category)
        .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

      return {
        category: budget.category,
        spent: currentSpent,
        limit: budget.limit,
      };
    });
  }, [data.transactions, data.budgets]);

  useEffect(() => {
    const initialize = async () => {
      if (user) {
        await init(user.id);
        setHasInitialized(true);
      }
    };
    
    initialize();
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

  const combinedCategories = useMemo(() => {
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...data.categories]));
    return merged.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [data.categories]);

  // Função para obter ícone da categoria (wrapper para compatibilidade)
  const getCategoryIconComponent = (categoryName: string) => {
    const normalizedCategory = categoryName.toLowerCase();
    
    // Primeiro, buscar a categoria no store para obter o ícone customizado
    const categoryFromStore = storeCategories.find(cat => cat.name.toLowerCase() === normalizedCategory);
    if (categoryFromStore && categoryFromStore.icon) {
      const iconData = CATEGORY_ICONS.find((icon: { id: string }) => icon.id === categoryFromStore.icon);
      if (iconData) return iconData;
    }

    // Fallback: usar mapeamento centralizado de categoryIcons.ts
    const iconId = CATEGORY_ICON_MAP[categoryName];
    if (iconId) {
      const iconData = CATEGORY_ICONS.find((icon: { id: string }) => icon.id === iconId);
      if (iconData) return iconData;
    }

    // Fallback: buscar por palavra-chave
    for (const [categoryKey, id] of Object.entries(CATEGORY_ICON_MAP)) {
      if (normalizedCategory.includes(categoryKey.toLowerCase()) || categoryKey.toLowerCase().includes(normalizedCategory)) {
        const iconData = CATEGORY_ICONS.find((icon: { id: string }) => icon.id === id);
        if (iconData) return iconData;
      }
    }

    return CATEGORY_ICONS[CATEGORY_ICONS.length - 1]; // fallback para "Mais"
  };

  // Mapeamento de cores para cada categoria
  const categoryColorMap: Record<string, string> = {
    // Receitas
    'Salário': '#22C55E',
    'Investimentos': '#14B8A6',
    'Freelance': '#06B6D4',
    'Renda Extra': '#10B981',
    'Dividendos': '#3B82F6',
    'Aposentadoria': '#8B5CF6',
    'Presente': '#EC4899',

    // Despesas - Alimentação
    'Alimentação': '#F97316',
    'Restaurante': '#F97316',
    'Mercado': '#F97316',
    'Feira': '#F97316',
    'Lanchonete': '#F97316',
    'Café': '#F97316',
    'Bebidas': '#F97316',
    'Delivery': '#F97316',

    // Despesas - Moradia
    'Moradia': '#EF4444',
    'Aluguel': '#EF4444',
    'Condomínio': '#EF4444',
    'IPTU': '#EF4444',
    'Energia': '#EF4444',
    'Água': '#EF4444',
    'Gás': '#EF4444',
    'Internet': '#EF4444',
    'Telefone': '#EF4444',
    'TV a Cabo': '#EF4444',
    'Manutenção': '#EF4444',

    // Despesas - Transporte
    'Transporte': '#6366F1',
    'Combustível': '#6366F1',
    'Uber': '#6366F1',
    'Ônibus': '#6366F1',
    'Metrô': '#6366F1',
    'Táxi': '#6366F1',
    'Estacionamento': '#6366F1',
    'Pedágio': '#6366F1',

    // Despesas - Lazer
    'Lazer': '#A855F7',
    'Cinema': '#A855F7',
    'Jogos': '#A855F7',
    'Séries': '#A855F7',
    'Música': '#A855F7',
    'Livros': '#A855F7',
    'Viagem': '#06B6D4',
    'Hotel': '#06B6D4',
    'Ingressos': '#A855F7',
    'Parque': '#A855F7',
    'Bar': '#A855F7',
    'Festa': '#A855F7',

    // Despesas - Saúde
    'Saúde': '#EC4899',
    'Farmácia': '#EC4899',
    'Médico': '#EC4899',
    'Dentista': '#EC4899',
    'Academia': '#EC4899',
    'Exames': '#EC4899',
    'Plano de Saúde': '#EC4899',
    'Veterinário': '#EC4899',

    // Despesas - Educação
    'Educação': '#3B82F6',
    'Curso': '#3B82F6',
    'Escola': '#3B82F6',
    'Universidade': '#3B82F6',
    'Material Escolar': '#3B82F6',
    'Curso Online': '#3B82F6',
    'Workshop': '#3B82F6',

    // Despesas - Pessoal
    'Compras': '#F59E0B',
    'Roupas': '#F59E0B',
    'Calçados': '#F59E0B',
    'Beleza': '#F59E0B',
    'Cabeleireiro': '#F59E0B',
    'Presentes': '#EC4899',
    'Animais': '#10B981',
    'Eletrônicos': '#8B5CF6',
    'Criança': '#F59E0B',
    'Cartão': '#3B82F6',
    'Outros': '#6B7280',
  };

  // Função para obter cor da categoria (usa a versão importada de categoryIcons.ts)
  const getCategoryColor = (categoryName: string): string => {
    // Primeiro, buscar a categoria no store para obter a cor customizada
    const categoryFromStore = storeCategories.find(cat => cat.name === categoryName);
    if (categoryFromStore) {
      return categoryFromStore.color;
    }

    // Fallback para o mapeamento centralizado
    return categoryColorMap[categoryName] || '#6B7280';
  };

  // Mostrar skeleton enquanto carrega ou se não inicializou
  if (loading || !hasInitialized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
        <TransactionListSkeleton count={5} />
      </div>
    );
  }

  const filteredTransactions = data.transactions.filter((tx: Transaction) => {
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
    }).then(() => {
      // Mostrar toast de sucesso
      showTransactionSuccess({ type: newTransaction.type, action: 'add', description: newTransaction.desc.trim(), amount });
      
      // Check budget alerts after adding transaction
      if (newTransaction.type === 'expense' && data.budgets.length > 0) {
        const budgetStatuses = getBudgetStatuses();
        checkBudgetAlerts(budgetStatuses);
      }
    }).catch((error) => {
      // Mostrar toast de erro com retry
      showTransactionError({ type: newTransaction.type, description: newTransaction.desc.trim(), amount, error: 'BRL' });
      console.error('Erro ao adicionar transação:', error);
    });

    setNewTransaction({
      desc: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
    });

    setIsModalOpen(false);
    setShowCategoryDropdown(false);
  };

  // Open confirm dialog for deletion
  const handleDeleteRequest = (id: number) => {
    const txToDelete = data.transactions.find((tx: Transaction) => tx.id === id);
    if (txToDelete) {
      setConfirmDialog({
        isOpen: true,
        transaction: txToDelete,
        isDeleting: false,
      });
    }
  };

  // Confirm deletion
  const handleConfirmDelete = () => {
    if (confirmDialog.transaction) {
      setConfirmDialog(prev => ({ ...prev, isDeleting: true }));
      
      showTransactionDelete({ type: confirmDialog.transaction.type, description: confirmDialog.transaction.desc, amount: confirmDialog.transaction.amount });
      deleteTransaction(confirmDialog.transaction.id);
      
      setConfirmDialog({
        isOpen: false,
        transaction: null,
        isDeleting: false,
      });
    }
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setConfirmDialog({
      isOpen: false,
      transaction: null,
      isDeleting: false,
    });
  };

  // Format transaction details for dialog
  const getTransactionDetails = (tx: Transaction) => {
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(tx.amount);
    
    return [
      {
        label: 'Descrição',
        value: tx.desc,
        icon: tx.type === 'expense' 
          ? <TrendingDown className="w-4 h-4 text-red-500" />
          : <TrendingUp className="w-4 h-4 text-green-500" />,
      },
      {
        label: 'Valor',
        value: formattedAmount,
      },
      {
        label: 'Categoria',
        value: tx.category,
      },
      {
        label: 'Data',
        value: (() => {
                const date = new Date(tx.date);
                date.setTime(date.getTime() + date.getTimezoneOffset() * 60000);
                return date.toLocaleDateString('pt-BR');
              })(),
      },
    ];
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Transações</h1>

      {/* Filters - Moved to top for better alignment */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column - Transactions */}
        <div className="space-y-6">
          {/* Header with Nova Transacao button */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Transações</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Nova Transação
            </button>
          </div>

          {/* Transaction List */}
          <TransactionList
            transactions={sortedTransactions}
            onDelete={handleDeleteRequest}
            showActions={true}
          />
        </div>

        {/* Right Column - Fixed Expenses */}
        <div className="space-y-6">
          {/* Fixed Expenses Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Valores Fixos</h2>
              </div>
              <button
                onClick={handleOpenCreateFixedExpense}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                Novo Valor Fixo
              </button>
            </div>

            {data.fixedExpenses.length === 0 ? (
              <div className="text-center py-8 bg-card rounded-lg border border-border">
                <p className="text-sm font-medium text-foreground">Nenhum valor fixo cadastrado</p>
                <p className="text-xs text-muted-foreground mt-1">Adicione valores repetitivos como salário ou gastos mensais</p>
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Dia
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {data.fixedExpenses.map((expense: any) => (
                        <tr key={expense.id} className="hover:bg-muted/50">
<td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="text-sm font-medium text-foreground">{expense.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className={`text-sm font-medium ${
                              expense.type === 'income' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {expense.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(expense.amount)}
                            </div>
                          </td>
<td className="px-4 py-3 whitespace-nowrap text-center text-sm text-muted-foreground">
                            {expense.dayOfMonth}º
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleActiveFixedExpense(expense.id)}
                              className="inline-flex items-center gap-1"
                            >
                              {expense.active ? (
                              <ToggleRight className="w-6 h-6 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                              )}
                            </button>
                          </td>
<td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium space-x-1">
                            <button
                              onClick={() => handleOpenEditFixedExpense(expense)}
                              className="text-primary hover:text-primary/80 p-1 hover:bg-primary/10 rounded"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteFixedExpense(expense.id)}
                              className="text-red-500 hover:text-red-600 p-1 hover:bg-red-500/10 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left flex items-center justify-between hover:bg-muted/80 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {newTransaction.category ? (
                        <>
                          {(() => {
                            const iconData = getCategoryIconComponent(newTransaction.category);
                            const IconComponent = iconData.component;
                            const color = getCategoryColor(newTransaction.category);
                            return <IconComponent size={18} style={{ color }} />;
                          })()}
                          <span>{newTransaction.category}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground"></span>
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {combinedCategories.map((category: string) => {
                        const iconData = getCategoryIconComponent(category);
                        const IconComponent = iconData.component;
                        const color = getCategoryColor(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setNewTransaction({ ...newTransaction, category });
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-muted transition-colors ${
                              newTransaction.category === category ? 'bg-primary/10 border-l-2 border-primary' : ''
                            }`}
                          >
                            <IconComponent size={18} style={{ color }} />
                            <span>{category}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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

      {/* Fixed Expense Modal */}
      {isFixedExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              {editingFixedExpense ? 'Editar Valor Fixo' : 'Novo Valor Fixo'}
            </h3>
            <form onSubmit={handleSubmitFixedExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                <input
                  type="text"
                  value={fixedExpenseFormData.name}
                  onChange={(e) => setFixedExpenseFormData({ ...fixedExpenseFormData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Salário, Aluguel, Internet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={fixedExpenseFormData.amount}
                  onChange={(e) => setFixedExpenseFormData({ ...fixedExpenseFormData, amount: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                <select
                  value={fixedExpenseFormData.type}
                  onChange={(e) => setFixedExpenseFormData({ ...fixedExpenseFormData, type: e.target.value as 'income' | 'expense' })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFixedExpenseCategoryDropdown(!showFixedExpenseCategoryDropdown)}
                    className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left flex items-center justify-between hover:bg-muted/80 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {fixedExpenseFormData.category ? (
                        <>
                          {(() => {
                            const iconData = getCategoryIconComponent(fixedExpenseFormData.category);
                            const IconComponent = iconData.component;
                            const color = getCategoryColor(fixedExpenseFormData.category);
                            return <IconComponent size={18} style={{ color }} />;
                          })()}
                          <span>{fixedExpenseFormData.category}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground"></span>
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFixedExpenseCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showFixedExpenseCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {combinedCategories.map((category: string) => {
                        const iconData = getCategoryIconComponent(category);
                        const IconComponent = iconData.component;
                        const color = getCategoryColor(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setFixedExpenseFormData({ ...fixedExpenseFormData, category });
                              setShowFixedExpenseCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-muted transition-colors ${
                              fixedExpenseFormData.category === category ? 'bg-primary/10 border-l-2 border-primary' : ''
                            }`}
                          >
                            <IconComponent size={18} style={{ color }} />
                            <span>{category}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Dia do Mês</label>
                  <select
                    value={fixedExpenseFormData.dayOfMonth}
                    onChange={(e) => setFixedExpenseFormData({ ...fixedExpenseFormData, dayOfMonth: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}º</option>
                    ))}
                    <option value={29}>29º</option>
                    <option value={30}>30º</option>
                    <option value={31}>31º</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fixedExpenseActive"
                      checked={fixedExpenseFormData.active}
                      onChange={(e) => setFixedExpenseFormData({ ...fixedExpenseFormData, active: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="fixedExpenseActive" className="text-sm text-foreground">Ativo</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFixedExpenseModalOpen(false)}
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

      {/* Delete Confirmation Dialog */}
      {confirmDialog.transaction && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title="Excluir Transação"
          message={`Tem certeza que deseja excluir esta ${confirmDialog.transaction.type === 'expense' ? 'despesa' : 'receita'}?`}
          type="transaction"
          details={getTransactionDetails(confirmDialog.transaction)}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={confirmDialog.isDeleting}
        />
      )}
    </div>
  );
}
