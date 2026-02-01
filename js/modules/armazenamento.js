import { getActiveProfile } from './perfis.js';

const defaultData = {
    transactions: [],
    budgets: [],
    goals: [],
    categories: []
};

let appData = null;
let currentProfileId = null;

/**
 * Inicializa o armazenamento para o perfil ativo
 */
export function initStore() {
    const activeProfile = getActiveProfile();
    if (!activeProfile) {
        console.warn('Nenhum perfil ativo encontrado');
        appData = { ...defaultData };
        currentProfileId = null;
        return;
    }

    currentProfileId = activeProfile.id;
    loadProfileData(currentProfileId);
}

/**
 * Carrega dados de um perfil específico
 */
function loadProfileData(profileId) {
    const transactionsKey = `ecofinance_${profileId}_transactions`;
    const budgetsKey = `ecofinance_${profileId}_budgets`;
    const goalsKey = `ecofinance_${profileId}_goals`;
    const categoriesKey = `ecofinance_${profileId}_categories`;

    appData = {
        transactions: JSON.parse(localStorage.getItem(transactionsKey) || '[]'),
        budgets: JSON.parse(localStorage.getItem(budgetsKey) || '[]'),
        goals: JSON.parse(localStorage.getItem(goalsKey) || '[]'),
        categories: JSON.parse(localStorage.getItem(categoriesKey) || '[]')
    };
}

/**
 * Obtém os dados da aplicação
 */
export function getAppData() {
    const activeProfile = getActiveProfile();

    // Se o perfil mudou, recarregar dados
    if (!activeProfile || activeProfile.id !== currentProfileId) {
        initStore();
    }

    if (!appData) initStore();
    return appData;
}

/**
 * Salva os dados da aplicação
 */
export function saveAppData() {
    const activeProfile = getActiveProfile();
    if (!activeProfile) {
        console.warn('Nenhum perfil ativo para salvar dados');
        return;
    }

    const profileId = activeProfile.id;
    const transactionsKey = `ecofinance_${profileId}_transactions`;
    const budgetsKey = `ecofinance_${profileId}_budgets`;
    const goalsKey = `ecofinance_${profileId}_goals`;
    const categoriesKey = `ecofinance_${profileId}_categories`;

    localStorage.setItem(transactionsKey, JSON.stringify(appData.transactions));
    localStorage.setItem(budgetsKey, JSON.stringify(appData.budgets));
    localStorage.setItem(goalsKey, JSON.stringify(appData.goals));
    localStorage.setItem(categoriesKey, JSON.stringify(appData.categories));

    document.dispatchEvent(new CustomEvent('dataChanged'));
}

/**
 * Recarrega os dados do perfil ativo
 */
export function reloadProfileData() {
    initStore();
    document.dispatchEvent(new CustomEvent('profileChanged'));
}
