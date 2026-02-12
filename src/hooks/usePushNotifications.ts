/**
 * Hook para gerenciar Push Notifications usando Web Push API
 *
 * Suporta notificações nativas no navegador e dispositivos móveis
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseClient, isSupabaseConfigured } from '@/lib/supabase';

// Tipo para permissão de notificação
export type NotificationPermission = 'granted' | 'denied' | 'default';

// Configuração do service worker para Vite
const SW_PATH = '/sw.js';
const VAPID_PUBLIC_KEY = import.meta.env?.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Hook principal para gerenciar push notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Verificar suporte e permissão atual
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported) {
        const currentPermission = Notification.permission as NotificationPermission;
        setPermission(currentPermission);
      }
    };

    checkSupport();
  }, []);

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    try {
      const result = await Notification.requestPermission();
      const permissionResult = result as NotificationPermission;
      setPermission(permissionResult);
      return permissionResult;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return 'denied';
    }
  }, [isSupported]);

  // Registrar service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isSupported || typeof navigator === 'undefined') return null;

    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: '/',
      });

      console.log('Service Worker registrado:', registration);
      return registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return null;
    }
  }, [isSupported]);

  // Inscrever-se para push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null;

    setIsLoading(true);
    try {
      // Registrar service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        console.warn('Service Worker não registrado');
        return null;
      }

      // Verificar assinatura existente
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsLoading(false);
        return existingSubscription;
      }

      // Criar nova assinatura (se VAPID_KEY estiver configurado)
      if (VAPID_PUBLIC_KEY) {
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });

        setSubscription(newSubscription);

        // Enviar assinatura para o servidor
        await sendSubscriptionToServer(newSubscription);

        setIsLoading(false);
        return newSubscription;
      }

      // Sem VAPID_KEY - apenas notificação local
      console.log('VAPID_PUBLIC_KEY não configurada - usando apenas notificações locais');
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Erro ao suscribar:', error);
      setIsLoading(false);
      return null;
    }
  }, [isSupported, permission, registerServiceWorker]);

  // Cancelar assinatura
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return true;

    setIsLoading(true);
    try {
      const result = await subscription.unsubscribe();

      if (result) {
        setSubscription(null);
        // Remover do servidor
        await removeSubscriptionFromServer(subscription);
      }

      setIsLoading(false);
      return result;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      setIsLoading(false);
      return false;
    }
  }, [subscription]);

  // Enviar notificação local
  const showLocalNotification = useCallback(
    (
      title: string,
      options?: NotificationOptions & { body?: string; icon?: string; data?: any }
    ): Notification | null => {
      if (!isSupported || permission !== 'granted') {
        console.warn('Notificações não suportadas ou permissão negada');
        return null;
      }

      try {
        const notification = new Notification(title, {
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error('Erro ao mostrar notificação:', error);
        return null;
      }
    },
    [isSupported, permission]
  );

  // Mostrar toast no app (fallback quando notificações nativas não estão disponíveis)
  const showAppToast = useCallback(
    (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      // Disparar evento customizado que pode ser ouvido pelo componente Toast
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('app-toast', {
          detail: { title, message, type, timestamp: Date.now() },
        });
        window.dispatchEvent(event);
      }
    },
    []
  );

  return {
    permission,
    isSupported,
    isLoading,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
    showAppToast,
  };
}

/**
 * Hook para gerenciar sincronização de notificações com Supabase
 */
export function useNotificationSync(profileId: string | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Inicializar Supabase quando profileId estiver disponível
  useEffect(() => {
    if (!profileId || !isSupabaseConfigured()) return;

    const initSync = async () => {
      await supabaseClient.initialize(profileId);
    };

    initSync();

    return () => {
      supabaseClient.disconnect();
    };
  }, [profileId]);

  // Sincronizar notificações
  const syncNotifications = useCallback(
    async (localNotifications: any[]): Promise<any[]> => {
      if (!isSupabaseConfigured() || !isOnline || !profileId) {
        console.log('Supabase não configurado ou offline - usando apenas dados locais');
        return localNotifications;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        const synced = await supabaseClient.syncNotifications(localNotifications);
        setLastSync(new Date());
        setIsSyncing(false);
        return synced;
      } catch (error) {
        console.error('Erro na sincronização:', error);
        setSyncError(error instanceof Error ? error.message : 'Erro na sincronização');
        setIsSyncing(false);
        return localNotifications;
      }
    },
    [profileId, isOnline]
  );

  // Fazer backup
  const backupNotifications = useCallback(
    async (notifications: any[]): Promise<boolean> => {
      if (!isSupabaseConfigured() || !isOnline || !profileId) {
        return false;
      }

      try {
        return await supabaseClient.backupNotifications(notifications);
      } catch (error) {
        console.error('Erro no backup:', error);
        return false;
      }
    },
    [profileId, isOnline]
  );

  // Restaurar
  const restoreNotifications = useCallback(async (): Promise<any[]> => {
    if (!isSupabaseConfigured() || !isOnline || !profileId) {
      return [];
    }

    try {
      return await supabaseClient.restoreNotifications();
    } catch (error) {
      console.error('Erro na restauração:', error);
      return [];
    }
  }, [profileId, isOnline]);

  return {
    isSyncing,
    lastSync,
    syncError,
    isOnline,
    syncNotifications,
    backupNotifications,
    restoreNotifications,
  };
}

/**
 * Hook para gerenciar múltiplas sessões de dispositivos
 */
export function useDeviceSessions(profileId: string | null) {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    if (!profileId || !isSupabaseConfigured()) return;

    setIsLoading(true);
    try {
      const deviceList = await supabaseClient.getActiveDevices();
      setDevices(deviceList);
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  const removeDevice = useCallback(
    async (_deviceId: string) => {
      if (!profileId || !isSupabaseConfigured()) return false;

      try {
        // Remover do Supabase (apenas o próprio dispositivo pode se remover)
        await supabaseClient.removeCurrentDevice();
        await fetchDevices();
        return true;
      } catch (error) {
        console.error('Erro ao remover dispositivo:', error);
        return false;
      }
    },
    [profileId, fetchDevices]
  );

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    isLoading,
    refreshDevices: fetchDevices,
    removeDevice,
  };
}

/**
 * Utilitário para converter VAPID key base64 para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Enviar assinatura para o servidor
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
      console.warn('Falha ao enviar assinatura para o servidor');
    }
  } catch (error) {
    console.warn('Erro ao enviar assinatura:', error);
  }
}

/**
 * Remover assinatura do servidor
 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
      console.warn('Falha ao remover assinatura do servidor');
    }
  } catch (error) {
    console.warn('Erro ao remover assinatura:', error);
  }
}

// Interface para opções de notificação
interface NotificationOptions {
  dir?: 'ltr' | 'rtl' | 'auto';
  lang?: string;
  badge?: string;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  noscreen?: boolean;
  sticky?: boolean;
}
