/**
 * Sistema Centralizado de Frases Toast/Notificações
 * Remove duplicações e padroniza todas as mensagens do sistema
 */

export const TOAST_MESSAGES = {
  // Transações
  TRANSACTION: {
    ADDED: {
      TITLE: 'Transação adicionada',
      MESSAGE: (type: 'receita' | 'despesa', description: string, amount: string) =>
        `${type.charAt(0).toUpperCase() + type.slice(1)} "${description}" de ${amount} foi adicionada com sucesso`,
    },
    UPDATED: {
      TITLE: 'Transação atualizada',
      MESSAGE: (type: 'receita' | 'despesa', description: string, amount: string) =>
        `${type.charAt(0).toUpperCase() + type.slice(1)} "${description}" de ${amount} foi atualizada com sucesso`,
    },
    DELETED: {
      TITLE: 'Transação excluída',
      MESSAGE: (type: 'receita' | 'despesa', description: string, amount: string) =>
        `${type.charAt(0).toUpperCase() + type.slice(1)} "${description}" de ${amount} foi excluída com sucesso`,
    },
    ERROR: {
      TITLE: 'Erro ao processar transação',
      MESSAGE: (type: 'receita' | 'despesa', description: string, amount: string, error?: string) =>
        error || `Não foi possível processar a ${type} "${description}" de ${amount}`,
    },
  },

  // Metas
  GOAL: {
    CREATED: {
      TITLE: 'Meta criada',
      MESSAGE: (name: string, target: string) =>
        `Meta "${name}" de ${target} foi criada com sucesso`,
    },
    CONTRIBUTION: {
      TITLE: 'Meta atualizada',
      MESSAGE: (current: string, name: string, percentage: number) =>
        `Contribuição de ${current} adicionada à meta "${name}" (${percentage}% concluído)`,
    },
    DELETED: {
      TITLE: 'Meta excluída',
      MESSAGE: (name: string) => `Meta "${name}" foi excluída com sucesso`,
    },
    ERROR: {
      TITLE: 'Erro ao processar meta',
      MESSAGE: (name: string, error?: string) =>
        error || `Não foi possível processar a meta "${name}"`,
    },
  },

  // Orçamentos
  BUDGET: {
    CREATED: {
      TITLE: 'Orçamento criado',
      MESSAGE: (category: string, limit: string) =>
        `Orçamento para "${category}" de ${limit} foi criado com sucesso`,
    },
    DELETED: {
      TITLE: 'Orçamento excluído',
      MESSAGE: (category: string) => `Orçamento para "${category}" foi excluído com sucesso`,
    },
    ERROR: {
      TITLE: 'Erro ao processar orçamento',
      MESSAGE: (category: string, error?: string) =>
        error || `Não foi possível processar o orçamento de "${category}"`,
    },
  },

  // Categorias
  CATEGORY: {
    CREATED: {
      TITLE: 'Categoria criada',
      MESSAGE: (name: string) => `A categoria "${name}" foi criada com sucesso`,
    },
    DUPLICATED: {
      TITLE: 'Categoria duplicada',
      MESSAGE: (name: string) => `Uma cópia de "${name}" foi criada`,
    },
    DELETED: {
      TITLE: 'Categoria excluída',
      MESSAGE: (name?: string) =>
        name ? `"${name}" foi excluído com sucesso` : 'Categoria foi excluída com sucesso',
    },
    ERROR: {
      TITLE: 'Erro ao processar categoria',
      MESSAGE: (error?: string) => error || 'Não foi possível processar a categoria',
    },
  },
} as const;

// Helper para formatar valores monetários (reutiliza formatação existente)
export const formatCurrencyForToast = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(amount));
};

// Helper para converter tipo de transação
export const getTransactionTypePortuguese = (type: 'income' | 'expense'): 'receita' | 'despesa' => {
  return type === 'income' ? 'receita' : 'despesa';
};
