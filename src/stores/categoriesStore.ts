/**
 * Store Zustand para gerenciamento de categorias personalizadas do Fins
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Category,
  CategoryCreateData,
  CategoryUpdateData,
  CategoryDeleteResult,
  CategoryFilters,
  CategorySortOption,
} from '@/types/categories';
import { DEFAULT_SYSTEM_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '@/types/categories';

// Chave do localStorage
const STORAGE_KEY = 'fins_categories';

interface CategoriesState {
  // Estado
  categories: Category[];
  customOrder: string[]; // IDs em ordem customizada
  filters: CategoryFilters;
  sortBy: CategorySortOption;
  searchQuery: string;

  // Actions - CRUD
  init: (profileId: string) => Promise<void>;
  addCategory: (data: CategoryCreateData) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (
    id: string,
    data: CategoryUpdateData
  ) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (id: string, migrateTo?: string) => Promise<CategoryDeleteResult>;
  duplicateCategory: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Actions - Favoritos
  toggleFavorite: (id: string) => void;

  // Actions - Ordenação
  reorderCategories: (fromIndex: number, toIndex: number) => void;
  setSortBy: (sort: CategorySortOption) => void;

  // Actions - Filtros
  setFilters: (filters: Partial<CategoryFilters>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Actions - Utils
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;
  getCategoriesByType: (type: 'income' | 'expense' | 'transfer') => Category[];
  getFavoriteCategories: () => Category[];
  getSystemCategories: () => Category[];
  getCustomCategories: () => Category[];
  incrementUsageCount: (categoryId: string) => void;
  validateCategory: (name: string, excludeId?: string) => { valid: boolean; error?: string };
}

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      categories: [...DEFAULT_SYSTEM_CATEGORIES],
      customOrder: [],
      filters: {},
      sortBy: 'custom',
      searchQuery: '',

      // Inicializar com dados do perfil
      init: async (profileId: string) => {
        try {
          const stored = localStorage.getItem(`${STORAGE_KEY}_${profileId}`);
          if (stored) {
            const data = JSON.parse(stored);
            set({
              categories: data.categories || [...DEFAULT_SYSTEM_CATEGORIES],
              customOrder: data.customOrder || [],
            });
          }
        } catch (error) {
          console.error('Erro ao carregar categorias:', error);
        }
      },

      // Adicionar nova categoria
      addCategory: async (data: CategoryCreateData) => {
        const { name, type, icon, color, parentId, isFavorite } = data;

        // Validar nome
        const validation = get().validateCategory(name);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        const profileId = localStorage.getItem('fins_active_profile') || 'default';
        const newCategory: Category = {
          id: crypto.randomUUID(),
          name: name.trim(),
          type,
          icon: icon || 'tag',
          color: color || CATEGORY_COLORS[0].value,
          parentId,
          isSystem: false,
          isFavorite: isFavorite || false,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          categories: [...state.categories, newCategory],
        }));

        // Salvar no localStorage
        const { categories, customOrder } = get();
        localStorage.setItem(
          `${STORAGE_KEY}_${profileId}`,
          JSON.stringify({ categories, customOrder })
        );

        return { success: true };
      },

      // Atualizar categoria
      updateCategory: async (id: string, data: CategoryUpdateData) => {
        const existing = get().categories.find((c) => c.id === id);
        if (!existing) {
          return { success: false, error: 'Categoria não encontrada' };
        }

        // Validar nome se estiver sendo alterado
        if (data.name) {
          const validation = get().validateCategory(data.name, id);
          if (!validation.valid) {
            return { success: false, error: validation.error };
          }
        }

        const profileId = localStorage.getItem('fins_active_profile') || 'default';

        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...data, updatedAt: new Date().toISOString() } : cat
          ),
        }));

        // Salvar no localStorage
        const { categories, customOrder } = get();
        localStorage.setItem(
          `${STORAGE_KEY}_${profileId}`,
          JSON.stringify({ categories, customOrder })
        );

        return { success: true };
      },

      // Excluir categoria
      deleteCategory: async (id: string, migrateTo?: string): Promise<CategoryDeleteResult> => {
        const existing = get().categories.find((c) => c.id === id);
        if (!existing) {
          return {
            success: false,
            migratedTransactions: 0,
            migratedBudgets: 0,
            message: 'Categoria não encontrada',
          };
        }

        if (existing.isSystem) {
          return {
            success: false,
            migratedTransactions: 0,
            migratedBudgets: 0,
            message: 'Categorias do sistema não podem ser excluídas',
          };
        }

        const profileId = localStorage.getItem('fins_active_profile') || 'default';

        // Contar transações e orçamentos afetados
        const transactions = JSON.parse(
          localStorage.getItem(`fins_${profileId}_transactions`) || '[]'
        );
        const budgets = JSON.parse(localStorage.getItem(`fins_${profileId}_budgets`) || '[]');

        const affectedTransactions = transactions.filter(
          (t: { category: string }) => t.category === existing.name
        );
        const affectedBudgets = budgets.filter(
          (b: { category: string }) => b.category === existing.name
        );

        // Migrar transações
        const migrateCategory = migrateTo || 'Outros';
        const updatedTransactions = transactions.map((t: { category: string }) =>
          t.category === existing.name ? { ...t, category: migrateCategory } : t
        );

        // Remover orçamentos
        const updatedBudgets = budgets.filter(
          (b: { category: string }) => b.category !== existing.name
        );

        // Atualizar store
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        }));

        // Salvar mudanças
        localStorage.setItem(`fins_${profileId}_transactions`, JSON.stringify(updatedTransactions));
        localStorage.setItem(`fins_${profileId}_budgets`, JSON.stringify(updatedBudgets));

        const { categories, customOrder } = get();
        localStorage.setItem(
          `${STORAGE_KEY}_${profileId}`,
          JSON.stringify({ categories, customOrder })
        );

        return {
          success: true,
          migratedTransactions: affectedTransactions.length,
          migratedBudgets: affectedBudgets.length,
          message: `Categoria "${existing.name}" foi excluída. ${affectedTransactions.length} transações foram migradas para "${migrateCategory}".`,
        };
      },

      // Duplicar categoria
      duplicateCategory: async (id: string) => {
        const existing = get().categories.find((c) => c.id === id);
        if (!existing) {
          return { success: false, error: 'Categoria não encontrada' };
        }

        const newName = `${existing.name} (cópia)`;
        const validation = get().validateCategory(newName);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        const profileId = localStorage.getItem('fins_active_profile') || 'default';
        const newCategory: Category = {
          ...existing,
          id: crypto.randomUUID(),
          name: newName,
          isSystem: false,
          isFavorite: false,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          categories: [...state.categories, newCategory],
        }));

        const { categories, customOrder } = get();
        localStorage.setItem(
          `${STORAGE_KEY}_${profileId}`,
          JSON.stringify({ categories, customOrder })
        );

        return { success: true };
      },

      // Toggle favorito
      toggleFavorite: (id: string) => {
        const profileId = localStorage.getItem('fins_active_profile') || 'default';

        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id
              ? { ...cat, isFavorite: !cat.isFavorite, updatedAt: new Date().toISOString() }
              : cat
          ),
        }));

        const { categories, customOrder } = get();
        localStorage.setItem(
          `${STORAGE_KEY}_${profileId}`,
          JSON.stringify({ categories, customOrder })
        );
      },

      // Reordenar categorias
      reorderCategories: (fromIndex: number, toIndex: number) => {
        const { categories, customOrder } = get();
        const categoryIds = categories.map((c) => c.id);

        // Mover no array
        const [removed] = categoryIds.splice(fromIndex, 1);
        categoryIds.splice(toIndex, 0, removed);

        set({ customOrder: categoryIds });

        const profileId = localStorage.getItem('fins_active_profile') || 'default';
        localStorage.setItem(
          `${STORAGE_KEY}_${profileId}`,
          JSON.stringify({
            categories: get().categories,
            customOrder: categoryIds,
          })
        );
      },

      // Definir tipo de ordenação
      setSortBy: (sort: CategorySortOption) => {
        set({ sortBy: sort });
      },

      // Definir filtros
      setFilters: (filters: Partial<CategoryFilters>) => {
        set((state) => ({ filters: { ...state.filters, ...filters } }));
      },

      // Definir busca
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      // Limpar filtros
      clearFilters: () => {
        set({ filters: {}, searchQuery: '' });
      },

      // Utils
      getCategoryById: (id: string) => {
        return get().categories.find((c) => c.id === id);
      },

      getCategoryByName: (name: string) => {
        return get().categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
      },

      getCategoriesByType: (type: 'income' | 'expense' | 'transfer') => {
        return get().categories.filter((c) => c.type === type);
      },

      getFavoriteCategories: () => {
        return get().categories.filter((c) => c.isFavorite);
      },

      getSystemCategories: () => {
        return get().categories.filter((c) => c.isSystem);
      },

      getCustomCategories: () => {
        return get().categories.filter((c) => !c.isSystem);
      },

      // Incrementar contador de uso
      incrementUsageCount: (categoryId: string) => {
        const profileId = localStorage.getItem('fins_active_profile') || 'default';

        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === categoryId
              ? { ...cat, usageCount: cat.usageCount + 1, updatedAt: new Date().toISOString() }
              : cat
          ),
        }));

        const { categories, customOrder } = get();
        localStorage.setItem(
          `${STORAGE_KEY}_${profileId}`,
          JSON.stringify({ categories, customOrder })
        );
      },

      // Validar categoria
      validateCategory: (name: string, excludeId?: string) => {
        if (!name.trim()) {
          return { valid: false, error: 'O nome da categoria é obrigatório' };
        }

        if (name.trim().length < 2) {
          return { valid: false, error: 'O nome deve ter pelo menos 2 caracteres' };
        }

        if (name.trim().length > 30) {
          return { valid: false, error: 'O nome deve ter no máximo 30 caracteres' };
        }

        const existing = get().categories.find(
          (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId
        );

        if (existing) {
          return { valid: false, error: `Já existe uma categoria chamada "${existing.name}"` };
        }

        return { valid: true };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
        customOrder: state.customOrder,
      }),
    }
  )
);

// Hook para usar categorias filtradas e ordenadas
export const useFilteredCategories = () => {
  const { categories, filters, sortBy, searchQuery, getCategoriesByType, getFavoriteCategories } =
    useCategoriesStore();

  let filtered = [...categories];

  // Aplicar filtros
  if (filters.type) {
    filtered = filtered.filter((c) => c.type === filters.type);
  }

  if (filters.favoritesOnly) {
    filtered = filtered.filter((c) => c.isFavorite);
  }

  if (filters.systemOnly) {
    filtered = filtered.filter((c) => c.isSystem);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(query));
  }

  // Aplicar ordenação
  switch (sortBy) {
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'usage':
      filtered.sort((a, b) => b.usageCount - a.usageCount);
      break;
    case 'type':
      filtered.sort((a, b) => a.type.localeCompare(b.type));
      break;
    case 'custom':
    default:
      // Manter ordem atual
      break;
  }

  return filtered;
};
