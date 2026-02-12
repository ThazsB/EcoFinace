/**
 * Unified deletion toast system
 * Standardizes all deletion feedback across the application
 * Now uses centralized toast messages to remove duplicate phrases
 */

import { TOAST_MESSAGES } from './toast-messages';

export interface DeletionToastConfig {
  type: 'success' | 'error';
  title: string;
  message: string;
  duration?: number;
}

/**
 * Creates a standardized deletion success toast configuration
 * @param elementType - The type of element being deleted (e.g., "Categoria", "Notificação", "Transação")
 * @param elementName - The name/description of the deleted element
 * @returns Toast configuration object
 */
export const createDeletionToastSuccess = (
  elementType: 'categoria' | 'transação' | 'orçamento' | 'meta' | 'perfil' | 'notificação',
  elementName?: string,
  amount?: string
): DeletionToastConfig => {
  let title = '';
  let message = '';

  switch (elementType) {
    case 'transação': {
      const messageConfig = TOAST_MESSAGES.TRANSACTION.DELETED;
      title = messageConfig.TITLE;
      message = messageConfig.MESSAGE(
        'despesa', // Tipo padrão, pode ser customizado via parâmetros
        elementName || 'transação',
        amount || 'R$ 0,00'
      );
      break;
    }
    case 'categoria': {
      const messageConfig = TOAST_MESSAGES.CATEGORY.DELETED;
      title = messageConfig.TITLE;
      message = messageConfig.MESSAGE(elementName);
      break;
    }
    case 'orçamento': {
      const messageConfig = TOAST_MESSAGES.BUDGET.DELETED;
      title = messageConfig.TITLE;
      message = messageConfig.MESSAGE(elementName || 'orçamento');
      break;
    }
    case 'meta': {
      const messageConfig = TOAST_MESSAGES.GOAL.DELETED;
      title = messageConfig.TITLE;
      message = messageConfig.MESSAGE(elementName || 'meta');
      break;
    }
    default:
      title = `${elementType.charAt(0).toUpperCase() + elementType.slice(1)} excluída`;
      message = elementName
        ? `"${elementName}" foi excluído com sucesso`
        : `${elementType} foi excluído com sucesso`;
  }

  return {
    type: 'success',
    title,
    message,
    duration: 3000,
  };
};

/**
 * Creates a standardized deletion error toast configuration
 * @param elementType - The type of element that failed to delete
 * @param reason - Optional error reason/message
 * @returns Toast configuration object
 */
export const createDeletionToastError = (
  elementType: 'categoria' | 'transação' | 'orçamento' | 'meta' | 'perfil' | 'notificação',
  reason?: string
): DeletionToastConfig => {
  let title = '';
  let message = '';

  switch (elementType) {
    case 'transação': {
      const messageConfig = TOAST_MESSAGES.TRANSACTION.ERROR;
      title = messageConfig.TITLE;
      message = messageConfig.MESSAGE('despesa', 'transação', 'R$ 0,00', reason);
      break;
    }
    case 'categoria': {
      const messageConfig = TOAST_MESSAGES.CATEGORY.ERROR;
      title = messageConfig.TITLE;
      message = messageConfig.MESSAGE(reason);
      break;
    }
    case 'orçamento': {
      const messageConfig = TOAST_MESSAGES.BUDGET.ERROR;
      title = messageConfig.TITLE;
      message = messageConfig.MESSAGE('orçamento', reason);
      break;
    }
    case 'meta': {
      const messageConfig = TOAST_MESSAGES.GOAL.ERROR;
      title = messageConfig.TITLE;
      message = messageConfig.MESSAGE('meta', reason);
      break;
    }
    default:
      title = `Erro ao excluir ${elementType}`;
      message = reason || `Não foi possível excluir o ${elementType}`;
  }

  return {
    type: 'error',
    title,
    message,
    duration: 4000,
  };
};

/**
 * Unified deletion toast handler
 * Usage with useToast hook:
 * const { showToast } = useToast();
 * showDeletionToast(showToast, 'categoria', 'Alimentação', true);
 */
export const showDeletionToast = (
  showToast: (config: DeletionToastConfig) => void,
  elementType: 'categoria' | 'transação' | 'orçamento' | 'meta' | 'perfil' | 'notificação',
  elementName?: string,
  isSuccess: boolean = true,
  errorReason?: string,
  amount?: string
) => {
  if (isSuccess) {
    showToast(createDeletionToastSuccess(elementType, elementName, amount));
  } else {
    showToast(createDeletionToastError(elementType, errorReason));
  }
};

// Predefined element types for consistency
export const DELETION_ELEMENTS = {
  CATEGORY: 'categoria',
  NOTIFICATION: 'notificação',
  TRANSACTION: 'transação',
  BUDGET: 'orçamento',
  GOAL: 'meta',
  PROFILE: 'perfil',
} as const;

// Compatibility wrapper for existing code
export const showTransactionDeletedToast = (
  showToast: (config: DeletionToastConfig) => void,
  description: string,
  amount: string,
  isSuccess: boolean = true,
  errorReason?: string
) => {
  showDeletionToast(
    showToast,
    DELETION_ELEMENTS.TRANSACTION,
    description,
    isSuccess,
    errorReason,
    amount
  );
};
