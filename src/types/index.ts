export * from './notifications';
export * from './notification-preferences';
export * from './categories';

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  passwordHash: string;
  security?: ProfileSecurity;
  createdAt: string;
  lastAccess: string;
}

// Configurações de segurança do perfil
export interface ProfileSecurity {
  // Método de autenticação
  authMethod: 'password' | 'pin';

  // Configurações de PIN (se aplicável)
  pinLength?: number; // 4 ou 6 dígitos

  // Tentativas máxima antes de bloquear
  maxLoginAttempts?: number; // padrão: 5

  // Contador de tentativas falhadas
  failedAttempts?: number;

  // Timestamp do último bloqueio (se aplicável)
  lockedUntil?: string;
}

// Estados do fluxo de autenticação
export type AuthStep =
  | 'idle' // Idle inicial
  | 'profile-selected' // Perfil selecionado, mostrando senha
  | 'authenticating' // Processando login
  | 'success' // Login ok
  | 'error' // Senha incorreta
  | 'first-access'; // Primeiro acesso - criar perfil

// Tipos de erro de autenticação
export type AuthErrorType =
  | 'none'
  | 'invalid-password'
  | 'profile-not-found'
  | 'account-locked'
  | 'network-error';

export interface Transaction {
  id: number;
  desc: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  profileId: string;
}

export interface Budget {
  category: string;
  limit: number;
  profileId: string;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  current: number;
  profileId: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Categorias de notificação
 */
export type NotificationCategory = 'financeira' | 'lembrete' | 'relatorio' | 'sistema' | 'insight';

/**
 * Tipos de insight financeiro
 */
export type InsightType =
  | 'spending_pattern' // Padrão de gastos
  | 'budget_warning' // Alerta de orçamento
  | 'saving_opportunity' // Oportunidade de economia
  | 'income_analysis' // Análise de receitas
  | 'trend_alert' // Alerta de tendência
  | 'anomaly_detected' // Anomalia detectada
  | 'goal_progress' // Progresso de meta
  | 'monthly_summary'; // Resumo mensal

/**
 * Insight financeiro personalizado
 */
export interface FinancialInsight {
  id: number;
  type: InsightType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success' | 'action';
  category: string;
  actionable: boolean;
  actionLabel?: string;
  actionUrl?: string;
  data?: Record<string, any>;
  createdAt: string;
}

/**
 * Resumo financeiro (diário/semanal/mensal)
 */
export interface FinancialSummary {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  transactionsCount: number;
  budgetStatus: Array<{ category: string; spent: number; limit: number; percentage: number }>;
  highlights: string[];
  recommendations: string[];
}

/**
 * Dados para análise preditiva
 */
export interface PredictiveData {
  category: string;
  currentSpent: number;
  dailyAverage: number;
  projectedTotal: number;
  daysRemaining: number;
  willExceed: boolean;
  exceedAmount?: number;
  daysUntilExceed?: number;
}

export const AVAILABLE_AVATARS = [
  '👤',
  '👨',
  '👩',
  '🧑',
  '👨‍💼',
  '👩‍💼',
  '👨‍🎓',
  '👩‍🎓',
  '👨‍💻',
  '👩‍💻',
  '👨‍🔬',
  '👩‍🔬',
  '👨‍🎨',
  '👩‍🎨',
  '👨‍🍳',
  '👩‍🍳',
  '🦸',
  '🦹',
  '🧙',
  '🧚',
  '🧛',
  '🧜',
  '🧝',
  '🧞',
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🐔',
  '🦄',
  '🦋',
  '🐝',
  '🐞',
  '🦖',
  '🦕',
  '🐙',
  '🦑',
];

export const AVAILABLE_COLORS = [
  { name: 'Laranja', value: '#F4A261', light: '#F4A261' },
  { name: 'Verde', value: '#34d399', light: '#34d399' },
  { name: 'Azul', value: '#3B82F6', light: '#60A5FA' },
  { name: 'Roxo', value: '#A855F7', light: '#C084FC' },
  { name: 'Rosa', value: '#fb7185', light: '#FDA4AF' },
  { name: 'Amarelo', value: '#FBBF24', light: '#FCD34D' },
  { name: 'Ciano', value: '#06B6D4', light: '#22D3EE' },
  { name: 'Vermelho', value: '#EF4444', light: '#F87171' },
  { name: 'Índigo', value: '#6366F1', light: '#818CF8' },
  { name: 'Esmeralda', value: '#10B981', light: '#34D399' },
];

export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer',
  'Saúde',
  'Salário',
  'Investimentos',
  'Educação',
  'Viagem',
  'Outros',
];

/**
 * Valor Fixo Anualizado
 * Representa receitas ou despesas mensais repetitivas
 */
export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  active: boolean;
  dayOfMonth: number; // Dia do mês em que o valor fixo será contabilizado (1-31)
  createdAt: string;
  updatedAt: string;
  profileId: string;
}

/**
 * Período para resumos
 */
export type SummaryPeriod = 'daily' | 'weekly' | 'monthly';

/**
 * Tipo legacy de notificação (usado em supabase.ts)
 */
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  date: string;
  read: boolean;
  archived: boolean;
  snoozedUntil?: string | null;
  profileId: string;
}

/**
 * Dados da aplicação para o store
 */
export interface AppData {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  categories: string[];
  fixedExpenses: FixedExpense[];
}
