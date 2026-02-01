import { getAppData, saveAppData } from './armazenamento.js';
import * as Interface from './interface.js';

export function addTransaction(transaction) {
    // Validação de transação
    if (!transaction.desc || !transaction.amount || !transaction.type || !transaction.category || !transaction.date) {
        console.error('Transação inválida: dados incompletos');
        return false;
    }

    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
        console.error('Transação inválida: valor deve ser um número positivo');
        return false;
    }

    if (!['income', 'expense'].includes(transaction.type)) {
        console.error('Transação inválida: tipo deve ser income ou expense');
        return false;
    }

    // Categorias válidas: categorias padrão + categorias customizadas
    const validCategories = getValidCategories();
    if (!validCategories.includes(transaction.category)) {
        console.error('Transação inválida: categoria inválida');
        return false;
    }

    const data = getAppData();
    if (!transaction.id) transaction.id = Date.now();
    data.transactions.push(transaction);
    saveAppData();

    // Check for budget alerts immediately
    Interface.runSmartChecks();
    return true;
}

export function deleteTransaction(id) {
    const data = getAppData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    saveAppData();
}

export function addGoal(goal) {
    // Validação de meta
    if (!goal.name || !goal.target) {
        console.error('Meta inválida: dados incompletos');
        return false;
    }

    if (typeof goal.target !== 'number' || goal.target <= 0) {
        console.error('Meta inválida: valor alvo deve ser um número positivo');
        return false;
    }

    if (typeof goal.current !== 'number' || goal.current < 0) {
        console.error('Meta inválida: valor atual deve ser um número não negativo');
        return false;
    }

    const data = getAppData();
    if (!goal.id) goal.id = Date.now();
    data.goals.push(goal);
    saveAppData();
    Interface.runSmartChecks();
    return true;
}

export function updateGoal(updatedGoal) {
    const data = getAppData();
    const index = data.goals.findIndex(g => g.id === updatedGoal.id);
    if (index !== -1) {
        // Preserva o valor atual (current) se não vier no objeto atualizado, 
        // ou atualiza tudo se necessário. Aqui assumimos que edição edita nome/meta.
        data.goals[index] = { ...data.goals[index], ...updatedGoal };
        saveAppData();
        Interface.runSmartChecks();
        return true;
    }
    return false;
}

export function deleteGoal(id) {
    const data = getAppData();
    data.goals = data.goals.filter(g => g.id !== id);
    saveAppData();
}

export function addGoalValue(id, amount) {
    const data = getAppData();
    const goal = data.goals.find(g => g.id === id);
    if (goal) {
        goal.current += amount;
        saveAppData();
        Interface.runSmartChecks();
        return true;
    }
    return false;
}

export function addBudget(budget) {
    // Validação de orçamento
    if (!budget.category || !budget.limit) {
        console.error('Orçamento inválido: dados incompletos');
        return false;
    }

    if (typeof budget.limit !== 'number' || budget.limit <= 0) {
        console.error('Orçamento inválido: limite deve ser um número positivo');
        return false;
    }

    // Categorias válidas: categorias padrão + categorias customizadas
    const validCategories = getValidCategories();
    if (!validCategories.includes(budget.category)) {
        console.error('Orçamento inválido: categoria inválida');
        return false;
    }

    const data = getAppData();
    // Check if category already exists to avoid duplicates
    const exists = data.budgets.some(b => b.category === budget.category);
    if (!exists) {
        data.budgets.push(budget);
        saveAppData();
        return true;
    }
    return false;
}

export function updateBudget(oldCategory, newBudget) {
    const data = getAppData();
    const index = data.budgets.findIndex(b => b.category === oldCategory);

    if (index !== -1) {
        // Se o nome da categoria mudou, atualiza todas as transações antigas
        if (oldCategory !== newBudget.category) {
            data.transactions.forEach(t => {
                if (t.category === oldCategory) {
                    t.category = newBudget.category;
                }
            });
        }

        data.budgets[index] = { ...data.budgets[index], ...newBudget };
        saveAppData();
        return true;
    }
    return false;
}

export function deleteBudget(category) {
    const data = getAppData();
    data.budgets = data.budgets.filter(b => b.category !== category);
    saveAppData();
}

// Funções para gerenciar categorias personalizadas
function getDefaultCategories() {
    return ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Salário', 'Investimentos', 'Educação', 'Viagem', 'Outros'];
}

export function getValidCategories() {
    const data = getAppData();
    return [...getDefaultCategories(), ...data.categories];
}

export function addCategory(categoryName) {
    const data = getAppData();
    const category = categoryName.trim();

    if (!category) {
        console.error('Nome da categoria não pode ser vazio');
        return false;
    }

    // Verificar se a categoria já existe (padrão ou customizada)
    const existingCategories = getValidCategories();
    if (existingCategories.some(cat => cat.toLowerCase() === category.toLowerCase())) {
        console.error('Categoria já existe');
        return false;
    }

    data.categories.push(category);
    saveAppData();
    return true;
}

export function deleteCategory(categoryName) {
    const data = getAppData();

    // Não permitir deletar categorias padrão
    if (getDefaultCategories().includes(categoryName)) {
        console.error('Não é possível deletar categorias padrão');
        return false;
    }

    // Remover categoria
    data.categories = data.categories.filter(c => c !== categoryName);

    // Atualizar transações que usavam essa categoria para "Outros"
    data.transactions.forEach(t => {
        if (t.category === categoryName) {
            t.category = 'Outros';
        }
    });

    // Remover orçamento para essa categoria
    data.budgets = data.budgets.filter(b => b.category !== categoryName);

    saveAppData();
    return true;
}

export function editCategory(oldName, newName) {
    const data = getAppData();
    const newCategory = newName.trim();

    if (!newCategory) {
        console.error('Nome da categoria não pode ser vazio');
        return false;
    }

    // Verificar se a categoria já existe (padrão ou customizada)
    const existingCategories = getValidCategories().filter(c => c !== oldName);
    if (existingCategories.some(cat => cat.toLowerCase() === newCategory.toLowerCase())) {
        console.error('Categoria já existe');
        return false;
    }

    // Atualizar categoria nas custom categories
    const index = data.categories.findIndex(c => c === oldName);
    if (index !== -1) {
        data.categories[index] = newCategory;
    }

    // Atualizar transações
    data.transactions.forEach(t => {
        if (t.category === oldName) {
            t.category = newCategory;
        }
    });

    // Atualizar orçamentos
    data.budgets.forEach(b => {
        if (b.category === oldName) {
            b.category = newCategory;
        }
    });

    saveAppData();
    return true;
}
