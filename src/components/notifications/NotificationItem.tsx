import React, { useState } from 'react';
import { useNotificationsStore } from '../../stores/notificationsStore';
import type { NotificationPayload, NotificationAction } from '../../types/notifications';
import { NOTIFICATION_CATEGORY_CONFIG } from '../../types/notifications';
import { X, Check, Trash2, ChevronRight } from 'lucide-react';

// Componente de item de notificação aprimorado
export const NotificationItem: React.FC<{
  notification: NotificationPayload;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  onDelete: () => void;
  onAction: (action: NotificationAction) => void;
}> = ({ notification, onMarkAsRead, onDismiss, onDelete, onAction }) => {
  const [showActions, setShowActions] = useState(false);
  const categoryConfig = NOTIFICATION_CATEGORY_CONFIG[notification.category];
  const store = useNotificationsStore();

  const isUnread = notification.status !== 'read';
  const isDismissed = notification.status === 'dismissed';
  const priorityColor = getPriorityColor(notification.priority);

  // Verificar se esta notificação é considerada duplicata
  const isDuplicate = store.hasDuplicateNotification(
    notification.title,
    notification.message,
    notification.category
  );

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead();
    }
    setShowActions(!showActions);
  };

  return (
    <div
      className={`relative p-4 hover:bg-accent/50 transition-all cursor-pointer ${
        isUnread ? 'bg-primary/5' : ''
      } ${isDismissed ? 'opacity-50' : ''} ${isDuplicate ? 'border-2 border-orange-500/30' : ''}`}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Category Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg bg-accent ${
            isDuplicate ? 'ring-2 ring-orange-500/20' : ''
          }`}
        >
          <span>{categoryConfig.icon}</span>
          {isDuplicate && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold bg-orange-500 text-white rounded-full">
              🔁
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {isUnread && <span className={`w-2 h-2 rounded-full ${priorityColor}`} />}
              <h3
                className={`font-medium ${
                  isUnread ? 'text-foreground' : 'text-muted-foreground'
                } ${isDuplicate ? 'text-orange-600' : ''}`}
              >
                {notification.title}
                {isDuplicate && (
                  <span className="ml-1 text-xs text-orange-600 font-medium">(duplicata)</span>
                )}
              </h3>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatTimeAgo(notification.timestamp)}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{notification.message}</p>

          {/* Priority indicator */}
          {notification.priority === 'urgent' && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs text-destructive font-medium">
              <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
              Urgente
            </span>
          )}

          {/* Duplicate indicator */}
          {isDuplicate && (
            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
              <span className="w-1 h-1 bg-orange-500 rounded-full" />
              Notificação similar encontrada
            </div>
          )}

          {/* Actions */}
          {showActions && notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {notification.actions.map((action) => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(action);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    action.primary
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-accent text-foreground hover:bg-accent/80'
                  }`}
                >
                  {action.label}
                  {action.url && <ChevronRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {isUnread && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead();
              }}
              className="p-1.5 hover:bg-accent rounded transition-colors"
              title="Marcar como lida"
            >
              <Check className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-destructive/20 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {/* Priority border */}
      {notification.priority === 'urgent' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive rounded-l-lg" />
      )}
      {notification.priority === 'high' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-lg" />
      )}
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
