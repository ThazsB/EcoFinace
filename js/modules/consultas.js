import { getAppData } from './armazenamento.js';
import { isCurrentMonth } from './uteis.js';

export function getTransactions(filterType = 'all', search = '') {
    const data = getAppData();
    return data.transactions.filter(t => {
        const matchesSearch = t.desc.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getBudgetsStatus() {
    const data = getAppData();
    const spendingByCategory = {};

    // Calcular gastos do mês atual por categoria
    data.transactions.forEach(t => {
        if (t.type === 'expense' && isCurrentMonth(t.date)) {
            spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
        }
    });

    return data.budgets.map(b => ({
        ...b,
        spent: spendingByCategory[b.category] || 0
    }));
}

export function getGoals() {
    return getAppData().goals;
}

export function getGoalById(id) {
    return getAppData().goals.find(g => g.id === id);
}

export function getDashboardStats() {
    const data = getAppData();

    const totalIncome = data.transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = data.transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalBalance = totalIncome - totalExpense;

    const monthlyIncome = data.transactions
        .filter(t => t.type === 'income' && isCurrentMonth(t.date))
        .reduce((acc, t) => acc + t.amount, 0);

    const monthlyExpense = data.transactions
        .filter(t => t.type === 'expense' && isCurrentMonth(t.date))
        .reduce((acc, t) => acc + t.amount, 0);

    return {
        totalBalance,
        monthlyIncome,
        monthlyExpense
    };
}

export function getExpensesByCategory() {
    const data = getAppData();
    const expensesByCategory = {};
    data.transactions
        .filter(t => t.type === 'expense' && isCurrentMonth(t.date))
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });
    return expensesByCategory;
}
