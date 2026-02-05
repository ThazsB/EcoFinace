/**
 * Utilitário Centralizado de Ícones de Categoria
 * Unifica todos os mapeamentos de ícones usados no app
 */

import { CATEGORY_ICONS as LUCIDE_ICONS } from '@/types/categories';

// Mapeamento de categorias para ícones da biblioteca LUCIDE_ICONS
export const CATEGORY_ICONS: Record<string, string> = {
  // Receitas
  'Salário': 'wallet',
  'Investimentos': 'piggy-bank',
  'Freelance': 'briefcase',
  'Renda Extra': 'banknote',
  'Dividendos': 'trending-up',
  'Aposentadoria': 'banknote',
  'Presente': 'gift',

  // Despesas - Alimentação
  'Alimentação': 'utensils',
  'Restaurante': 'utensils',
  'Mercado': 'shopping-cart',
  'Feira': 'shopping-cart',
  'Lanchonete': 'coffee',
  'Café': 'coffee',
  'Bebidas': 'wine',
  'Delivery': 'shopping-cart',

  // Despesas - Moradia
  'Moradia': 'home',
  'Aluguel': 'home',
  'Condomínio': 'building',
  'IPTU': 'home',
  'Energia': 'lightbulb',
  'Água': 'droplet',
  'Gás': 'fuel',
  'Internet': 'phone',
  'Telefone': 'phone',
  'TV a Cabo': 'phone',
  'Manutenção': 'wrench',

  // Despesas - Transporte
  'Transporte': 'car',
  'Combustível': 'fuel',
  'Uber': 'car',
  'Ônibus': 'bus',
  'Metrô': 'train',
  'Táxi': 'car',
  'Estacionamento': 'car',
  'Pedágio': 'car',

  // Despesas - Lazer
  'Lazer': 'film',
  'Cinema': 'film',
  'Jogos': 'gamepad',
  'Séries': 'film',
  'Música': 'music',
  'Livros': 'book',
  'Viagem': 'plane',
  'Hotel': 'plane',
  'Ingressos': 'film',
  'Parque': 'trees',
  'Bar': 'wine',
  'Festa': 'film',

  // Despesas - Saúde
  'Saúde': 'heart-pulse',
  'Farmácia': 'pill',
  'Médico': 'stethoscope',
  'Dentista': 'stethoscope',
  'Academia': 'activity',
  'Exames': 'stethoscope',
  'Plano de Saúde': 'heart-pulse',
  'Veterinário': 'paw-print',

  // Despesas - Educação
  'Educação': 'graduation-cap',
  'Curso': 'graduation-cap',
  'Escola': 'school',
  'Universidade': 'graduation-cap',
  'Material Escolar': 'book',
  'Curso Online': 'laptop',
  'Workshop': 'graduation-cap',

  // Despesas - Pessoal
  'Compras': 'shopping-bag',
  'Roupas': 'shopping-bag',
  'Calçados': 'shopping-bag',
  'Beleza': 'sparkles',
  'Cabeleireiro': 'sparkles',
  'Presentes': 'gift',
  'Animais': 'paw-print',
  'Eletrônicos': 'laptop',
  'Criança': 'user',
  'Outros': 'more-horizontal',
};

// Exportar o mapeamento para uso em outras partes do app
export { CATEGORY_ICONS as CATEGORY_ICON_MAP };

/**
 * Obtém o componente de ícone para uma categoria
 */
export function getCategoryIcon(category: string) {
  if (!category) {
    const fallbackIcon = LUCIDE_ICONS.find(icon => icon.id === 'more-horizontal');
    return fallbackIcon ? fallbackIcon.component : null;
  }

  const normalizedCategory = category.toLowerCase();

  // Busca por correspondência exata
  const directMatch = Object.keys(CATEGORY_ICONS).find(
    (key) => key.toLowerCase() === normalizedCategory
  );
  if (directMatch) {
    const iconId = CATEGORY_ICONS[directMatch];
    const iconData = LUCIDE_ICONS.find(icon => icon.id === iconId);
    return iconData ? iconData.component : null;
  }

  // Busca por palavra-chave
  const keywordMatch = Object.keys(CATEGORY_ICONS).find((key) =>
    normalizedCategory.includes(key.toLowerCase())
  );
  if (keywordMatch) {
    const iconId = CATEGORY_ICONS[keywordMatch];
    const iconData = LUCIDE_ICONS.find(icon => icon.id === iconId);
    return iconData ? iconData.component : null;
  }

  // Fallback para ícone padrão
  const fallbackIcon = LUCIDE_ICONS.find(icon => icon.id === 'more-horizontal');
  return fallbackIcon ? fallbackIcon.component : null;
}

/**
 * Obtém a cor para uma categoria
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Salário': '#22C55E',
    'Investimentos': '#14B8A6',
    'Freelance': '#06B6D4',
    'Alimentação': '#F97316',
    'Moradia': '#EF4444',
    'Transporte': '#6366F1',
    'Lazer': '#A855F7',
    'Saúde': '#EC4899',
    'Educação': '#3B82F6',
    'Compras': '#F59E0B',
    'Viagem': '#06B6D4',
    'Outros': '#6B7280',
  };

  const normalizedCategory = category.toLowerCase();

  const directMatch = Object.keys(colors).find(
    (key) => key.toLowerCase() === normalizedCategory
  );
  if (directMatch) return colors[directMatch];

  const keywordMatch = Object.keys(colors).find((key) =>
    normalizedCategory.includes(key.toLowerCase())
  );
  if (keywordMatch) return colors[keywordMatch];

  return '#6B7280';
}

/**
 * Determina se uma categoria é de receita
 */
export function isIncomeCategory(category: string): boolean {
  const incomeCategories = ['salário', 'investimentos', 'freelance', 'renda extra', 'dividendos'];
  return incomeCategories.some((c) => category.toLowerCase().includes(c));
}

/**
 * Obtém ícone e cor para uma categoria
 */
export function getCategoryStyle(category: string): { icon: any; color: string } {
  return {
    icon: getCategoryIcon(category),
    color: getCategoryColor(category),
  };
}
