import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { BudgetSummary } from '@/components/BudgetSummary';
import { formatCurrency } from '@/utils/currency';
import { DEFAULT_CATEGORIES, Transaction, Budget } from '@/types';

export default function Budgets() {
  const { user } = useAuthStore();
  const { data, init, addBudget, deleteBudget, updateBudget } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [predictiveData, setPredictiveData] = useState<Array<{ category: string; projectedTotal: number; willExceed: boolean; daysRemaining: number }>>([]);
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit: '',
  });
  const [editBudget, setEditBudget] = useState({
    category: '',
    limit: '',
  });

  useEffect(() => {
    if (user) {
      init(user.id);
    }
  }, [user, init]);

  // Calculate predictive alerts
  useEffect(() => {
    if (data.transactions.length > 0 && data.budgets.length > 0) {
      // Calculate projected spending
      const now = new Date();
      const currentMonthTransactions = data.transactions.filter((tx: Transaction) => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      });
      
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = daysInMonth - now.getDate();
      const daysPassed = now.getDate();
      
      const predictions = data.budgets.map((budget: Budget) => {
        const currentSpent = currentMonthTransactions
          .filter((tx: Transaction) => tx.type === 'expense' && tx.category === budget.category)
          .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
        
        const dailyAverage = daysPassed > 0 ? currentSpent / daysPassed : 0;
        const projectedTotal = currentSpent + (dailyAverage * daysRemaining);
        
        return {
          category: budget.category,
          projectedTotal,
          willExceed: projectedTotal > budget.limit,
          daysRemaining,
        };
      });
      
      setPredictiveData(predictions);
    }
  }, [data.transactions, data.budgets, init]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBudget.category) {
      alert('Por favor, selecione uma categoria');
      return;
    }

    const limit = parseFloat(newBudget.limit);
    if (isNaN(limit) || limit <= 0) {
      alert('Por favor, digite um limite válido');
      return;
    }

    // Check if budget for this category already exists
    const existingBudget = data.budgets.find((b: Budget) => b.category === newBudget.category);
    if (existingBudget) {
      alert('Já existe um orçamento para essa categoria');
      return;
    }

    addBudget({
      category: newBudget.category,
      limit,
    });

    setNewBudget({
      category: '',
      limit: '',
    });

    setIsModalOpen(false);
  };

  const handleEdit = (budget: any) => {
    setEditBudget({
      category: budget.category,
      limit: budget.limit.toString(),
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const limit = parseFloat(editBudget.limit);
    if (isNaN(limit) || limit <= 0) {
      alert('Por favor, digite um limite válido');
      return;
    }

    updateBudget(editBudget.category, {
      ...editBudget,
      limit,
      profileId: localStorage.getItem('ecofinance_active_profile') || '',
    });

    setIsEditModalOpen(false);
  };

  const handleDelete = (category: string) => {
    if (confirm(`Tem certeza que deseja excluir o orçamento para ${category}?`)) {
      deleteBudget(category);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">Gerencie seus gastos mensais</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Novo Orçamento
        </button>
      </div>

      {/* Budget Summary */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <BudgetSummary budgets={data.budgets} transactions={data.transactions} />
      </div>

      {/* Predictive Alerts Section */}
      {predictiveData.some(p => p.willExceed) && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="font-semibold text-amber-500">Previsão de Estouro</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Com base nos seus gastos atuais, estas categorias devem ultrapassar o orçamento:
          </p>
          <div className="space-y-2">
            {predictiveData
              .filter(p => p.willExceed)
              .map(prediction => {
                const budget = data.budgets.find((b: Budget) => b.category === prediction.category);
                return (
                  <div key={prediction.category} className="flex items-center justify-between p-2 bg-card/50 rounded">
                    <span className="text-sm font-medium">{prediction.category}</span>
                    <span className="text-sm text-red-400">
                      Projeção: {formatCurrency(prediction.projectedTotal)}
                      <span className="text-muted-foreground ml-2">
                        (limite: {formatCurrency(budget?.limit || 0)})
                      </span>
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">Orçamentos</h2>
        
        {data.budgets.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            <p>Nenhum orçamento cadastrado</p>
            <p className="text-sm mt-2">Crie um orçamento para começar a controlar seus gastos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.budgets.map((budget: Budget) => (
              <div
                key={budget.category}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div>
                  <p className="font-medium">{budget.category}</p>
                  <p className="text-sm text-muted-foreground">
                    Limite: {formatCurrency(budget.limit)}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors"
                    title="Editar orçamento"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(budget.category)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Excluir orçamento"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Novo Orçamento</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  {DEFAULT_CATEGORIES.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  {data.categories.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Limite Mensal</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
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

      {/* Edit Budget Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Editar Orçamento</h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <input
                  type="text"
                  value={editBudget.category}
                  disabled
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Limite Mensal</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBudget.limit}
                  onChange={(e) => setEditBudget({ ...editBudget, limit: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
