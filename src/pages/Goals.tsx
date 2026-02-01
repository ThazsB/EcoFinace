import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/utils/currency';

export default function Goals() {
  const { user } = useAuthStore();
  const { data, init, addGoal, deleteGoal, addGoalValue } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddValueModalOpen, setIsAddValueModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: '',
  });
  const [goalValue, setGoalValue] = useState('');

  useEffect(() => {
    if (user) {
      init(user.id);
    }
  }, [user, init]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.name.trim()) {
      alert('Por favor, digite um nome para a meta');
      return;
    }

    const target = parseFloat(newGoal.target);
    if (isNaN(target) || target <= 0) {
      alert('Por favor, digite um valor alvo válido');
      return;
    }

    addGoal({
      name: newGoal.name.trim(),
      target,
    });

    setNewGoal({
      name: '',
      target: '',
    });

    setIsModalOpen(false);
  };

  const handleAddValueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGoalId) {
      alert('Selecione uma meta');
      return;
    }

    const value = parseFloat(goalValue);
    if (isNaN(value) || value <= 0) {
      alert('Por favor, digite um valor válido');
      return;
    }

    addGoalValue(selectedGoalId, value);
    setGoalValue('');
    setSelectedGoalId(null);
    setIsAddValueModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      deleteGoal(id);
    }
  };

  const handleAddValue = (id: number) => {
    setSelectedGoalId(id);
    setIsAddValueModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-muted-foreground">Defina e alcance suas metas financeiras</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Nova Meta
        </button>
      </div>

      {/* Goals Grid */}
      {data.goals.length === 0 ? (
        <div className="bg-card p-8 rounded-lg border border-border text-center">
          <p className="text-muted-foreground mb-4">Nenhuma meta cadastrada</p>
          <p className="text-sm mb-6">Crie uma meta para começar a salvar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.goals.map((goal) => {
            const percentage = Math.min((goal.current / goal.target) * 100, 100);
            let color = 'bg-green-500';

            if (percentage > 80) color = 'bg-orange-500';
            if (percentage >= 100) color = 'bg-red-500';

            return (
              <div
                key={goal.id}
                className="bg-card p-6 rounded-lg border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{goal.name}</h3>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Excluir meta"
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

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Atual:</span>
                    <span className="font-medium">{formatCurrency(goal.current)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alvo:</span>
                    <span className="font-medium">{formatCurrency(goal.target)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Faltante:</span>
                    <span className="font-medium">{formatCurrency(goal.target - goal.current)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAddValue(goal.id)}
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Adicionar Valor
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Nova Meta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Meta</label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Viagem para Europa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor Alvo</label>
                <input
                  type="number"
                  step="0.01"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
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

      {/* Add Value Modal */}
      {isAddValueModalOpen && selectedGoalId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Adicionar Valor à Meta</h2>
            
            <form onSubmit={handleAddValueSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={goalValue}
                  onChange={(e) => setGoalValue(e.target.value)}
                  className="w-full px-4 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddValueModalOpen(false);
                    setSelectedGoalId(null);
                    setGoalValue('');
                  }}
                  className="flex-1 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
