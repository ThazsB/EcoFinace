/**
 * GUIA DE IMPLEMENTAÇÃO - TOAST UNIFICADO PARA EXCLUSÃO
 * 
 * Este arquivo descreve como usar o novo sistema centralizado de toasts para exclusão
 * em toda a aplicação do Fins.
 */

// ============================================================================
// 1. IMPORTAÇÃO E CONFIGURAÇÃO
// ============================================================================

// Importe os utilitários necessários:
import { showDeletionToast, DELETION_ELEMENTS } from '@/utils/deletion-toast';
import { useToast } from '@/components/notifications';

// ============================================================================
// 2. COMPONENTES COM EXCLUSÃO
// ============================================================================

// Exemplo: Excluindo uma categoria
export const handleCategoryDelete = async () => {
  const { showToast } = useToast(); // Use o hook para obter a função de toast
  
  const result = await deleteCategory(categoryId, migrateTo);
  
  if (result.success) {
    // Passar para a função unificada:
    showDeletionToast(
      showToast,                           // Função de toast do hook
      DELETION_ELEMENTS.CATEGORY,          // Tipo de elemento (pré-definido)
      categoryName,                         // Nome/descrição do item deletado
      true                                 // isSuccess = true
    );
  } else {
    showDeletionToast(
      showToast,
      DELETION_ELEMENTS.CATEGORY,
      categoryName,
      false,                               // isSuccess = false
      result.message                       // Razão do erro (opcional)
    );
  }
};

// ============================================================================
// 3. ELEMENTOS PRÉ-DEFINIDOS
// ============================================================================

/**
 * Use os elementos pré-definidos em DELETION_ELEMENTS para garantir consistência:
 * 
 * DELETION_ELEMENTS.CATEGORY      - Categoria
 * DELETION_ELEMENTS.NOTIFICATION  - Notificação
 * DELETION_ELEMENTS.TRANSACTION   - Transação
 * DELETION_ELEMENTS.BUDGET        - Orçamento
 * DELETION_ELEMENTS.GOAL          - Meta
 * DELETION_ELEMENTS.PROFILE       - Perfil
 * 
 * Se precisar de um novo tipo, adicione à const DELETION_ELEMENTS em deletion-toast.ts
 */

// ============================================================================
// 4. EXEMPLOS DE IMPLEMENTAÇÃO
// ============================================================================

// --- Exemplo 1: Transação ---
const handleTransactionDelete = async (transactionId, transaction) => {
  const { showToast } = useToast();
  
  try {
    await deleteTransaction(transactionId);
    
    showDeletionToast(
      showToast,
      DELETION_ELEMENTS.TRANSACTION,
      transaction.desc,           // Nome da transação
      true                        // Success
    );
  } catch (error) {
    showDeletionToast(
      showToast,
      DELETION_ELEMENTS.TRANSACTION,
      transaction.desc,
      false,
      'Não foi possível excluir a transação'
    );
  }
};

// --- Exemplo 2: Orçamento ---
const handleBudgetDelete = async (budgetId, category) => {
  const { showToast } = useToast();
  
  const result = await deleteBudget(budgetId);
  
  showDeletionToast(
    showToast,
    DELETION_ELEMENTS.BUDGET,
    category,
    result.success,
    result.success ? undefined : result.error
  );
};

// --- Exemplo 3: Meta (Goal) ---
const handleGoalDelete = async (goalId, goalName) => {
  const { showToast } = useToast();
  
  const result = await deleteGoal(goalId);
  
  showDeletionToast(
    showToast,
    DELETION_ELEMENTS.GOAL,
    goalName,
    result.success,
    result.success ? undefined : 'Erro ao excluir meta'
  );
};

// ============================================================================
// 5. CUSTOMIZAÇÃO AVANÇADA
// ============================================================================

/**
 * Se você precisar customizar a mensagem além dos padrões, use as funções base:
 */

import { 
  createDeletionToastSuccess,
  createDeletionToastError 
} from '@/utils/deletion-toast';

// Customização parcial (você pode adicionar dados extras depois)
const customDelete = () => {
  const { showToast } = useToast();
  
  // Criar configuração customizada
  const successConfig = createDeletionToastSuccess('item customizado', 'Meu Item');
  
  // Modificar se necessário
  successConfig.duration = 5000; // Duração customizada
  
  showToast(successConfig);
};

// ============================================================================
// 6. BENEFÍCIOS DO PADRÃO UNIFICADO
// ============================================================================

/**
 * ✅ Consistência Visual
 *    - Todos os toasts de exclusão seguem o mesmo padrão
 *    - Mensagens padronizadas melhoram a experiência do usuário
 * 
 * ✅ Manutenção Simplificada
 *    - Mudanças no padrão de mensagem acontecem em um único lugar
 *    - Redutor de duplicação de código
 * 
 * ✅ Type Safety
 *    - TypeScript garante uso correto dos tipos
 *    - DELETION_ELEMENTS oferece autocompletar
 * 
 * ✅ Facilidade de Auditoria
 *    - Todas as exclusões seguem o mesmo fluxo
 *    - Fácil adicionar logging ou analytics centralizadamente
 */

// ============================================================================
// 7. INTEGRAÇÃO COM ANALYTICS (FUTURA)
// ============================================================================

/**
 * Para adicionar tracking automático de exclusões:
 * 
 * Modifique showDeletionToast em deletion-toast.ts para incluir:
 * 
 * export const showDeletionToast = (
 *   showToast,
 *   elementType,
 *   elementName,
 *   isSuccess,
 *   errorReason
 * ) => {
 *   // Analytics tracking
 *   analytics.track('element_deleted', {
 *     element_type: elementType,
 *     element_name: elementName,
 *     success: isSuccess,
 *     error_reason: errorReason,
 *     timestamp: new Date().toISOString()
 *   });
 *   
 *   // Resto do código...
 * };
 */

// ============================================================================
// 8. PRÓXIMOS PASSOS
// ============================================================================

/**
 * Refatore todos os componentes com exclusão para usar este padrão:
 * 
 * - [ ] TransactionList.tsx - Exclusão de transações
 * - [ ] NotificationCenter.tsx - Exclusão de notificações
 * - [ ] Budgets.tsx - Exclusão de orçamentos
 * - [ ] Goals.tsx - Exclusão de metas
 * - [ ] Perfil/Settings - Exclusão de perfil
 * - [ ] js/modules/interface.js - Legacy code
 */
