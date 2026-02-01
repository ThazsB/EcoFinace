import { create } from 'zustand';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  date: string;
  read: boolean;
}

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  loadNotifications: (profileId: string) => void;
  checkBudgetAlerts: (budgetsStatus: Array<{ category: string; limit: number; spent: number }>) => void;
  checkGoalAlerts: (goals: Array<{ id: number; name: string; current: number; target: number }>) => void;
  saveNotifications: () => void;
  showToast: (message: string, type: NotificationType) => void;
  playSound: () => void;
}

const STORAGE_PREFIX = 'ecofinance';
const MAX_NOTIFICATIONS = 50;

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (title, message, type: NotificationType = 'info') => {
    const { notifications } = get();
    const today = new Date().toISOString().split('T')[0];
    
    // Check for duplicates
    const isDuplicate = notifications.some(n => 
      n.title === title && 
      n.message === message && 
      n.date.startsWith(today) && 
      !n.read
    );

    if (isDuplicate) return;

    const newNotification: Notification = {
      id: Date.now(),
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false,
    };

    const updatedNotifications = [newNotification, ...notifications];
    
    // Limit history
    if (updatedNotifications.length > MAX_NOTIFICATIONS) {
      updatedNotifications.pop();
    }

    set({ 
      notifications: updatedNotifications, 
      unreadCount: updatedNotifications.filter(n => !n.read).length 
    });
    get().saveNotifications();
    get().showToast(title + ": " + message, type);
    get().playSound();
  },

  markAsRead: (id) => {
    const { notifications } = get();
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    
    const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
    set({ notifications: updatedNotifications, unreadCount: newUnreadCount });
    get().saveNotifications();
  },

  markAllAsRead: () => {
    const { notifications } = get();
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    set({ notifications: updatedNotifications, unreadCount: 0 });
    get().saveNotifications();
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
    get().saveNotifications();
  },

  loadNotifications: (profileId) => {
    const storageKey = `${STORAGE_PREFIX}_${profileId}_notifications`;
    const json = localStorage.getItem(storageKey);
    const notifications = json ? JSON.parse(json) : [];
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;
    set({ notifications, unreadCount });
  },

  checkBudgetAlerts: (budgetsStatus) => {
    budgetsStatus.forEach(b => {
      const percent = (b.spent / b.limit) * 100;

      if (percent >= 100) {
        get().addNotification(
          'Orçamento Estourado!',
          `Você excedeu o limite de ${b.category}. Gasto: R$${b.spent.toFixed(2)}`,
          'error'
        );
      } else if (percent >= 80) {
        get().addNotification(
          'Alerta de Orçamento',
          `Você atingiu ${Math.round(percent)}% do limite de ${b.category}.`,
          'warning'
        );
      }
    });
  },

  checkGoalAlerts: (goals) => {
    goals.forEach(g => {
      if (g.current >= g.target) {
        get().addNotification(
          'Meta Atingida! 🎉',
          `Parabéns! Você completou a meta "${g.name}".`,
          'success'
        );
      }
    });
  },

  saveNotifications: () => {
    // This will be overridden when loadNotifications is called
    // and we know the profileId
  },

  showToast: (message, type) => {
    // Enhanced toast implementation with elegant colors
    const toast = document.createElement('div');
    
    // Color schemes based on Midnight Slate theme
    const colors = {
      success: {
        bg: 'rgba(30, 41, 59, 0.95)',
        border: '#34d399',
        text: '#f1f5f9',
        iconBg: 'rgba(16, 185, 129, 0.15)',
      },
      error: {
        bg: 'rgba(30, 41, 59, 0.95)',
        border: '#fb7185',
        text: '#f1f5f9',
        iconBg: 'rgba(244, 63, 94, 0.15)',
      },
      warning: {
        bg: 'rgba(30, 41, 59, 0.95)',
        border: '#fbbf24',
        text: '#f1f5f9',
        iconBg: 'rgba(245, 158, 11, 0.15)',
      },
      info: {
        bg: 'rgba(30, 41, 59, 0.95)',
        border: '#38bdf8',
        text: '#f1f5f9',
        iconBg: 'rgba(56, 189, 248, 0.15)',
      },
    };
    
    const color = colors[type] || colors.info;
    
    // SVG icons for each type
    const icons = {
      success: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="${color.border}" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      error: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="${color.border}" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      warning: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="${color.border}" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
      info: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="${color.border}" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };
    
    toast.innerHTML = `
      <div style="
        position: relative;
        padding: 16px;
        background: ${color.bg};
        border-left: 4px solid ${color.border};
        border-radius: 12px;
        box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.4), 0 2px 10px -2px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        max-width: 360px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-family: 'Inter', system-ui, sans-serif;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${color.iconBg};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        ">
          ${icons[type]}
        </div>
        <div style="
          flex: 1;
          min-width: 0;
        ">
          <p style="
            color: ${color.text};
            font-size: 14px;
            font-weight: 500;
            line-height: 1.5;
            margin: 0;
          ">${message}</p>
        </div>
        <button onclick="this.closest('.eco-toast').remove()" style="
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        " onmouseover="this.style.color='white';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='rgba(255,255,255,0.5)';this.style.background='transparent'">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div style="
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 0 0 12px 12px;
        overflow: hidden;
      ">
        <div style="
          height: 100%;
          background: ${color.border};
          width: 100%;
          animation: progressShrink 5s linear forwards;
        "></div>
      </div>
    `;
    
    toast.className = 'eco-toast';
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 16px;
      z-index: 9999;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    
    // Add progress animation keyframes
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `@keyframes progressShrink { from { width: 100%; } to { width: 0%; } }`;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Show toast with animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    
    // Hide toast after 5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 500);
    }, 5000);
  },

  playSound: () => {
    const AUDIO_URL = 'https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3';
    try {
      const audio = new Audio(AUDIO_URL);
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play prevented', e));
    } catch (e) {
      console.warn('Audio error', e);
    }
  },
}));

// Override saveNotifications to include profileId
export function initializeNotificationsStore(profileId: string) {
  useNotificationsStore.setState({
    saveNotifications: () => {
      const { notifications } = useNotificationsStore.getState();
      const storageKey = `${STORAGE_PREFIX}_${profileId}_notifications`;
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    },
  });
}
