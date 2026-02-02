import { create } from 'zustand';
import { Transaction, Budget, Goal, AppData, DEFAULT_CATEGORIES } from '@/types';

interface AppState {
  data: Omit<AppData, 'notifications'>;
  loading: boolean;
  init: (profileId: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'profileId'>) => Promise<Transaction>;
  deleteTransaction: (id: number) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'profileId' | 'current'>) => Promise<Goal>;
  updateGoal: (id: number, updatedGoal: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (id: number) => Promise<void>;
  addGoalValue: (id: number, amount: number) => Promise<Goal | null>;
  addBudget: (budget: Omit<Budget, 'profileId'>) => Promise<void>;
  updateBudget: (oldCategory: string, newBudget: Budget) => Promise<void>;
  deleteBudget: (category: string) => Promise<void>;
  addCategory: (categoryName: string) => Promise<void>;
  deleteCategory: (categoryName: string) => Promise<void>;
  editCategory: (oldName: string, newName: string) => Promise<void>;
  getValidCategories: () => string[];
}

export const useAppStore = create<AppState>((set, get) => ({
  data: {
    transactions: [],
    budgets: [],
    goals: [],
    categories: []
  },
  loading: false,

  init: async (profileId) => {
    set({ loading: true });
    try {
      // Load data from localStorage
      const transactions = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_transactions`) || '[]');
      const budgets = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_budgets`) || '[]');
      const goals = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_goals`) || '[]');
      const categories = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_categories`) || '[]');

      set({
        data: {
          transactions,
          budgets,
          goals,
          categories
        }
      });
    } catch {
      // Silently fail on init
    } finally {
      set({ loading: false });
    }
  },

  addTransaction: async (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now(),
      profileId: localStorage.getItem('ecofinance_active_profile') || ''
    };

    set(state => ({
      data: {
        ...state.data,
        transactions: [...state.data.transactions, newTransaction]
      }
    }));

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const currentData = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_transactions`) || '[]');
      localStorage.setItem(`ecofinance_${profileId}_transactions`, JSON.stringify([...currentData, newTransaction]));
    }

    return newTransaction;
  },

  deleteTransaction: async (id) => {
    set(state => ({
      data: {
        ...state.data,
        transactions: state.data.transactions.filter(tx => tx.id !== id)
      }
    }));

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const currentData = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_transactions`) || '[]');
      localStorage.setItem(`ecofinance_${profileId}_transactions`, JSON.stringify(currentData.filter((tx: Transaction) => tx.id !== id)));
    }
  },

  addGoal: async (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now(),
      current: 0,
      profileId: localStorage.getItem('ecofinance_active_profile') || ''
    };

    set(state => ({
      data: {
        ...state.data,
        goals: [...state.data.goals, newGoal]
      }
    }));

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const currentData = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_goals`) || '[]');
      localStorage.setItem(`ecofinance_${profileId}_goals`, JSON.stringify([...currentData, newGoal]));
    }

    return newGoal;
  },

  updateGoal: async (id, updatedGoal) => {
    set(state => {
      const goals = state.data.goals.map(goal =>
        goal.id === id ? { ...goal, ...updatedGoal } : goal
      );
      return {
        data: {
          ...state.data,
          goals
        }
      };
    });

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const currentData = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_goals`) || '[]');
      const updatedGoals = currentData.map((goal: Goal) =>
        goal.id === id ? { ...goal, ...updatedGoal } : goal
      );
      localStorage.setItem(`ecofinance_${profileId}_goals`, JSON.stringify(updatedGoals));
    }

    const updated = get().data.goals.find(goal => goal.id === id);
    return updated || null;
  },

  deleteGoal: async (id) => {
    set(state => ({
      data: {
        ...state.data,
        goals: state.data.goals.filter(goal => goal.id !== id)
      }
    }));

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const currentData = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_goals`) || '[]');
      localStorage.setItem(`ecofinance_${profileId}_goals`, JSON.stringify(currentData.filter((goal: Goal) => goal.id !== id)));
    }
  },

  addGoalValue: async (id, amount) => {
    const goal = get().data.goals.find(goal => goal.id === id);
    if (!goal) return null;

    const updatedGoal = { ...goal, current: goal.current + amount };
    await get().updateGoal(id, updatedGoal);
    return updatedGoal;
  },

  addBudget: async (budget) => {
    const newBudget: Budget = {
      ...budget,
      profileId: localStorage.getItem('ecofinance_active_profile') || ''
    };
    
    set(state => ({
      data: {
        ...state.data,
        budgets: [...state.data.budgets, newBudget]
      }
    }));

     const profileId = localStorage.getItem('ecofinance_active_profile');
     if (profileId) {
       const currentData = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_budgets`) || '[]');
       localStorage.setItem(`ecofinance_${profileId}_budgets`, JSON.stringify([...currentData, newBudget]));
     }
  },

  updateBudget: async (oldCategory, newBudget) => {
    set(state => {
      const budgets = state.data.budgets.map(budget =>
        budget.category === oldCategory ? newBudget : budget
      );

      const transactions = state.data.transactions.map(tx =>
        tx.category === oldCategory ? { ...tx, category: newBudget.category } : tx
      );

      const categories = state.data.categories.map(cat =>
        cat === oldCategory ? newBudget.category : cat
      );

      return {
        data: {
          ...state.data,
          budgets,
          transactions,
          categories
        }
      };
    });

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const [currentBudgets, currentTransactions, currentCategories] = await Promise.all([
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_budgets`) || '[]'),
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_transactions`) || '[]'),
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_categories`) || '[]')
      ]);

      const updatedBudgets = currentBudgets.map((budget: Budget) =>
        budget.category === oldCategory ? newBudget : budget
      );

      const updatedTransactions = currentTransactions.map((tx: Transaction) =>
        tx.category === oldCategory ? { ...tx, category: newBudget.category } : tx
      );

      const updatedCategories = currentCategories.map((cat: string) =>
        cat === oldCategory ? newBudget.category : cat
      );

      await Promise.all([
        localStorage.setItem(`ecofinance_${profileId}_budgets`, JSON.stringify(updatedBudgets)),
        localStorage.setItem(`ecofinance_${profileId}_transactions`, JSON.stringify(updatedTransactions)),
        localStorage.setItem(`ecofinance_${profileId}_categories`, JSON.stringify(updatedCategories))
      ]);
    }
  },

  deleteBudget: async (category) => {
    set(state => {
      const budgets = state.data.budgets.filter(budget => budget.category !== category);
      const transactions = state.data.transactions.map(tx =>
        tx.category === category ? { ...tx, category: 'Outros' } : tx
      );
      const categories = state.data.categories.filter(cat => cat !== category);

      return {
        data: {
          ...state.data,
          budgets,
          transactions,
          categories
        }
      };
    });

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const [currentBudgets, currentTransactions, currentCategories] = await Promise.all([
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_budgets`) || '[]'),
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_transactions`) || '[]'),
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_categories`) || '[]')
      ]);

      const updatedBudgets = currentBudgets.filter((budget: Budget) => budget.category !== category);
      const updatedTransactions = currentTransactions.map((tx: Transaction) =>
        tx.category === category ? { ...tx, category: 'Outros' } : tx
      );
      const updatedCategories = currentCategories.filter((cat: string) => cat !== category);

      await Promise.all([
        localStorage.setItem(`ecofinance_${profileId}_budgets`, JSON.stringify(updatedBudgets)),
        localStorage.setItem(`ecofinance_${profileId}_transactions`, JSON.stringify(updatedTransactions)),
        localStorage.setItem(`ecofinance_${profileId}_categories`, JSON.stringify(updatedCategories))
      ]);
    }
  },

  addCategory: async (categoryName) => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;

    const existingCategories = get().getValidCategories();
    if (existingCategories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
      return;
    }

    set(state => ({
      data: {
        ...state.data,
        categories: [...state.data.categories, trimmedName]
      }
    }));

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const currentData = JSON.parse(localStorage.getItem(`ecofinance_${profileId}_categories`) || '[]');
      localStorage.setItem(`ecofinance_${profileId}_categories`, JSON.stringify([...currentData, trimmedName]));
    }
  },

  deleteCategory: async (categoryName) => {
    if (DEFAULT_CATEGORIES.includes(categoryName)) {
      return;
    }

    set(state => {
      const categories = state.data.categories.filter(cat => cat !== categoryName);
      const transactions = state.data.transactions.map(tx =>
        tx.category === categoryName ? { ...tx, category: 'Outros' } : tx
      );
      const budgets = state.data.budgets.filter(budget => budget.category !== categoryName);

      return {
        data: {
          ...state.data,
          categories,
          transactions,
          budgets
        }
      };
    });

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const [currentCategories, currentTransactions, currentBudgets] = await Promise.all([
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_categories`) || '[]'),
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_transactions`) || '[]'),
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_budgets`) || '[]')
      ]);

      const updatedCategories = currentCategories.filter((cat: string) => cat !== categoryName);
      const updatedTransactions = currentTransactions.map((tx: Transaction) =>
        tx.category === categoryName ? { ...tx, category: 'Outros' } : tx
      );
      const updatedBudgets = currentBudgets.filter((budget: Budget) => budget.category !== categoryName);

      await Promise.all([
        localStorage.setItem(`ecofinance_${profileId}_categories`, JSON.stringify(updatedCategories)),
        localStorage.setItem(`ecofinance_${profileId}_transactions`, JSON.stringify(updatedTransactions)),
        localStorage.setItem(`ecofinance_${profileId}_budgets`, JSON.stringify(updatedBudgets))
      ]);
    }
  },

  editCategory: async (oldName, newName) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const existingCategories = get().getValidCategories().filter(cat => cat !== oldName);
    if (existingCategories.some(cat => cat.toLowerCase() === trimmedName.toLowerCase())) {
      return;
    }

    set(state => {
      const categories = state.data.categories.map(cat =>
        cat === oldName ? trimmedName : cat
      );

      const transactions = state.data.transactions.map(tx =>
        tx.category === oldName ? { ...tx, category: trimmedName } : tx
      );

      const budgets = state.data.budgets.map(budget =>
        budget.category === oldName ? { ...budget, category: trimmedName } : budget
      );

      return {
        data: {
          ...state.data,
          categories,
          transactions,
          budgets
        }
      };
    });

    const profileId = localStorage.getItem('ecofinance_active_profile');
    if (profileId) {
      const [currentCategories, currentTransactions, currentBudgets] = await Promise.all([
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_categories`) || '[]'),
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_transactions`) || '[]'),
        JSON.parse(localStorage.getItem(`ecofinance_${profileId}_budgets`) || '[]')
      ]);

      const updatedCategories = currentCategories.map((cat: string) =>
        cat === oldName ? trimmedName : cat
      );

      const updatedTransactions = currentTransactions.map((tx: Transaction) =>
        tx.category === oldName ? { ...tx, category: trimmedName } : tx
      );

      const updatedBudgets = currentBudgets.map((budget: Budget) =>
        budget.category === oldName ? { ...budget, category: trimmedName } : budget
      );

      await Promise.all([
        localStorage.setItem(`ecofinance_${profileId}_categories`, JSON.stringify(updatedCategories)),
        localStorage.setItem(`ecofinance_${profileId}_transactions`, JSON.stringify(updatedTransactions)),
        localStorage.setItem(`ecofinance_${profileId}_budgets`, JSON.stringify(updatedBudgets))
      ]);
    }
  },

  getValidCategories: () => {
    return [...DEFAULT_CATEGORIES, ...get().data.categories];
  },


}));
