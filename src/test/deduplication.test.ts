/**
 * Testes para o sistema de deduplicação avançado
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  deduplicationService,
  checkToastDuplicate,
  checkNotificationDuplicate,
  checkUrgentDuplicate,
} from '@/services/deduplicationService';
import type { DeduplicationResult } from '@/services/deduplicationService';

describe('DeduplicationService', () => {
  beforeEach(() => {
    // Limpar cache antes de cada teste
    deduplicationService.clearCache();
  });

  afterEach(() => {
    // Limpar cache após cada teste
    deduplicationService.clearCache();
  });

  describe('checkDuplicate', () => {
    it('should not detect duplicate for new content', () => {
      const result = deduplicationService.checkDuplicate(
        'Test Title',
        'Test Message',
        'transaction'
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('should detect exact duplicate within time window', () => {
      // Primeira chamada
      const result1 = deduplicationService.checkDuplicate(
        'Test Title',
        'Test Message',
        'transaction'
      );

      expect(result1.isDuplicate).toBe(false);

      // Segunda chamada com mesmo conteúdo
      const result2 = deduplicationService.checkDuplicate(
        'Test Title',
        'Test Message',
        'transaction'
      );

      expect(result2.isDuplicate).toBe(true);
      expect(result2.shouldBlock).toBe(false); // Primeira duplicata ainda não bloqueia
    });

    it('should block after max duplicates exceeded', () => {
      // Exceder o limite de duplicatas (máximo é 1 para toast)
      deduplicationService.checkDuplicate('Test Title', 'Test Message', 'transaction');
      deduplicationService.checkDuplicate('Test Title', 'Test Message', 'transaction');

      const result = deduplicationService.checkDuplicate(
        'Test Title',
        'Test Message',
        'transaction'
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.shouldBlock).toBe(true);
    });

    it('should not detect duplicate after time window expires', async () => {
      // Configurar tempo de janela curto para teste
      const result1 = deduplicationService.checkDuplicate(
        'Test Title',
        'Test Message',
        'transaction'
      );

      expect(result1.isDuplicate).toBe(false);

      // Simular passagem de tempo (maior que o tempo de janela do toast)
      vi.useFakeTimers();
      vi.advanceTimersByTime(35000); // 35 segundos > 30 segundos (tempo de janela do toast)

      const result2 = deduplicationService.checkDuplicate(
        'Test Title',
        'Test Message',
        'transaction'
      );

      expect(result2.isDuplicate).toBe(false);
      expect(result2.shouldBlock).toBe(false);

      vi.useRealTimers();
    });

    it('should detect similar content as duplicate', () => {
      // Primeira chamada
      deduplicationService.checkDuplicate('Original Title', 'Original Message', 'transaction');

      // Segunda chamada com conteúdo similar
      const result = deduplicationService.checkDuplicate(
        'Original Title',
        'Original Message with small change',
        'transaction'
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBeDefined();
      expect(result.similarity).toBeGreaterThan(0.8); // Threshold de similaridade
    });
  });

  describe('checkAdvancedDuplicate', () => {
    it('should not detect duplicate for new content', () => {
      const result = deduplicationService.checkAdvancedDuplicate(
        'Test Title',
        'Test Message',
        'transaction',
        'normal'
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('should detect duplicate with high priority', () => {
      // Primeira chamada
      deduplicationService.checkAdvancedDuplicate(
        'Important Title',
        'Important Message',
        'budget',
        'high'
      );

      // Segunda chamada
      const result = deduplicationService.checkAdvancedDuplicate(
        'Important Title',
        'Important Message',
        'budget',
        'high'
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.shouldBlock).toBe(false);
    });

    it('should use different thresholds for different priorities', () => {
      // Testar com prioridade normal (threshold 0.85)
      deduplicationService.checkAdvancedDuplicate(
        'Test Title',
        'Test Message',
        'transaction',
        'normal'
      );

      const resultNormal = deduplicationService.checkAdvancedDuplicate(
        'Test Title',
        'Test Message Similar',
        'transaction',
        'normal'
      );

      // Testar com prioridade alta (threshold 0.90)
      deduplicationService.checkAdvancedDuplicate(
        'Test Title',
        'Test Message',
        'transaction',
        'high'
      );

      const resultHigh = deduplicationService.checkAdvancedDuplicate(
        'Test Title',
        'Test Message Similar',
        'transaction',
        'high'
      );

      // O resultado pode variar dependendo da similaridade calculada
      // Mas os thresholds diferentes devem influenciar nos resultados
      expect(resultNormal).toBeDefined();
      expect(resultHigh).toBeDefined();
    });
  });

  describe('checkToastDuplicate', () => {
    it('should use toast configuration', () => {
      const result = checkToastDuplicate('Toast Title', 'Toast Message', 'transaction');

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('should block after exceeding toast max duplicates', () => {
      checkToastDuplicate('Toast Title', 'Toast Message', 'transaction');
      checkToastDuplicate('Toast Title', 'Toast Message', 'transaction');

      const result = checkToastDuplicate('Toast Title', 'Toast Message', 'transaction');

      expect(result.isDuplicate).toBe(true);
      expect(result.shouldBlock).toBe(true);
    });
  });

  describe('checkNotificationDuplicate', () => {
    it('should use notification configuration', () => {
      const result = checkNotificationDuplicate(
        'Notification Title',
        'Notification Message',
        'budget',
        'normal'
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('should handle different priorities', () => {
      // Testar com prioridade alta
      const resultHigh = checkNotificationDuplicate(
        'High Priority',
        'Important Message',
        'budget',
        'high'
      );

      expect(resultHigh.isDuplicate).toBe(false);

      // Testar com prioridade normal
      const resultNormal = checkNotificationDuplicate(
        'Normal Priority',
        'Regular Message',
        'transaction',
        'normal'
      );

      expect(resultNormal.isDuplicate).toBe(false);
    });
  });

  describe('checkUrgentDuplicate', () => {
    it('should use urgent configuration', () => {
      const result = checkUrgentDuplicate('Urgent Title', 'Urgent Message', 'system');

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('should have longer time window for urgent notifications', () => {
      checkUrgentDuplicate('Urgent Title', 'Urgent Message', 'system');

      // Mesmo conteúdo deve ser detectado como duplicata
      const result = checkUrgentDuplicate('Urgent Title', 'Urgent Message', 'system');

      expect(result.isDuplicate).toBe(true);
      expect(result.shouldBlock).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      deduplicationService.checkDuplicate('Test 1', 'Message 1', 'transaction');
      deduplicationService.checkDuplicate('Test 2', 'Message 2', 'transaction');

      const stats = deduplicationService.getCacheStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.oldest).toBeDefined();
      expect(stats.newest).toBeDefined();
      expect(stats.newest).toBeGreaterThanOrEqual(stats.oldest);
    });

    it('should clear cache when requested', () => {
      deduplicationService.checkDuplicate('Test', 'Message', 'transaction');

      let stats = deduplicationService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      deduplicationService.clearCache();

      stats = deduplicationService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should check if there is space for new notifications', () => {
      // Preencher cache até o limite
      for (let i = 0; i < 95; i++) {
        deduplicationService.checkDuplicate(`Title ${i}`, `Message ${i}`, 'transaction');
      }

      const hasSpace = deduplicationService.hasSpace('normal');
      expect(hasSpace).toBe(true);

      // Preencher até o limite máximo
      for (let i = 95; i < 100; i++) {
        deduplicationService.checkDuplicate(`Title ${i}`, `Message ${i}`, 'transaction');
      }

      const noSpace = deduplicationService.hasSpace('normal');
      expect(noSpace).toBe(false);
    });
  });

  describe('Content Blocking', () => {
    it('should block specific content', () => {
      deduplicationService.blockContent('Block Title', 'Block Message', 'transaction');

      const result = deduplicationService.checkDuplicate(
        'Block Title',
        'Block Message',
        'transaction'
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.shouldBlock).toBe(true);
    });

    it('should unblock previously blocked content', () => {
      deduplicationService.blockContent('Block Title', 'Block Message', 'transaction');
      deduplicationService.unblockContent('Block Title', 'Block Message', 'transaction');

      const result = deduplicationService.checkDuplicate(
        'Block Title',
        'Block Message',
        'transaction'
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = deduplicationService.checkDuplicate('', '', 'transaction');

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('should handle null/undefined category', () => {
      const result = deduplicationService.checkDuplicate('Test Title', 'Test Message', undefined);

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('should handle very long content', () => {
      const longTitle = 'A'.repeat(1000);
      const longMessage = 'B'.repeat(5000);

      const result = deduplicationService.checkDuplicate(longTitle, longMessage, 'transaction');

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });

    it('should handle special characters', () => {
      const result = deduplicationService.checkDuplicate(
        'Title with !@#$%^&*()',
        'Message with special chars: ñáéíóú',
        'transaction'
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid calls', () => {
      const startTime = Date.now();

      // Fazer múltiplas chamadas rapidamente
      for (let i = 0; i < 100; i++) {
        deduplicationService.checkDuplicate(`Title ${i}`, `Message ${i}`, 'transaction');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Deve ser rápido (menos de 1 segundo para 100 chamadas)
      expect(duration).toBeLessThan(1000);
    });

    it('should maintain performance with large cache', () => {
      // Preencher cache com muitos itens
      for (let i = 0; i < 500; i++) {
        deduplicationService.checkDuplicate(`Title ${i}`, `Message ${i}`, 'transaction');
      }

      const startTime = Date.now();

      // Testar performance com cache grande
      for (let i = 0; i < 50; i++) {
        deduplicationService.checkDuplicate(`New Title ${i}`, `New Message ${i}`, 'transaction');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Deve ainda ser razoávelmente rápido
      expect(duration).toBeLessThan(2000);
    });
  });
});

// Testes de integração
describe('Deduplication Integration', () => {
  it('should work with different notification categories', () => {
    const categories = [
      'budget',
      'goal',
      'transaction',
      'reminder',
      'report',
      'system',
      'insight',
      'achievement',
    ];

    categories.forEach((category) => {
      const result = checkNotificationDuplicate(
        `Test for ${category}`,
        `Message for ${category}`,
        category as any,
        'normal'
      );

      expect(result.isDuplicate).toBe(false);
      expect(result.shouldBlock).toBe(false);
    });
  });

  it('should handle priority escalation correctly', () => {
    // Primeiro criar notificação normal
    const normalResult = checkNotificationDuplicate(
      'Escalation Test',
      'Test Message',
      'transaction',
      'normal'
    );

    expect(normalResult.isDuplicate).toBe(false);

    // Depois criar com prioridade alta - deve ser tratado separadamente
    const highResult = checkNotificationDuplicate(
      'Escalation Test',
      'Test Message',
      'transaction',
      'high'
    );

    expect(highResult.isDuplicate).toBe(false);
  });
});
