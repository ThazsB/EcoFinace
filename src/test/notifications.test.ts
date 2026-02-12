import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { StringSimilarity } from '@/utils/similarity/stringSimilarity';
import type { NotificationPayload } from '@/types/notifications';

describe('Sistema de Verificação de Duplicidade', () => {
  beforeEach(() => {
    // Limpar store antes de cada teste
    useNotificationsStore.setState({
      notifications: [],
      unreadCount: 0,
      preferences: {
        globalEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        autoDismissing: true,
        autoDismissDelay: 5,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'America/Sao_Paulo',
          excludeWeekends: false,
          excludeHolidays: false,
        },
        categories: {
          budget: {
            enabled: true,
            channels: ['in_app', 'push'],
            frequency: 'realtime',
            quietHoursRespected: true,
          },
          goal: {
            enabled: true,
            channels: ['in_app', 'push'],
            frequency: 'realtime',
            quietHoursRespected: true,
          },
          transaction: {
            enabled: true,
            channels: ['in_app', 'push'],
            frequency: 'realtime',
            quietHoursRespected: true,
          },
          reminder: {
            enabled: true,
            channels: ['in_app', 'push'],
            frequency: 'realtime',
            quietHoursRespected: true,
          },
          report: {
            enabled: true,
            channels: ['in_app', 'push'],
            frequency: 'realtime',
            quietHoursRespected: true,
          },
          system: {
            enabled: true,
            channels: ['in_app', 'push'],
            frequency: 'realtime',
            quietHoursRespected: true,
          },
          insight: {
            enabled: true,
            channels: ['in_app', 'push'],
            frequency: 'realtime',
            quietHoursRespected: true,
          },
          achievement: {
            enabled: true,
            channels: ['in_app', 'push'],
            frequency: 'realtime',
            quietHoursRespected: true,
          },
        },
        push: { enabled: true, showPreview: 'always', replaceOldNotifications: true },
        summary: { enabled: false, frequency: 'never', includeCategories: [] },
        privacy: { hideAmounts: false, hideDescriptions: false },
        userId: 'test-user',
        profileId: 'test-profile',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,
      isCenterOpen: false,
      isPermissionRequested: false,
    });
  });

  describe('Verificação de Duplicatas Exatas', () => {
    it('deve detectar notificações exatamente iguais', () => {
      const notification1 = {
        title: 'Orçamento ultrapassado',
        message: 'Você ultrapassou o limite do orçamento de alimentação',
        category: 'budget' as const,
        priority: 'high' as const,
        channels: ['in_app'] as Array<'in_app'>,
        profileId: 'test-profile',
      };

      const notification2 = {
        title: 'Orçamento ultrapassado',
        message: 'Você ultrapassou o limite do orçamento de alimentação',
        category: 'budget' as const,
        priority: 'high' as const,
        channels: ['in_app'] as Array<'in_app'>,
        profileId: 'test-profile',
      };

      useNotificationsStore.getState().addNotification(notification1);
      const isDuplicate = useNotificationsStore
        .getState()
        .hasDuplicateNotification(
          notification2.title,
          notification2.message,
          notification2.category
        );

      expect(isDuplicate).toBe(true);
    });

    it('deve permitir notificações com mesmo título mas mensagens diferentes', () => {
      const notification1 = {
        title: 'Fatura do cartão fechada',
        message: 'Sua fatura de R$ 250,00 está fechada e será debitada em 10 dias',
        category: 'transaction' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      const notification2 = {
        title: 'Fatura do cartão fechada',
        message: 'Sua fatura de R$ 350,00 está fechada e será debitada em 7 dias',
        category: 'transaction' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      useNotificationsStore.getState().addNotification(notification1);
      const isDuplicate = useNotificationsStore
        .getState()
        .hasDuplicateNotification(
          notification2.title,
          notification2.message,
          notification2.category
        );

      expect(isDuplicate).toBe(false);
    });
  });

  describe('Verificação de Similaridade', () => {
    it('deve detectar títulos similares (jaro similarity)', () => {
      const notification1 = {
        title: 'Orçamento de alimentação ultrapassado',
        message: 'Você gastou muito em alimentação este mês',
        category: 'budget' as const,
        priority: 'high' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      const notification2 = {
        title: 'Orçamento de alimentação ultrapassado',
        message: 'Seus gastos com alimentação estão altos',
        category: 'budget' as const,
        priority: 'high' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      useNotificationsStore.getState().addNotification(notification1);
      const isDuplicate = useNotificationsStore
        .getState()
        .hasDuplicateNotification(
          notification2.title,
          notification2.message,
          notification2.category
        );

      expect(isDuplicate).toBe(true);
    });

    it('deve detectar mensagens similares (cosine similarity)', () => {
      const notification1 = {
        title: 'Transação aprovada',
        message: 'Sua transferência de R$ 500,00 para João Silva foi aprovada com sucesso',
        category: 'transaction' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      const notification2 = {
        title: 'Transferência aprovada',
        message: 'Sua transferência de R$ 500,00 para João Silva foi aprovada com sucesso',
        category: 'transaction' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      useNotificationsStore.getState().addNotification(notification1);
      const isDuplicate = useNotificationsStore
        .getState()
        .hasDuplicateNotification(
          notification2.title,
          notification2.message,
          notification2.category
        );

      expect(isDuplicate).toBe(true);
    });

    it('não deve detectar notificações com conteúdo muito diferente', () => {
      const notification1 = {
        title: 'Meta de poupança alcançada',
        message: 'Parabéns! Você atingiu sua meta de poupar R$ 1000,00',
        category: 'goal' as const,
        priority: 'high' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      const notification2 = {
        title: 'Fatura do cartão fechada',
        message: 'Sua fatura de R$ 250,00 está fechada e será debitada em 10 dias',
        category: 'transaction' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      useNotificationsStore.getState().addNotification(notification1);
      const isDuplicate = useNotificationsStore
        .getState()
        .hasDuplicateNotification(
          notification2.title,
          notification2.message,
          notification2.category
        );

      expect(isDuplicate).toBe(false);
    });
  });

  describe('Utilidade de Similaridade', () => {
    it('deve calcular similaridade Jaro-Winkler corretamente', () => {
      const result1 = StringSimilarity.compare('orçamento', 'orcamento', { method: 'jaro' });
      expect(result1.similarity).toBeGreaterThan(0.9);

      const result2 = StringSimilarity.compare('transferência', 'transferencia', {
        method: 'jaro',
      });
      expect(result2.similarity).toBeGreaterThan(0.9);

      const result3 = StringSimilarity.compare('meta', 'objetivo', { method: 'jaro' });
      expect(result3.similarity).toBeLessThan(0.6);
    });

    it('deve calcular similaridade por Cosseno corretamente', () => {
      const result1 = StringSimilarity.compare('gastei muito dinheiro', 'gastei muito dinheiro', {
        method: 'cosine',
      });
      expect(result1.similarity).toBe(1);

      const result2 = StringSimilarity.compare('comprei comida', 'comprei roupas', {
        method: 'cosine',
      });
      expect(result2.similarity).toBeLessThan(0.6);

      const result3 = StringSimilarity.compare(
        'transferência bancária',
        'transferência financeira',
        { method: 'cosine' }
      );
      expect(result3.similarity).toBeGreaterThan(0.6);
    });

    it('deve normalizar strings corretamente', () => {
      const result1 = StringSimilarity.compare('Orçamento!', 'orcamento', { normalize: true });
      expect(result1.isDuplicate).toBe(true);

      const result2 = StringSimilarity.compare('META@2024', 'meta 2024', { normalize: true });
      expect(result2.isDuplicate).toBe(true);

      const result3 = StringSimilarity.compare('  Meta  ', 'meta', { normalize: true });
      expect(result3.isDuplicate).toBe(true);
    });
  });

  describe('Debounce e Fila', () => {
    it('deve adicionar notificações à fila quando limite atingido', () => {
      // Simular limite de toasts atingido
      useNotificationsStore.setState({
        notifications: Array(5).fill({
          id: 'test-id',
          title: 'Teste',
          message: 'Teste',
          category: 'system' as const,
          priority: 'normal' as const,
          channels: ['in_app'] as Array<'in_app'>,
          timestamp: new Date().toISOString(),
          status: 'sent' as const,
        }),
        unreadCount: 5,
      });

      const notification = {
        title: 'Nova notificação',
        message: 'Esta é uma nova notificação',
        category: 'system' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      const result = useNotificationsStore.getState().addNotification(notification);
      expect(result).toBe(true); // Deve retornar true pois foi para a fila
    });

    it('deve processar notificações da fila quando espaço disponível', () => {
      // Simular notificações na fila
      const queuedNotification = {
        title: 'Notificação em fila',
        message: 'Esta notificação estava na fila',
        category: 'system' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      // Adicionar à fila manualmente
      localStorage.setItem('notification_queue', JSON.stringify([queuedNotification]));

      // Processar fila
      useNotificationsStore.getState().processQueuedNotifications();

      // Verificar se foi processada
      const notifications = useNotificationsStore.getState().notifications;
      const found = notifications.find(
        (n) => n.title === queuedNotification.title && n.message === queuedNotification.message
      );

      expect(found).toBeDefined();
    });
  });

  describe('Configurações e Preferências', () => {
    it('deve respeitar configurações de horário de silêncio', () => {
      // Configurar horário de silêncio
      useNotificationsStore.getState().updatePreferences({
        quietHours: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'America/Sao_Paulo',
          excludeWeekends: false,
          excludeHolidays: false,
        },
      });

      // Simular notificação durante horário de silêncio
      const notification = {
        title: 'Teste durante silêncio',
        message: 'Esta notificação deve ir para a fila',
        category: 'system' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      };

      const result = useNotificationsStore.getState().addNotification(notification);
      expect(result).toBe(true); // Deve retornar true pois foi para a fila
    });

    it('deve respeitar limites diários por categoria', () => {
      // Adicionar notificações até o limite
      for (let i = 0; i < 5; i++) {
        useNotificationsStore.getState().addNotification({
          title: `Teste ${i}`,
          message: 'Mensagem de teste',
          category: 'budget' as const,
          priority: 'normal' as const,
          channels: ['in_app'] as Array<'in_app'>,
        });
      }

      // Tentar adicionar mais uma notificação
      const result = useNotificationsStore.getState().addNotification({
        title: 'Teste extra',
        message: 'Mensagem extra',
        category: 'budget' as const,
        priority: 'normal' as const,
        channels: ['in_app'] as Array<'in_app'>,
      });

      expect(result).toBe(false); // Deve retornar false pois limite atingido
    });
  });
});
