import { useNotificationsStore } from '@/stores/notificationsStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationsStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = Math.floor(diffTime / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diffTime / (1000 * 60));
        return minutes < 5 ? 'Agora' : `${minutes} min atrás`;
      }
      return `${hours}h atrás`;
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 w-80 max-h-[600px] overflow-y-auto bg-card rounded-lg border border-border shadow-lg z-40">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold">Notificações</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  notification.read
                    ? 'bg-muted border-transparent opacity-60'
                    : 'bg-background border-border hover:bg-muted'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(notification.date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={markAllAsRead}
            className="px-3 py-2 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            Marcar todas como lidas
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-2 text-xs bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            Limpar tudo
          </button>
        </div>
      </div>
    </div>
  );
}
