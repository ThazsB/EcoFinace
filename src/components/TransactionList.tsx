import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: number) => void;
  showActions?: boolean;
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
  
  // Try direct match
  const directMatch = Object.keys(ICONS).find(key => 
    key.toLowerCase() === normalizedCategory
  );
  if (directMatch) return ICONS[directMatch];

  // Try keyword match
  const keywordMatch = Object.keys(ICONS).find(key => 
    normalizedCategory.includes(key.toLowerCase())
  );
  if (keywordMatch) return ICONS[keywordMatch];

  // Fallback
  return '📦';
}

export function TransactionList({
  transactions,
  onDelete,
  showActions = true,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8">
        <p>Nenhuma transação encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
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

            {showActions && onDelete && (
              <button
                onClick={() => onDelete(tx.id)}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                title="Excluir transação"
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
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
