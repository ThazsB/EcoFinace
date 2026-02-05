/**
 * Componente de Lista de Transações
 * Refatorado com utilitários centralizados e skeleton loading
 */

import React, { memo } from 'react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { getCategoryIcon, getCategoryColor } from '@/utils/categoryIcons';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { TransactionListSkeleton } from './ui/Skeleton';
import { Trash2, Edit2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
  showActions?: boolean;
  loading?: boolean;
}

export const TransactionList = memo(function TransactionList({
  transactions,
  onDelete,
  onEdit,
  showActions = true,
  loading = false,
}: TransactionListProps) {
  if (loading) {
    return <TransactionListSkeleton count={5} />;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <span className="text-3xl">💸</span>
        </div>
        <p className="text-lg font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm mt-1">Comece adicionando sua primeira transação</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <TransactionItem
          key={tx.id}
          transaction={tx}
          onDelete={onDelete}
          onEdit={onEdit}
          showActions={showActions}
        />
      ))}
    </div>
  );
});

// Componente individual de transação
interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
  showActions?: boolean;
}

const TransactionItem = memo(function TransactionItem({
  transaction,
  onDelete,
  onEdit,
  showActions,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income';
  const IconComponent = getCategoryIcon(transaction.category);
  const color = getCategoryColor(transaction.category);
  const { categories: storeCategories } = useCategoriesStore();

  // Obtém cor customizada da categoria se existir
  const categoryFromStore = storeCategories.find(cat => cat.name === transaction.category);
  const categoryColor = categoryFromStore?.color || color;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
        isIncome
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-orange-500/10 border-orange-500/20'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          {IconComponent && <IconComponent size={24} style={{ color: categoryColor }} className="lucide-icon" />}
        </div>

        <div>
          <p className="font-medium">{transaction.desc}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{transaction.category}</span>
            <span>•</span>
            <span>
              {(() => {
                const date = new Date(transaction.date);
                // Ajusta a data para fuso horário local para evitar deslocamento
                date.setTime(date.getTime() + date.getTimezoneOffset() * 60000);
                return date.toLocaleDateString('pt-BR');
              })()}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p
          className={`font-bold text-lg ${
            isIncome ? 'text-green-500' : 'text-orange-500'
          }`}
        >
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </p>

        {showActions && (onDelete || onEdit) && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(transaction)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                title="Editar transação"
                aria-label="Editar transação"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(transaction.id)}
                className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-muted-foreground hover:text-red-500"
                title="Excluir transação"
                aria-label="Excluir transação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// Versão resumida para uso em listas compactas
export const TransactionListCompact = memo(function TransactionListCompact({
  transactions,
  maxItems = 3,
}: {
  transactions: Transaction[];
  maxItems?: number;
}) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma transação recente
      </p>
    );
  }

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxItems);

  return (
    <div className="space-y-2">
      {recentTransactions.map((tx) => {
        const IconComponent = getCategoryIcon(tx.category);
        const color = getCategoryColor(tx.category);
        const { categories: storeCategories } = useCategoriesStore();
        
        // Obtém cor customizada da categoria se existir
        const categoryFromStore = storeCategories.find(cat => cat.name === tx.category);
        const categoryColor = categoryFromStore?.color || color;

        return (
          <div
            key={tx.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              {IconComponent && <IconComponent size={16} style={{ color: categoryColor }} className="lucide-icon" />}
              <span className="text-muted-foreground">{tx.desc}</span>
            </div>
            <span
              className={`font-medium ${
                tx.type === 'income' ? 'text-green-500' : 'text-orange-500'
              }`}
            >
              {tx.type === 'income' ? '+' : '-'}
              {formatCurrency(tx.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
});
