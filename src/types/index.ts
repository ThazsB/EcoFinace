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
  | 'idle'                    // Idle inicial
  | 'profile-selected'        // Perfil selecionado, mostrando senha
  | 'authenticating'          // Processando login
  | 'success'                 // Login ok
  | 'error'                   // Senha incorreta
  | 'first-access';           // Primeiro acesso - criar perfil

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

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  read: boolean;
  profileId: string;
}

export interface AppData {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  categories: string[];
  notifications: Notification[];
}

export const AVAILABLE_AVATARS = [
  '👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓',
  '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍🎨', '👩‍🎨', '👨‍🍳', '👩‍🍳',
  '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '🦄', '🦋', '🐝', '🐞', '🦖', '🦕', '🐙', '🦑'
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
  { name: 'Esmeralda', value: '#10B981', light: '#34D399' }
];

export const DEFAULT_CATEGORIES = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Salário', 'Investimentos', 'Educação', 'Viagem', 'Outros'];
