/**
 * Configurações de Storage do Fins
 * Unificação de todas as chaves de localStorage
 */

// Chave do perfil ativo
export const PROFILE_STORAGE_KEY = 'fins_active_profile';

// Prefixo para dados de perfil
export const PROFILE_DATA_PREFIX = 'fins_profile_';

// Sufixos para tipos de dados
export const STORAGE_SUFFIXES = {
  TRANSACTIONS: '_transactions',
  BUDGETS: '_budgets',
  GOALS: '_goals',
  CATEGORIES: '_categories',
  NOTIFICATIONS: '_notifications',
  SETTINGS: '_settings',
} as const;

// Chave para lista de perfis
export const PROFILES_LIST_KEY = 'fins_profiles_list';

// Chave para dispositivo
export const DEVICE_ID_KEY = 'fins_device_id';

// Chave para sessão
export const SESSION_KEY = 'fins_session';

// Versão do schema de dados (para migrações)
export const DATA_VERSION = 1;

// Função helper para criar chave de dados de perfil
export function getProfileDataKey(profileId: string, suffix: string): string {
  return `${PROFILE_DATA_PREFIX}${profileId}${suffix}`;
}

// Função helper para obter chave de transação
export function getTransactionsKey(profileId: string): string {
  return getProfileDataKey(profileId, STORAGE_SUFFIXES.TRANSACTIONS);
}

// Função helper para obter chave de orçamento
export function getBudgetsKey(profileId: string): string {
  return getProfileDataKey(profileId, STORAGE_SUFFIXES.BUDGETS);
}

// Função helper para obter chave de metas
export function getGoalsKey(profileId: string): string {
  return getProfileDataKey(profileId, STORAGE_SUFFIXES.GOALS);
}

// Função helper para obter chave de categorias
export function getCategoriesKey(profileId: string): string {
  return getProfileDataKey(profileId, STORAGE_SUFFIXES.CATEGORIES);
}

// Função helper para obter chave de notificações
export function getNotificationsKey(profileId: string): string {
  return getProfileDataKey(profileId, STORAGE_SUFFIXES.NOTIFICATIONS);
}

// Função helper para obter chave de configurações
export function getSettingsKey(profileId: string): string {
  return getProfileDataKey(profileId, STORAGE_SUFFIXES.SETTINGS);
}

// Função para migrar dados do antigo padrão ecofinance
export function migrateFromEcoFinance(profileId: string): void {
  const oldKeys = [
    `ecofinance_${profileId}_transactions`,
    `ecofinance_${profileId}_budgets`,
    `ecofinance_${profileId}_goals`,
    `ecofinance_${profileId}_categories`,
    `ecofinance_${profileId}_notifications`,
  ];

  const newKeys = [
    getTransactionsKey(profileId),
    getBudgetsKey(profileId),
    getGoalsKey(profileId),
    getCategoriesKey(profileId),
    getNotificationsKey(profileId),
  ];

  oldKeys.forEach((oldKey, index) => {
    const data = localStorage.getItem(oldKey);
    if (data) {
      localStorage.setItem(newKeys[index], data);
      // Manter dado antigo por enquanto para rollback
      console.log(`[Storage] Migrado: ${oldKey} -> ${newKeys[index]}`);
    }
  });
}

// Função para limpar dados do antigo padrão
export function clearOldEcoFinanceData(profileId: string): void {
  const oldKeys = [
    `ecofinance_${profileId}_transactions`,
    `ecofinance_${profileId}_budgets`,
    `ecofinance_${profileId}_goals`,
    `ecofinance_${profileId}_categories`,
    `ecofinance_${profileId}_notifications`,
  ];

  oldKeys.forEach((oldKey) => {
    localStorage.removeItem(oldKey);
    console.log(`[Storage] Removido: ${oldKey}`);
  });
}

// Função helper para verificar se dados existem
export function hasProfileData(profileId: string): boolean {
  const transactionsKey = getTransactionsKey(profileId);
  return localStorage.getItem(transactionsKey) !== null;
}

// Função helper para obter todos os dados de um perfil
export function getAllProfileData(profileId: string) {
  return {
    transactions: JSON.parse(localStorage.getItem(getTransactionsKey(profileId)) || '[]'),
    budgets: JSON.parse(localStorage.getItem(getBudgetsKey(profileId)) || '[]'),
    goals: JSON.parse(localStorage.getItem(getGoalsKey(profileId)) || '[]'),
    categories: JSON.parse(localStorage.getItem(getCategoriesKey(profileId)) || '[]'),
    notifications: JSON.parse(localStorage.getItem(getNotificationsKey(profileId)) || '[]'),
  };
}
