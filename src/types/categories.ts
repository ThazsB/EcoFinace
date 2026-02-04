/**
 * Tipos para o sistema de categorias personalizadas do Fins
 */

import { 
  Wallet, CreditCard, Banknote, PiggyBank, TrendingUp, TrendingDown, DollarSign,
  Home, Building, Wrench, Lightbulb, Droplet,
  Car, Bus, Train, Plane, Fuel,
  Utensils, Coffee, ShoppingCart, Milk, Wine,
  HeartPulse, Pill, Stethoscope, Activity,
  Gamepad2, Film, Music, Book, Camera, TreeDeciduous, Trees,
  GraduationCap, School, Laptop,
  ShoppingBag, Gift, Sparkles, User, PawPrint,
  Briefcase, Users, Phone, Mail, Folder, Tag, MoreHorizontal
} from 'lucide-react';

// Tipo de transação para a categoria
export type CategoryType = 'income' | 'expense' | 'transfer';

// Cor disponível para categorias
export interface CategoryColor {
  name: string;
  value: string;
  light: string;
}

// Ícone disponível para categorias (agora com componente React)
export interface CategoryIcon {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<any>;
  color?: string;
}

// Categoria personalizada
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId?: string; // Para subcategorias
  isSystem: boolean; // Se é uma categoria padrão do sistema
  isFavorite: boolean; // Se está marcada como favorita
  usageCount: number; // Frequência de uso para ordenação
  createdAt: string;
  updatedAt: string;
}

// Dados para criação de nova categoria
export interface CategoryCreateData {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  parentId?: string;
  isFavorite?: boolean;
}

// Dados para atualização de categoria
export interface CategoryUpdateData {
  name?: string;
  type?: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
  isFavorite?: boolean;
}

// Resultado de exclusão de categoria com migração
export interface CategoryDeleteResult {
  success: boolean;
  migratedTransactions: number;
  migratedBudgets: number;
  message: string;
}

// Estado do modal de categoria
export type CategoryModalMode = 'create' | 'edit' | 'delete' | 'none';

// Configurações de ordenação de categorias
export type CategorySortOption = 'name' | 'usage' | 'type' | 'custom';

// Filtros de categoria
export interface CategoryFilters {
  search?: string;
  type?: CategoryType;
  favoritesOnly?: boolean;
  systemOnly?: boolean;
}

// Biblioteca de ícones disponíveis
export const CATEGORY_ICONS: CategoryIcon[] = [
  // Finanças
  { id: 'wallet', name: 'Carteira', icon: 'wallet', component: Wallet },
  { id: 'credit-card', name: 'Cartão', icon: 'credit-card', component: CreditCard },
  { id: 'banknote', name: 'Dinheiro', icon: 'banknote', component: Banknote },
  { id: 'piggy-bank', name: 'Porco Investimentos', icon: 'piggy-bank', component: PiggyBank },
  { id: 'trending-up', name: 'Tendência Alta', icon: 'trending-up', component: TrendingUp },
  { id: 'trending-down', name: 'Tendência Baixa', icon: 'trending-down', component: TrendingDown },
  { id: 'dollar-sign', name: 'Símbolo Dólar', icon: 'dollar-sign', component: DollarSign },
  
  // Casa e Moradia
  { id: 'home', name: 'Casa', icon: 'home', component: Home },
  { id: 'building', name: 'Prédio', icon: 'building', component: Building },
  { id: 'wrench', name: 'Ferramentas', icon: 'wrench', component: Wrench },
  { id: 'lightbulb', name: 'Conta de Luz', icon: 'lightbulb', component: Lightbulb },
  { id: 'droplet', name: 'Água', icon: 'droplet', component: Droplet },
  
  // Transporte
  { id: 'car', name: 'Carro', icon: 'car', component: Car },
  { id: 'bus', name: 'Ônibus', icon: 'bus', component: Bus },
  { id: 'train', name: 'Metrô/Trem', icon: 'train', component: Train },
  { id: 'plane', name: 'Avião', icon: 'plane', component: Plane },
  { id: 'fuel', name: 'Combustível', icon: 'fuel', component: Fuel },
  
  // Alimentação
  { id: 'utensils', name: 'Restaurante', icon: 'utensils', component: Utensils },
  { id: 'coffee', name: 'Café', icon: 'coffee', component: Coffee },
  { id: 'shopping-cart', name: 'Mercado', icon: 'shopping-cart', component: ShoppingCart },
  { id: 'milk', name: 'Laticínios', icon: 'milk', component: Milk },
  { id: 'wine', name: 'Bebidas', icon: 'wine', component: Wine },
  
  // Saúde
  { id: 'heart-pulse', name: 'Saúde', icon: 'heart-pulse', component: HeartPulse },
  { id: 'pill', name: 'Remédios', icon: 'pill', component: Pill },
  { id: 'stethoscope', name: 'Médico', icon: 'stethoscope', component: Stethoscope },
  { id: 'activity', name: 'Academia', icon: 'activity', component: Activity },
  
  // Lazer
  { id: 'gamepad', name: 'Jogos', icon: 'gamepad', component: Gamepad2 },
  { id: 'film', name: 'Cinema', icon: 'film', component: Film },
  { id: 'music', name: 'Música', icon: 'music', component: Music },
  { id: 'book', name: 'Livros', icon: 'book', component: Book },
  { id: 'camera', name: 'Foto', icon: 'camera', component: Camera },
  { id: 'trees', name: 'Natureza', icon: 'trees', component: Trees },
  
  // Educação
  { id: 'graduation-cap', name: 'Educação', icon: 'graduation-cap', component: GraduationCap },
  { id: 'school', name: 'Escola', icon: 'school', component: School },
  { id: 'laptop', name: 'Tecnologia', icon: 'laptop', component: Laptop },
  
  // Pessoal
  { id: 'shopping-bag', name: 'Roupas', icon: 'shopping-bag', component: ShoppingBag },
  { id: 'gift', name: 'Presentes', icon: 'gift', component: Gift },
  { id: 'sparkles', name: 'Beleza', icon: 'sparkles', component: Sparkles },
  { id: 'user', name: 'Criança', icon: 'user', component: User },
  { id: 'paw-print', name: 'Animais', icon: 'paw-print', component: PawPrint },
  
  // Trabalho
  { id: 'briefcase', name: 'Trabalho', icon: 'briefcase', component: Briefcase },
  { id: 'users', name: 'Networking', icon: 'users', component: Users },
  { id: 'phone', name: 'Telefone', icon: 'phone', component: Phone },
  { id: 'mail', name: 'Email', icon: 'mail', component: Mail },
  
  // Outros
  { id: 'folder', name: 'Arquivos', icon: 'folder', component: Folder },
  { id: 'tag', name: 'Tag', icon: 'tag', component: Tag },
  { id: 'more-horizontal', name: 'Mais', icon: 'more-horizontal', component: MoreHorizontal },
];

// Cores padrão para categorias
export const CATEGORY_COLORS: CategoryColor[] = [
  { name: 'Vermelho', value: '#EF4444', light: '#FCA5A5' },
  { name: 'Laranja', value: '#F97316', light: '#FDBA74' },
  { name: 'Amarelo', value: '#EAB308', light: '#FDE047' },
  { name: 'Verde Lima', value: '#84CC16', light: '#BEF264' },
  { name: 'Verde', value: '#22C55E', light: '#86EFAC' },
  { name: 'Verde Mar', value: '#14B8A6', light: '#5EEAD4' },
  { name: 'Ciano', value: '#06B6D4', light: '#67E8F9' },
  { name: 'Azul', value: '#3B82F6', light: '#93C5FD' },
  { name: 'Indigo', value: '#6366F1', light: '#A5B4FC' },
  { name: 'Roxo', value: '#A855F7', light: '#C4B5FD' },
  { name: 'Rosa', value: '#EC4899', light: '#F9A8D4' },
  { name: 'Cinza', value: '#6B7280', light: '#9CA3AF' },
];

// Categorias padrão do sistema
export const DEFAULT_SYSTEM_CATEGORIES: Category[] = [
  // Receitas
  {
    id: 'salary',
    name: 'Salário',
    type: 'income',
    icon: 'wallet',
    color: '#22C55E',
    isSystem: true,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'investments',
    name: 'Investimentos',
    type: 'income',
    icon: 'piggy-bank',
    color: '#14B8A6',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'freelance',
    name: 'Freelance',
    type: 'income',
    icon: 'briefcase',
    color: '#06B6D4',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // Despesas
  {
    id: 'food',
    name: 'Alimentação',
    type: 'expense',
    icon: 'utensils',
    color: '#F97316',
    isSystem: true,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'housing',
    name: 'Moradia',
    type: 'expense',
    icon: 'home',
    color: '#EF4444',
    isSystem: true,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'transport',
    name: 'Transporte',
    type: 'expense',
    icon: 'car',
    color: '#6366F1',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'leisure',
    name: 'Lazer',
    type: 'expense',
    icon: 'film',
    color: '#A855F7',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'health',
    name: 'Saúde',
    type: 'expense',
    icon: 'heart-pulse',
    color: '#EC4899',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'education',
    name: 'Educação',
    type: 'expense',
    icon: 'graduation-cap',
    color: '#3B82F6',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shopping',
    name: 'Compras',
    type: 'expense',
    icon: 'shopping-bag',
    color: '#F59E0B',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'travel',
    name: 'Viagem',
    type: 'expense',
    icon: 'plane',
    color: '#06B6D4',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'others',
    name: 'Outros',
    type: 'expense',
    icon: 'more-horizontal',
    color: '#6B7280',
    isSystem: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
