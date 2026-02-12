/**
 * Cliente Supabase para sincronização de notificações
 *
 * Configuração e utilitários para integração com Supabase
 * Supabase oferece generous free tier com realtime subscriptions
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Notification } from '@/types';

// Configuração do Supabase - Substitua com suas credenciais
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Tipo para registro de notificação no Supabase
export interface NotificationRecord {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  date: string;
  read: boolean;
  archived: boolean;
  snoozed_until: string | null;
  device_id: string;
  created_at: string;
  updated_at: string;
}

// Tipo para sessão de dispositivo
export interface DeviceSession {
  id: string;
  profile_id: string;
  device_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  last_active: string;
  is_current: boolean;
  created_at: string;
}

/**
 * Classe de cliente Supabase para gerenciamento de notificações
 */
export class SupabaseNotificationClient {
  private client: SupabaseClient;
  private profileId: string | null = null;
  private deviceId: string;
  private realtimeChannel: RealtimeChannel | null = null;
  private syncCallbacks: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Gera um ID único para o dispositivo
   */
  private generateDeviceId(): string {
    if (typeof window === 'undefined') return 'server';

    let deviceId = localStorage.getItem('ecofinance_device_id');
    if (!deviceId) {
      deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('ecofinance_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Inicializa o cliente com o perfil do usuário
   */
  async initialize(profileId: string): Promise<void> {
    this.profileId = profileId;

    // Registrar sessão do dispositivo
    await this.registerDeviceSession();

    // Configurar Realtime subscription
    await this.setupRealtimeSubscription();
  }

  /**
   * Registra a sessão do dispositivo atual
   */
  async registerDeviceSession(): Promise<void> {
    if (!this.profileId) return;

    const deviceInfo = this.getDeviceInfo();

    try {
      // Tentar inserir ou atualizar sessão
      const { error } = await this.client.from('device_sessions').upsert(
        {
          profile_id: this.profileId,
          device_id: this.deviceId,
          device_name: deviceInfo.name,
          device_type: deviceInfo.type,
          last_active: new Date().toISOString(),
          is_current: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'profile_id, device_id',
          ignoreDuplicates: false,
        }
      );

      if (error) {
        console.warn('Supabase: Erro ao registrar sessão do dispositivo:', error);
      }
    } catch (err) {
      console.warn('Supabase: Falha ao registrar sessão:', err);
    }
  }

  /**
   * Obtém informações do dispositivo
   */
  private getDeviceInfo(): { name: string; type: 'desktop' | 'mobile' | 'tablet' } {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    let name = 'Dispositivo Desconhecido';

    if (/mobile/i.test(ua)) {
      type = 'mobile';
    } else if (/tablet/i.test(ua)) {
      type = 'tablet';
    }

    // Extrair nome do navegador
    if (/Chrome/i.test(ua)) {
      name = 'Chrome';
    } else if (/Firefox/i.test(ua)) {
      name = 'Firefox';
    } else if (/Safari/i.test(ua)) {
      name = 'Safari';
    } else if (/Edge/i.test(ua)) {
      name = 'Edge';
    }

    return { name, type };
  }

  /**
   * Configura subscription Realtime para sincronização
   */
  private async setupRealtimeSubscription(): Promise<void> {
    if (!this.profileId) return;

    // Verificar se Realtime está disponível
    if (!this.client.realtime) {
      console.warn('Supabase Realtime não disponível');
      return;
    }

    this.realtimeChannel = this.client
      .channel(`notifications:${this.profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${this.profileId}`,
        },
        (payload: any) => {
          this.handleRealtimeEvent(payload);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('Supabase Realtime: Conectado para notificações');
        }
      });
  }

  /**
   * Processa eventos Realtime
   */
  private handleRealtimeEvent(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Notificar callbacks registrados
    const callbacks = this.syncCallbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => callback({ new: newRecord, old: oldRecord }));
    }

    // Callback geral para todos os eventos
    const allCallbacks = this.syncCallbacks.get('*');
    if (allCallbacks) {
      allCallbacks.forEach((callback) => callback(payload));
    }
  }

  /**
   * Registra callback para eventos de sincronização
   */
  onSyncEvent(eventType: string, callback: (data: any) => void): () => void {
    if (!this.syncCallbacks.has(eventType)) {
      this.syncCallbacks.set(eventType, new Set());
    }
    this.syncCallbacks.get(eventType)!.add(callback);

    // Retornar função para remover callback
    return () => {
      this.syncCallbacks.get(eventType)?.delete(callback);
    };
  }

  /**
   * Envia notificação para o Supabase
   */
  async sendNotification(notification: Notification): Promise<void> {
    if (!this.profileId) return;

    try {
      const { error } = await this.client.from('notifications').insert({
        id: `${notification.id}`,
        profile_id: this.profileId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        priority: notification.priority || 'normal',
        date: notification.date,
        read: notification.read,
        archived: notification.archived || false,
        snoozed_until: notification.snoozedUntil || null,
        device_id: this.deviceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Supabase: Erro ao enviar notificação:', error);
      }
    } catch (err) {
      console.warn('Supabase: Falha ao enviar notificação:', err);
    }
  }

  /**
   * Sincroniza notificações locais com o Supabase
   */
  async syncNotifications(localNotifications: Notification[]): Promise<Notification[]> {
    if (!this.profileId) return localNotifications;

    try {
      // Buscar notificações do Supabase
      const { data: remoteNotifications, error } = await this.client
        .from('notifications')
        .select('*')
        .eq('profile_id', this.profileId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Supabase: Erro ao buscar notificações:', error);
        return localNotifications;
      }

      if (!remoteNotifications || remoteNotifications.length === 0) {
        return localNotifications;
      }

      // Converter registros remotos para formato local
      const remoteFormatted = remoteNotifications.map((record: NotificationRecord) => ({
        id: parseInt(record.id) || Date.now(),
        title: record.title,
        message: record.message,
        type: record.type as any,
        category: record.category as any,
        priority: record.priority as any,
        date: record.date,
        read: record.read,
        archived: record.archived,
        snoozedUntil: record.snoozed_until || undefined,
        profileId: record.profile_id,
      }));

      // Mesclar notificações locais e remotas
      const merged = this.mergeNotifications(localNotifications, remoteFormatted);

      return merged;
    } catch (err) {
      console.warn('Supabase: Falha na sincronização:', err);
      return localNotifications;
    }
  }

  /**
   * Mescla notificações locais e remotas com resolução de conflitos
   */
  private mergeNotifications(local: Notification[], remote: Notification[]): Notification[] {
    const notificationMap = new Map<number, Notification>();

    // Adicionar notificações locais
    local.forEach((n) => {
      notificationMap.set(n.id, n);
    });

    // Processar notificações remotas
    remote.forEach((r) => {
      const existing = notificationMap.get(r.id);

      if (!existing) {
        // Nova notificação do remoto
        notificationMap.set(r.id, r);
      } else {
        // Resolução de conflitos baseada em timestamp
        const localUpdated = new Date(existing.date).getTime();
        const remoteUpdated = new Date(r.date).getTime();

        // Se a versão remota for mais recente, usar ela
        if (remoteUpdated > localUpdated) {
          notificationMap.set(r.id, r);
        }
        // Se for mais antiga, manter a local
      }
    });

    // Converter para array e limitar
    const merged = Array.from(notificationMap.values());

    // Ordenar por data (mais recentes primeiro)
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Limitar a 50 notificações
    return merged.slice(0, 50);
  }

  /**
   * Atualiza status de leitura no Supabase
   */
  async markAsRead(notificationId: number): Promise<void> {
    if (!this.profileId) return;

    try {
      const { error } = await this.client
        .from('notifications')
        .update({
          read: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notificationId.toString())
        .eq('profile_id', this.profileId);

      if (error) {
        console.warn('Supabase: Erro ao marcar como lida:', error);
      }
    } catch (err) {
      console.warn('Supabase: Falha ao atualizar status:', err);
    }
  }

  /**
   * Remove notificação no Supabase
   */
  async deleteNotification(notificationId: number): Promise<void> {
    if (!this.profileId) return;

    try {
      const { error } = await this.client
        .from('notifications')
        .delete()
        .eq('id', notificationId.toString())
        .eq('profile_id', this.profileId);

      if (error) {
        console.warn('Supabase: Erro ao excluir notificação:', error);
      }
    } catch (err) {
      console.warn('Supabase: Falha ao excluir:', err);
    }
  }

  /**
   * Faz backup das notificações para o Supabase
   */
  async backupNotifications(notifications: Notification[]): Promise<boolean> {
    if (!this.profileId) return false;

    try {
      // Preparar registros para inserção em lote
      const records = notifications.map((n) => ({
        id: `${n.id}`,
        profile_id: this.profileId,
        title: n.title,
        message: n.message,
        type: n.type,
        category: n.category,
        priority: n.priority || 'normal',
        date: n.date,
        read: n.read,
        archived: n.archived || false,
        snoozed_until: n.snoozedUntil || null,
        device_id: this.deviceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Upsert em lotes (máximo 1000 por operação)
      const { error } = await this.client.from('notifications').upsert(records, {
        onConflict: 'id, profile_id',
        ignoreDuplicates: false,
      });

      if (error) {
        console.warn('Supabase: Erro no backup:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Supabase: Falha no backup:', err);
      return false;
    }
  }

  /**
   * Restaura notificações do Supabase
   */
  async restoreNotifications(): Promise<Notification[]> {
    if (!this.profileId) return [];

    try {
      const { data, error } = await this.client
        .from('notifications')
        .select('*')
        .eq('profile_id', this.profileId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Supabase: Erro na restauração:', error);
        return [];
      }

      return (data || []).map((record: NotificationRecord) => ({
        id: parseInt(record.id) || Date.now(),
        title: record.title,
        message: record.message,
        type: record.type as any,
        category: record.category as any,
        priority: record.priority as any,
        date: record.date,
        read: record.read,
        archived: record.archived,
        snoozedUntil: record.snoozed_until || undefined,
        profileId: record.profile_id,
      }));
    } catch (err) {
      console.warn('Supabase: Falha na restauração:', err);
      return [];
    }
  }

  /**
   * Obtém dispositivos ativos para o perfil
   */
  async getActiveDevices(): Promise<DeviceSession[]> {
    if (!this.profileId) return [];

    try {
      const { data, error } = await this.client
        .from('device_sessions')
        .select('*')
        .eq('profile_id', this.profileId)
        .order('last_active', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('Supabase: Erro ao buscar dispositivos:', error);
        return [];
      }

      return (data || []) as DeviceSession[];
    } catch (err) {
      console.warn('Supabase: Falha ao buscar dispositivos:', err);
      return [];
    }
  }

  /**
   * Remove sessão do dispositivo atual
   */
  async removeCurrentDevice(): Promise<void> {
    if (!this.profileId) return;

    try {
      await this.client
        .from('device_sessions')
        .delete()
        .eq('profile_id', this.profileId)
        .eq('device_id', this.deviceId);
    } catch (err) {
      console.warn('Supabase: Falha ao remover dispositivo:', err);
    }
  }

  /**
   * Desconecta e limpa recursos
   */
  async disconnect(): Promise<void> {
    if (this.realtimeChannel) {
      await this.client.channel(`notifications:${this.profileId}`).unsubscribe();
      this.realtimeChannel = null;
    }

    this.syncCallbacks.clear();
    this.profileId = null;
  }
}

// Singleton instance
export const supabaseClient = new SupabaseNotificationClient();

/**
 * Verifica se o Supabase está configurado e disponível
 */
export function isSupabaseConfigured(): boolean {
  return (
    SUPABASE_URL !== 'https://your-project.supabase.co' &&
    SUPABASE_ANON_KEY !== 'your-anon-key' &&
    typeof window !== 'undefined'
  );
}
