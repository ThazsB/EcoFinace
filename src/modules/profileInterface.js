/**
 * Profile Interface Logic
 * Handles all UI interactions for the profile system
 */

console.log('ProfileInterface.js carregado');

import * as Perfis from './perfis.js';
import { reloadProfileData } from './armazenamento.js';
import { showToast } from './uteis.js';

// Constantes para o sistema de sessão
const PROFILE_KEY = 'ecofinance_active_profile';
const TIMESTAMP_KEY = 'ecofinance_profile_timestamp';

/**
 * Inicializa a interface de perfis
 */
export function initProfileInterface() {
    // Verificar e limpar perfil se necessário baseado no tempo de inatividade
    checkAndClearProfile();
    
    const profiles = Perfis.getAllProfiles();
    const activeProfile = Perfis.getActiveProfile();

    // Se não houver perfis, mostrar a tela de seleção e forçar criação
    if (profiles.length === 0) {
        // Não limpar perfil ativo (não há nenhum)
        showProfileSelection();
        setupProfileEventListeners();
        setupSessionMonitoring(); // Configurar monitoramento de sessão

        // Abrir automaticamente o modal de criação de perfil
        setTimeout(() => {
            openProfileModal();
        }, 300);
        return;
    }

    // Se houver um perfil ativo, verificar se ele ainda existe
    if (activeProfile) {
        const profileStillExists = profiles.some(p => p.id === activeProfile.id);
        if (profileStillExists) {
            // Perfil ativo ainda existe - ativar o app principal
            showMainApp();
            setupProfileEventListeners();
            setupSessionMonitoring(); // Configurar monitoramento de sessão
            return;
        }
    }

    // Se chegou aqui, precisa selecionar um perfil
    showProfileSelection();
    setupProfileEventListeners();
    setupSessionMonitoring(); // Configurar monitoramento de sessão
}

/**
 * Verifica se deve limpar o perfil baseado no tempo de inatividade
 */
function checkAndClearProfile() {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    const profileActive = localStorage.getItem(PROFILE_KEY);
    
    if (profileActive && timestamp) {
        const lastActivity = parseInt(timestamp);
        const now = Date.now();
        const timeDiff = now - lastActivity;
        
        // Se passaram mais de 30 segundos desde a última atividade, limpar o perfil
        if (timeDiff > 30000) {
            console.log('[ProfileInterface] Clearing profile due to inactivity:', timeDiff, 'ms');
            localStorage.removeItem(PROFILE_KEY);
            localStorage.removeItem(TIMESTAMP_KEY);
            // Note: não limpamos sessionStorage aqui pois é específico da versão React
        }
    }
}

/**
 * Configura o monitoramento de sessão
 */
function setupSessionMonitoring() {
    // Atualizar timestamp a cada 5 segundos se há perfil ativo
    const updateTimestamp = () => {
        const profileActive = localStorage.getItem(PROFILE_KEY);
        if (profileActive) {
            localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        }
    };

    const handleBeforeUnload = () => {
        console.log('[ProfileInterface] BeforeUnload event fired - clearing profile');
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(TIMESTAMP_KEY);
        // Note: não limpamos sessionStorage aqui pois é específico da versão React
    };

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            console.log('[ProfileInterface] Page hidden');
            // Não limpar imediatamente para não interferir com navegação entre abas
        } else if (document.visibilityState === 'visible') {
            console.log('[ProfileInterface] Page visible - checking profile');
            // Verificar se deve limpar o perfil ao voltar a visualizar a página
            checkAndClearProfile();
        }
    };

    // Adicionar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Atualizar timestamp periodicamente
    const timestampInterval = setInterval(updateTimestamp, 5000);
    
    console.log('[ProfileInterface] Added unload listeners and profile monitoring');

    // Armazenar referências para limpeza posterior se necessário
    window.profileSessionCleanup = () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(timestampInterval);
    };
}

/**
 * Mostra a tela de seleção de perfis
 */
function showProfileSelection() {
    document.getElementById('profile-selection-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    renderProfileSelection();

    // Inicializar ícones Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    } else {
        console.warn('Lucide icons não disponível');
    }
}

/**
 * Mostra o app principal
 */
function showMainApp() {
    document.getElementById('profile-selection-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    updateSidebarProfile();
}

// ... resto do arquivo permanece igual ...