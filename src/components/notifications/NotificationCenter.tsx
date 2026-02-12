/**
 * Centro de Notificações do Fins
 * Painel lateral com todas as notificações do usuário
 * Estilizado para combinar com o tema Midnight Slate
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useNotificationsStore } from '@/stores/notificationsStore';
import type {
  NotificationCategory,
  NotificationPayload,
  NotificationAction,
} from '@/types/notifications';
import { NOTIFICATION_CATEGORY_CONFIG } from '@/types/notifications';
import { NotificationItem } from './NotificationItem';
import { X, Check, CheckCheck, Search, Settings, ChevronRight, Bell, Trash2 } from 'lucide-react';

type TabCategory = 'all' | NotificationCategory;

// Helper para formatar tempo relativo
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHour < 24) return `há ${diffHour}h`;
  if (diffDay < 7) return `há ${diffDay} dias`;
  return date.toLocaleDateString('pt-BR');
}

// Componente wrapper para scroll horizontal com mouse wheel
const HorizontalScrollWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current) {
      // Converte scroll vertical para horizontal
      if (e.deltaY !== 0) {
        scrollRef.current.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing"
      style={{ scrollBehavior: 'smooth' }}
    >
      {children}
    </div>
  );
};

// Componente principal
export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isCenterOpen,
    closeCenter,
    markAsRead,
    dismissNotification,
    deleteNotification,
    clearAll,
  } = useNotificationsStore();

  const [activeTab, setActiveTab] = useState<TabCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeCenter();
      setIsClosing(false);
    }, 300);
  };

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Filtro por categoria
      if (activeTab !== 'all' && n.category !== activeTab) return false;

      // Filtro por busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!n.title.toLowerCase().includes(query) && !n.message.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Filtro por não lidas
      if (filterUnreadOnly && n.status === 'read') return false;

      return true;
    });
  }, [notifications, activeTab, searchQuery, filterUnreadOnly]);

  if (!isCenterOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col overflow-hidden ${
          isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold text-primary-foreground bg-primary rounded-full px-1 animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir todas as notificações?')) {
                  clearAll();
                }
              }}
              className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
              title="Excluir todas as notificações"
              disabled={notifications.length === 0}
            >
              <Trash2 className="w-5 h-5 text-muted-foreground hover:text-destructive" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-accent text-muted-foreground'
              }`}
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex-shrink-0 p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar notificações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-accent/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterUnreadOnly}
                onChange={(e) => setFilterUnreadOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-accent"
              />
              <span className="text-sm text-muted-foreground">Somente não lidas</span>
            </label>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && <NotificationSettingsPanel />}

        {/* Tabs */}
        <div className="flex flex-shrink-0 w-full justify-center p-1">
          <HorizontalScrollWrapper>
            <div className="inline-flex items-center bg-accent/30 rounded-lg p-0.5 border border-border/50">
              <TabButton
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                count={notifications.length}
                isFirst
              >
                Todas
              </TabButton>
              {Object.entries(NOTIFICATION_CATEGORY_CONFIG).map(([key, config], index, arr) => (
                <TabButton
                  key={key}
                  active={activeTab === key}
                  onClick={() => setActiveTab(key as NotificationCategory)}
                  count={notifications.filter((n) => n.category === key).length}
                  isMiddle={index > 0}
                  isLast={index === arr.length - 1}
                >
                  <span>{config.icon}</span>
                  {config.label}
                </TabButton>
              ))}
            </div>
          </HorizontalScrollWrapper>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <div className="w-16 h-16 mb-4 bg-accent rounded-full flex items-center justify-center">
                <Bell className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">Nenhuma notificação</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Tente buscar com outros termos'
                  : 'Suas notificações aparecerão aqui'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                  onDismiss={() => dismissNotification(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                  onAction={(action) => {
                    if (action.handler) {
                      window.dispatchEvent(
                        new CustomEvent('notification-action', {
                          detail: {
                            notificationId: notification.id,
                            action: action.id,
                          },
                        })
                      );
                    }
                    if (action.url) {
                      window.location.href = action.url;
                    }
                    if (action.dismissAfterAction) {
                      markAsRead(notification.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex-shrink-0 p-3 border-t border-border bg-accent/30">
            <button
              onClick={() => {
                notifications.forEach((n) => {
                  if (n.status !== 'read') {
                    markAsRead(n.id);
                  }
                });
              }}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Componente de botão de tab estilo Segmented Control
const TabButton: React.FC<{
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
  isFirst?: boolean;
  isMiddle?: boolean;
  isLast?: boolean;
}> = ({ children, active, onClick, count, isFirst, isMiddle, isLast }) => {
  // Determina o raio das bordas baseado na posição
  const roundedClass = isFirst ? 'rounded-l-md' : isLast ? 'rounded-r-md' : 'rounded-none';

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 ${roundedClass} ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      }`}
    >
      <span className="flex items-center gap-1">
        {children}
        {count !== undefined && count > 0 && (
          <span
            className={`text-[10px] px-1 py-0.5 rounded ${
              active ? 'bg-muted text-muted-foreground' : 'text-muted-foreground/70'
            }`}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
    </button>
  );
};

// Componente de configurações
const NotificationSettingsPanel: React.FC = () => {
  const { preferences, updatePreferences, setQuietHours } = useNotificationsStore();

  return (
    <div className="p-4 border-b border-border bg-accent/30">
      <h3 className="font-medium text-foreground mb-4">Configurações</h3>

      {/* Global Toggle */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">Notificações ativas</span>
        <button
          onClick={() => updatePreferences({ globalEnabled: !preferences.globalEnabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            preferences.globalEnabled ? 'bg-primary' : 'bg-input'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.globalEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Sound Toggle */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">Som</span>
        <button
          onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            preferences.soundEnabled ? 'bg-primary' : 'bg-input'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.soundEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Auto-dismiss Toggle */}
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">Dispensar automaticamente</span>
        <button
          onClick={() => updatePreferences({ autoDismissing: !preferences.autoDismissing })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            preferences.autoDismissing ? 'bg-primary' : 'bg-input'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.autoDismissing ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Auto-dismiss Delay */}
      {preferences.autoDismissing && (
        <div className="py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Tempo até dispensar</span>
            <span className="text-sm font-medium text-foreground">
              {preferences.autoDismissDelay}s
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={preferences.autoDismissDelay}
            onChange={(e) => updatePreferences({ autoDismissDelay: parseInt(e.target.value) })}
            className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      )}

      {/* Quiet Hours */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Horário de silêncio</span>
          <button
            onClick={() =>
              setQuietHours(
                !preferences.quietHours.enabled,
                preferences.quietHours.startTime,
                preferences.quietHours.endTime
              )
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.quietHours.enabled ? 'bg-primary' : 'bg-input'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {preferences.quietHours.enabled && (
          <div className="flex gap-2 text-sm">
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Início</label>
              <input
                type="time"
                value={preferences.quietHours.startTime}
                onChange={(e) =>
                  setQuietHours(true, e.target.value, preferences.quietHours.endTime)
                }
                className="w-full px-2 py-1.5 bg-accent border border-input rounded-lg text-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1">Fim</label>
              <input
                type="time"
                value={preferences.quietHours.endTime}
                onChange={(e) =>
                  setQuietHours(true, preferences.quietHours.startTime, e.target.value)
                }
                className="w-full px-2 py-1.5 bg-accent border border-input rounded-lg text-foreground"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper para obter cor da prioridade
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-destructive';
    case 'high':
      return 'bg-orange-500';
    case 'normal':
      return 'bg-primary';
    case 'low':
      return 'bg-muted-foreground';
    default:
      return 'bg-muted-foreground';
  }
}

export default NotificationCenter;
