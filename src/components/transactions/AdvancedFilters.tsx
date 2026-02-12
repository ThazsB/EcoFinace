import React, { useState, useCallback } from 'react';
import { Transaction, Category } from '@/types';
import { Calendar, Filter, X, ChevronDown } from 'lucide-react';

interface AdvancedFiltersProps {
  transactions: Transaction[];
  categories: Category[];
  onFilter: (filtered: Transaction[]) => void;
  onClose?: () => void;
}

type PeriodOption = '7d' | '30d' | '90d' | '1y' | 'custom';

export function AdvancedFilters({
  transactions,
  categories,
  onFilter,
  onClose,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodOption>('30d');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<('income' | 'expense')[]>([]);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const applyFilters = useCallback(() => {
    let filtered = [...transactions];

    // Filtro por período
    const now = new Date();
    let start: Date | null = null;

    switch (period) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          const end = new Date(endDate);
          filtered = filtered.filter((t) => {
            const date = new Date(t.date);
            return date >= start! && date <= end;
          });
        }
        break;
    }

    if (start && period !== 'custom') {
      filtered = filtered.filter((t) => new Date(t.date) >= start!);
    }

    // Filtro por categorias
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((t) => selectedCategories.includes(t.category));
    }

    // Filtro por tipo
    if (transactionTypes.length > 0) {
      filtered = filtered.filter((t) => transactionTypes.includes(t.type));
    }

    // Filtro por valor
    if (minAmount) {
      filtered = filtered.filter((t) => t.amount >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter((t) => t.amount <= parseFloat(maxAmount));
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) => t.desc.toLowerCase().includes(term) || t.category.toLowerCase().includes(term)
      );
    }

    onFilter(filtered);
  }, [
    transactions,
    period,
    selectedCategories,
    transactionTypes,
    minAmount,
    maxAmount,
    searchTerm,
    startDate,
    endDate,
    onFilter,
  ]);

  const resetFilters = () => {
    setPeriod('30d');
    setSelectedCategories([]);
    setTransactionTypes([]);
    setMinAmount('');
    setMaxAmount('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    onFilter(transactions);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleType = (type: 'income' | 'expense') => {
    setTransactionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const activeFiltersCount =
    (period !== '30d' ? 1 : 0) +
    selectedCategories.length +
    transactionTypes.length +
    (minAmount || maxAmount ? 1 : 0) +
    (searchTerm ? 1 : 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
          isOpen || activeFiltersCount > 0
            ? 'bg-primary/10 border-primary text-primary'
            : 'bg-card border-border hover:bg-muted'
        }`}
      >
        <Filter size={18} />
        <span className="text-sm font-medium">Filtros</span>
        {activeFiltersCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter size={16} />
                  Filtros Avançados
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X size={12} />
                    Limpar
                  </button>
                )}
              </div>

              {/* Busca */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Período */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Período
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['7d', '30d', '90d', '1y'] as PeriodOption[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        setShowCustomDate(false);
                      }}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        period === p && !showCustomDate
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted hover:bg-muted/80 border-transparent'
                      }`}
                    >
                      {p === '7d'
                        ? '7 dias'
                        : p === '30d'
                          ? '30 dias'
                          : p === '90d'
                            ? '3 meses'
                            : '1 ano'}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setPeriod('custom');
                      setShowCustomDate(true);
                    }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors flex items-center justify-center gap-1 ${
                      showCustomDate
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted hover:bg-muted/80 border-transparent'
                    }`}
                  >
                    <Calendar size={14} />
                    Custom
                  </button>
                </div>
                {showCustomDate && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1.5 text-sm bg-muted rounded-lg"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1.5 text-sm bg-muted rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Tipo de Transação */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Tipo
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleType('income')}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      transactionTypes.includes('income')
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50'
                        : 'bg-muted hover:bg-muted/80 border-transparent'
                    }`}
                  >
                    Receitas
                  </button>
                  <button
                    onClick={() => toggleType('expense')}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      transactionTypes.includes('expense')
                        ? 'bg-red-500/10 text-red-500 border-red-500/50'
                        : 'bg-muted hover:bg-muted/80 border-transparent'
                    }`}
                  >
                    Despesas
                  </button>
                </div>
              </div>

              {/* Categorias */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Categorias ({selectedCategories.length} selecionadas)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.name)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        selectedCategories.includes(cat.name)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted hover:bg-muted/80 border-transparent'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Valor
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      placeholder="Mín"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 text-sm bg-muted rounded-lg"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      placeholder="Máx"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 text-sm bg-muted rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/30">
              <button
                onClick={() => {
                  applyFilters();
                  setIsOpen(false);
                }}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
