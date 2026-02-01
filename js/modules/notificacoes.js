import { getAppData } from './armazenamento.js';
import { getActiveProfile } from './perfis.js';
import * as Uteis from './uteis.js';

// --- Storage Management ---

export function getNotifications() {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return [];

    const storageKey = `ecofinance_${activeProfile.id}_notifications`;
    const json = localStorage.getItem(storageKey);
    return json ? JSON.parse(json) : [];
}

const AUDIO_URL = 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3';

function playSound() {
    try {
        const audio = new Audio(AUDIO_URL);
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play prevented', e));
    } catch (e) {
        console.warn('Audio error', e);
    }
}

function saveNotifications(notifications) {
    const activeProfile = getActiveProfile();
    if (!activeProfile) return;

    const storageKey = `ecofinance_${activeProfile.id}_notifications`;
    localStorage.setItem(storageKey, JSON.stringify(notifications));
    updateBadge();
}

/**
 * Creates a new notification.
 * @param {string} title 
 * @param {string} message 
 * @param {'info'|'success'|'warning'|'error'} type 
 */
export function addNotification(title, message, type = 'info') {
    const notifications = getNotifications();

    // Check for duplicates to avoid spam (simple check based on title/message today)
    const today = new Date().toISOString().split('T')[0];
    const isDuplicate = notifications.some(n =>
        n.title === title &&
        n.message === message &&
        n.date.startsWith(today) &&
        !n.read
    );

    if (isDuplicate) return;

    const newNotif = {
        id: Date.now(),
        title,
        message,
        type,
        date: new Date().toISOString(),
        read: false
    };

    notifications.unshift(newNotif); // Add to top

    // Limit history to 50 items
    if (notifications.length > 50) notifications.pop();

    saveNotifications(notifications);
    Uteis.showToast(title + ": " + message, type === 'error' ? 'error' : 'success');
    playSound();
}

export function markAsRead(id) {
    const notifications = getNotifications();
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveNotifications(notifications);
    }
}

export function markAllAsRead() {
    const notifications = getNotifications();
    notifications.forEach(n => n.read = true);
    saveNotifications(notifications);
}

export function clearAll() {
    saveNotifications([]);
}

export function getUnreadCount() {
    return getNotifications().filter(n => !n.read).length;
}

// --- Badge UI ---
export function updateBadge() {
    const badge = document.getElementById('notif-badge');
    const count = getUnreadCount();

    if (!badge) return;

    if (count > 0) {
        badge.innerText = count > 9 ? '9+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// --- Smart Checks ---

export function checkBudgetAlerts(budgetsStatus) {
    // budgetsStatus comes from Consultas.getBudgetsStatus()
    // format: [{category, limit, spent}, ...]

    budgetsStatus.forEach(b => {
        const percent = (b.spent / b.limit) * 100;

        if (percent >= 100) {
            addNotification(
                'Orçamento Estourado!',
                `Você excedeu o limite de ${b.category}. Gasto: ${Uteis.formatCurrency(b.spent)}`,
                'error'
            );
        } else if (percent >= 80) {
            addNotification(
                'Alerta de Orçamento',
                `Você atingiu ${Math.round(percent)}% do limite de ${b.category}.`,
                'warning'
            );
        }
    });
}

export function checkGoalAlerts(goals) {
    goals.forEach(g => {
        if (g.current >= g.target) {
            addNotification(
                'Meta Atingida! 🎉',
                `Parabéns! Você completou a meta "${g.name}".`,
                'success'
            );
        }
    });
}
