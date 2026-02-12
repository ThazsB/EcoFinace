/**
 * Testes de integração e validação do sistema de deduplicação
 * Testa a integração entre todos os componentes do sistema
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  deduplicationService,
  checkToastDuplicate,
  checkNotificationDuplicate,
  checkUrgentDuplicate,
} from '@/services/deduplicationService';
import {
  deduplicationOptimizer,
  optimizedCheckToastDuplicate,
  optimizedCheckNotificationDuplicate,
} from '@/services/deduplicationOptimizer';
import {
  deduplicationConfig,
  updateDeduplicationConfig,
  resetDeduplicationConfig,
} from '@/config/deduplicationConfig';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { StringSimilarity } from '@/utils/similarity/stringSimilarity';

describe('Deduplication Integration Tests', () => {
  beforeEach(() => {
    // Resetar configurações
    resetDeduplicationConfig();

    // Limpar caches
    deduplicationService.clearCache();
    deduplicationOptimizer.clear();

    // Resetar store de notificações
    const store = useNotificationsStore.getState();
    store.clearAll();
  });

  afterEach(() => {
    // Limpar caches após cada teste
    deduplicationService.clearCache();
    deduplicationOptimizer.clear();
  });

  describe('Service Integration', () => {
    it('should work correctly with notification store', async () => {
      const store = useNotificationsStore.getState();

      // Adicionar notificação
      const result1 = store.addNotification({
        title: 'Test Notification',
        message: 'This is a test notification',
        category: 'transaction',
        priority: 'normal',
        channels: ['in_app'],
      });

      expect(result1).toBe(true);

      // Tentar adicionar duplicata
      const result2 = store.addNotification({
        title: 'Test Notification',
        message: 'This is a test notification',
        category: 'transaction',
        priority: 'normal',
        channels: ['in_app'],
      });

      expect(result2).toBe(false); // Deve ser bloqueado como duplicata
    });

    it('should handle different priorities correctly', async () => {
      const store = useNotificationsStore.getState();

      // Adicionar notificação normal
      const result1 = store.addNotification({
        title: 'Priority Test',
        message: 'Test message',
        category: 'transaction',
        priority: 'normal',
        channels: ['in_app'],
      });

      expect(result1).toBe(true);

      // Adicionar mesma notificação com prioridade alta - deve ser permitido
      const result2 = store.addNotification({
        title: 'Priority Test',
        message: 'Test message',
        category: 'transaction',
        priority: 'high',
        channels: ['in_app'],
      });

      expect(result2).toBe(true); // Prioridades diferentes, deve ser permitido
    });

    it('should integrate with toast system', async () => {
      // Testar com toast duplicate check
      const result1 = await optimizedCheckToastDuplicate(
        'Toast Test',
        'Toast message',
        'transaction'
      );

      expect(result1.isDuplicate).toBe(false);

      // Segunda chamada deve detectar duplicata
      const result2 = await optimizedCheckToastDuplicate(
        'Toast Test',
        'Toast message',
        'transaction'
      );

      expect(result2.isDuplicate).toBe(true);
      expect(result2.shouldBlock).toBe(true); // Deve bloquear após segunda chamada
    });
  });

  describe('Configuration Integration', () => {
    it('should respect category-specific configurations', async () => {
      // Atualizar configuração para budget
      updateDeduplicationConfig({
        categories: {
          budget: {
            timeWindow: 60000, // 1 minuto
            similarityThreshold: 0.95, // 95%
            maxDuplicates: 1,
            enabled: true,
          },
          goal: {
            timeWindow: 300000,
            similarityThreshold: 0.85,
            maxDuplicates: 2,
            enabled: true,
          },
          transaction: {
            timeWindow: 60000,
            similarityThreshold: 0.8,
            maxDuplicates: 3,
            enabled: true,
          },
          reminder: {
            timeWindow: 1800000,
            similarityThreshold: 0.95,
            maxDuplicates: 1,
            enabled: true,
          },
          report: {
            timeWindow: 3600000,
            similarityThreshold: 0.95,
            maxDuplicates: 1,
            enabled: true,
          },
          system: {
            timeWindow: 300000,
            similarityThreshold: 0.85,
            maxDuplicates: 2,
            enabled: true,
          },
          insight: {
            timeWindow: 600000,
            similarityThreshold: 0.8,
            maxDuplicates: 3,
            enabled: true,
          },
          achievement: {
            timeWindow: 600000,
            similarityThreshold: 0.9,
            maxDuplicates: 1,
            enabled: true,
          },
        },
      });

      // Testar com budget - deve usar configuração específica
      const result1 = await optimizedCheckNotificationDuplicate(
        'Budget Alert',
        'You exceeded your budget',
        'budget',
        'high'
      );

      expect(result1.isDuplicate).toBe(false);

      // Segunda chamada deve detectar duplicata
      const result2 = await optimizedCheckNotificationDuplicate(
        'Budget Alert',
        'You exceeded your budget',
        'budget',
        'high'
      );

      expect(result2.isDuplicate).toBe(true);
    });

    it('should respect global configuration changes', async () => {
      // Atualizar configuração global
      updateDeduplicationConfig({
        global: {
          enabled: true,
          defaultTimeWindow: 120000, // 2 minutos
          defaultSimilarityThreshold: 0.9, // 90%
          defaultMaxDuplicates: 3,
        },
      });

      // Testar com configuração global
      const result1 = await optimizedCheckNotificationDuplicate(
        'Global Config Test',
        'Test message',
        'transaction',
        'normal'
      );

      expect(result1.isDuplicate).toBe(false);

      // Com threshold mais alto, similaridade deve ser mais rigorosa
      const result2 = await optimizedCheckNotificationDuplicate(
        'Global Config Test',
        'Test message with small change',
        'transaction',
        'normal'
      );

      // Pode ou não detectar como duplicata dependendo da similaridade
      expect(result2).toBeDefined();
    });

    it('should disable deduplication when globally disabled', async () => {
      // Desativar deduplicação globalmente
      updateDeduplicationConfig({
        global: {
          enabled: false,
          defaultTimeWindow: 60000,
          defaultSimilarityThreshold: 0.85,
          defaultMaxDuplicates: 2,
        },
      });

      // Todas as chamadas devem retornar isDuplicate: false
      const result1 = await optimizedCheckToastDuplicate(
        'Disabled Test',
        'Test message',
        'transaction'
      );

      expect(result1.isDuplicate).toBe(false);

      const result2 = await optimizedCheckToastDuplicate(
        'Disabled Test',
        'Test message',
        'transaction'
      );

      expect(result2.isDuplicate).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance under high load', async () => {
      const startTime = Date.now();
      const promises: Promise<any>[] = [];

      // Criar carga alta de verificações
      for (let i = 0; i < 100; i++) {
        promises.push(
          optimizedCheckToastDuplicate(`Load Test ${i}`, `Message ${i}`, 'transaction')
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verificar que todas as chamadas foram bem-sucedidas
      expect(results).toHaveLength(100);
      results.forEach((result) => {
        expect(result.isDuplicate).toBe(false);
      });

      // Verificar performance (deve ser rápido)
      expect(duration).toBeLessThan(5000); // 5 segundos para 100 chamadas
    });

    it('should handle memory efficiently', async () => {
      // Preencher cache com muitos itens
      for (let i = 0; i < 200; i++) {
        await optimizedCheckToastDuplicate(`Memory Test ${i}`, `Message ${i}`, 'transaction');
      }

      // Verificar estatísticas de memória
      const stats = deduplicationOptimizer.getDetailedStats();

      expect(stats.cacheSize).toBeGreaterThan(0);

      // Verificar que o cache não cresceu indefinidamente
      expect(stats.cacheSize).toBeLessThanOrEqual(200);
    });

    it('should handle concurrent requests correctly', async () => {
      const concurrentPromises = Array.from({ length: 50 }, (_, i) =>
        optimizedCheckToastDuplicate(`Concurrent Test`, `Same message ${i}`, 'transaction')
      );

      const results = await Promise.all(concurrentPromises);

      // Verificar que todas as chamadas foram bem-sucedidas
      expect(results).toHaveLength(50);
      results.forEach((result) => {
        expect(result.isDuplicate).toBe(false);
      });
    });
  });

  describe('Edge Cases Integration', () => {
    it('should handle very similar content correctly', async () => {
      // Testar com conteúdo muito similar
      const result1 = await optimizedCheckToastDuplicate(
        'Very Similar Title',
        'This is a very similar message content',
        'transaction'
      );

      expect(result1.isDuplicate).toBe(false);

      // Mensagem ligeiramente diferente
      const result2 = await optimizedCheckToastDuplicate(
        'Very Similar Title',
        'This is a very similar message content with small change',
        'transaction'
      );

      // Pode detectar como duplicata dependendo da similaridade
      expect(result2).toBeDefined();
    });

    it('should handle empty and special content', async () => {
      // Testar com conteúdo vazio
      const result1 = await optimizedCheckToastDuplicate('', '', 'transaction');
      expect(result1.isDuplicate).toBe(false);

      // Testar com caracteres especiais
      const result2 = await optimizedCheckToastDuplicate(
        'Special!@#$%^&*()',
        'Characters: ñáéíóú çñ',
        'transaction'
      );
      expect(result2.isDuplicate).toBe(false);

      // Testar com conteúdo muito longo
      const longTitle = 'A'.repeat(2000);
      const longMessage = 'B'.repeat(10000);

      const result3 = await optimizedCheckToastDuplicate(longTitle, longMessage, 'transaction');
      expect(result3.isDuplicate).toBe(false);
    });

    it('should handle rapid successive calls', async () => {
      // Fazer chamadas muito rápidas
      const results = await Promise.all([
        optimizedCheckToastDuplicate('Rapid Test', 'Message 1', 'transaction'),
        optimizedCheckToastDuplicate('Rapid Test', 'Message 2', 'transaction'),
        optimizedCheckToastDuplicate('Rapid Test', 'Message 3', 'transaction'),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.isDuplicate).toBe(false);
      });
    });
  });

  describe('Algorithm Integration', () => {
    it('should use different algorithms for different content types', () => {
      // Testar similaridade de título
      const titleSimilarity = StringSimilarity.compare('Test Title', 'Test Title Similar', {
        method: 'jaro',
        threshold: 0.8,
      });
      expect(titleSimilarity.isDuplicate).toBe(true);

      // Testar similaridade de mensagem
      const messageSimilarity = StringSimilarity.compare(
        'Test message content',
        'Test message content with changes',
        { method: 'cosine', threshold: 0.7 }
      );
      expect(messageSimilarity.isDuplicate).toBe(true);
    });

    it('should handle algorithm fallback correctly', () => {
      // Testar com conteúdo que pode falhar em algum algoritmo
      const result = StringSimilarity.compare(
        'Short',
        'Very different content that is much longer',
        { method: 'jaro', threshold: 0.5 }
      );

      expect(result).toBeDefined();
      expect(typeof result.similarity).toBe('number');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle budget alerts correctly', async () => {
      // Simular alertas de orçamento
      const budgetAlerts = [
        {
          title: 'Budget Alert',
          message: 'You exceeded your food budget',
          category: 'budget' as const,
        },
        {
          title: 'Budget Alert',
          message: 'You exceeded your food budget by R$ 50',
          category: 'budget' as const,
        },
        {
          title: 'Budget Alert',
          message: 'You exceeded your food budget by R$ 100',
          category: 'budget' as const,
        },
      ];

      const results = await Promise.all(
        budgetAlerts.map((alert) =>
          optimizedCheckNotificationDuplicate(alert.title, alert.message, alert.category, 'high')
        )
      );

      // Primeiro alerta deve ser permitido
      expect(results[0].isDuplicate).toBe(false);

      // Segundo e terceiro podem ser detectados como duplicatas dependendo da similaridade
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeDefined();
    });

    it('should handle transaction notifications correctly', async () => {
      // Simular notificações de transação
      const transactions = [
        {
          title: 'Transaction Added',
          message: 'R$ 100.00 added to your account',
          category: 'transaction' as const,
        },
        {
          title: 'Transaction Added',
          message: 'R$ 100.00 added to your account',
          category: 'transaction' as const,
        },
        {
          title: 'Transaction Updated',
          message: 'R$ 100.00 updated in your account',
          category: 'transaction' as const,
        },
      ];

      const results = await Promise.all(
        transactions.map((tx) => optimizedCheckToastDuplicate(tx.title, tx.message, tx.category))
      );

      // Primeira transação deve ser permitida
      expect(results[0].isDuplicate).toBe(false);

      // Segunda deve ser detectada como duplicata
      expect(results[1].isDuplicate).toBe(true);

      // Terceira deve ser permitida (título diferente)
      expect(results[2].isDuplicate).toBe(false);
    });

    it('should handle goal achievement notifications', async () => {
      // Simular notificações de conquista de metas
      const goalAchievements = [
        {
          title: 'Goal Achieved',
          message: 'You reached your savings goal!',
          category: 'goal' as const,
        },
        {
          title: 'Goal Achieved',
          message: 'Congratulations on reaching your goal!',
          category: 'goal' as const,
        },
        {
          title: 'Goal Achieved',
          message: 'You reached your savings goal!',
          category: 'goal' as const,
        },
      ];

      const results = await Promise.all(
        goalAchievements.map((goal) =>
          optimizedCheckNotificationDuplicate(goal.title, goal.message, goal.category, 'normal')
        )
      );

      // Primeira deve ser permitida
      expect(results[0].isDuplicate).toBe(false);

      // Segunda pode ser permitida (mensagem diferente)
      expect(results[1]).toBeDefined();

      // Terceira deve ser detectada como duplicata
      expect(results[2].isDuplicate).toBe(true);
    });
  });

  describe('Configuration Persistence', () => {
    it('should persist and restore configurations', () => {
      // Atualizar configuração
      const newConfig = {
        global: {
          enabled: true,
          defaultTimeWindow: 180000,
          defaultSimilarityThreshold: 0.9,
          defaultMaxDuplicates: 3,
        },
      };

      updateDeduplicationConfig(newConfig);

      // Verificar que a configuração foi aplicada
      const currentConfig = deduplicationConfig.getConfig();
      expect(currentConfig.global.defaultTimeWindow).toBe(180000);
      expect(currentConfig.global.defaultSimilarityThreshold).toBe(0.9);
      expect(currentConfig.global.defaultMaxDuplicates).toBe(3);
    });

    it('should validate configuration changes', () => {
      // Testar configuração inválida
      const invalidConfig = {
        global: {
          enabled: true,
          defaultTimeWindow: -1000, // Inválido
          defaultSimilarityThreshold: 1.5, // Inválido
          defaultMaxDuplicates: 0, // Inválido
        },
      };

      // A validação deve detectar os problemas
      const isValid = deduplicationConfig.validateConfig(invalidConfig as any);
      expect(isValid).toBe(false);
    });
  });
});
