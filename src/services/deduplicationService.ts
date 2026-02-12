/**
 * Serviço de deduplicação avançado para toasts e notificações
 * Implementa estratégias inteligentes para evitar duplicatas
 */

import { StringSimilarity } from '@/utils/similarity/stringSimilarity';
import type { NotificationCategory } from '@/types/notifications';
import {
  deduplicationConfig,
  type DeduplicationConfig as FullDeduplicationConfig,
  type CategoryDeduplicationConfig,
  type PriorityDeduplicationConfig,
} from '@/config/deduplicationConfig';

// Tipos para deduplicação
export interface DeduplicationResult {
  isDuplicate: boolean;
  existingId?: string;
  similarity?: number;
  shouldBlock: boolean;
}

export interface ContentHash {
  title: string;
  message: string;
  category?: NotificationCategory;
  hash: string;
}

// Configurações de deduplicação por tipo
const DEDUPLICATION_CONFIGS = {
  toast: {
    timeWindow: 30000, // 30 segundos
    similarityThreshold: 0.85,
    enabled: true,
    maxDuplicates: 1,
  },
  notification: {
    timeWindow: 120000, // 2 minutos
    similarityThreshold: 0.9,
    enabled: true,
    maxDuplicates: 2,
  },
  urgent: {
    timeWindow: 600000, // 10 minutos
    similarityThreshold: 0.95,
    enabled: true,
    maxDuplicates: 1,
  },
} as const;

// Cache de conteúdo recente
interface ContentCacheEntry {
  hash: string;
  timestamp: number;
  count: number;
  lastSeen: number;
}

class DeduplicationService {
  private contentCache = new Map<string, ContentCacheEntry>();
  private hashHistory = new Map<string, number[]>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpar cache a cada 5 minutos
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupCache();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Verifica se um conteúdo é duplicado
   */
  checkDuplicate(
    title: string,
    message: string,
    category?: NotificationCategory,
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): DeduplicationResult {
    const config = this.getConfig(priority);

    if (!config.enabled) {
      return { isDuplicate: false, shouldBlock: false };
    }

    const contentHash = this.generateContentHash(title, message, category);
    const now = Date.now();

    // Verificar no cache
    const cached = this.contentCache.get(contentHash.hash);

    if (cached) {
      const timeDiff = now - cached.lastSeen;

      if (timeDiff <= config.timeWindow) {
        // Verificar similaridade se o hash não for exato
        if (contentHash.hash !== cached.hash) {
          const similarity = this.calculateSimilarity(title, message, category);
          if (similarity >= config.similarityThreshold) {
            cached.count++;
            cached.lastSeen = now;
            return {
              isDuplicate: true,
              similarity,
              shouldBlock: cached.count > config.maxDuplicates,
            };
          }
        } else {
          cached.count++;
          cached.lastSeen = now;
          return {
            isDuplicate: true,
            shouldBlock: cached.count > config.maxDuplicates,
          };
        }
      }
    }

    // Adicionar ao cache
    this.contentCache.set(contentHash.hash, {
      hash: contentHash.hash,
      timestamp: now,
      count: 1,
      lastSeen: now,
    });

    return { isDuplicate: false, shouldBlock: false };
  }

  /**
   * Verifica duplicidade avançada usando múltiplos algoritmos
   */
  checkAdvancedDuplicate(
    title: string,
    message: string,
    category?: NotificationCategory,
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): DeduplicationResult {
    const config = this.getConfig(priority);

    if (!config.enabled) {
      return { isDuplicate: false, shouldBlock: false };
    }

    const now = Date.now();
    let maxSimilarity = 0;
    let mostSimilarHash = '';

    // Verificar contra todos os itens no cache
    for (const [hash, entry] of this.contentCache.entries()) {
      const timeDiff = now - entry.lastSeen;

      if (timeDiff > config.timeWindow) {
        continue;
      }

      // Calcular similaridade
      const similarity = this.calculateSimilarity(title, message, category);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostSimilarHash = hash;
      }
    }

    if (maxSimilarity >= config.similarityThreshold) {
      const entry = this.contentCache.get(mostSimilarHash);
      if (entry) {
        entry.count++;
        entry.lastSeen = now;
        return {
          isDuplicate: true,
          similarity: maxSimilarity,
          shouldBlock: entry.count > config.maxDuplicates,
        };
      }
    }

    // Adicionar novo item ao cache
    const contentHash = this.generateContentHash(title, message, category);
    this.contentCache.set(contentHash.hash, {
      hash: contentHash.hash,
      timestamp: now,
      count: 1,
      lastSeen: now,
    });

    return { isDuplicate: false, shouldBlock: false };
  }

  /**
   * Gera hash de conteúdo para comparação rápida
   */
  private generateContentHash(
    title: string,
    message: string,
    category?: NotificationCategory
  ): ContentHash {
    const normalizedTitle = this.normalizeContent(title);
    const normalizedMessage = this.normalizeContent(message);
    const normalizedCategory = category || 'general';

    const hash = this.simpleHash(`${normalizedTitle}|${normalizedMessage}|${normalizedCategory}`);

    return {
      title: normalizedTitle,
      message: normalizedMessage,
      category,
      hash,
    };
  }

  /**
   * Normaliza conteúdo para comparação
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calcula similaridade usando múltiplos algoritmos
   */
  private calculateSimilarity(
    title: string,
    message: string,
    category?: NotificationCategory
  ): number {
    // Similaridade de título (mais importante)
    const titleSimilarity = StringSimilarity.compare(title, title, {
      method: 'jaro',
      threshold: 0.8,
    }).similarity;

    // Similaridade de mensagem
    const messageSimilarity = StringSimilarity.compare(message, message, {
      method: 'cosine',
      threshold: 0.7,
    }).similarity;

    // Similaridade de categoria (se aplicável)
    const categoryWeight = category ? 0.2 : 0;
    const contentWeight = 0.8;

    return (titleSimilarity * 0.6 + messageSimilarity * 0.4) * contentWeight + categoryWeight;
  }

  /**
   * Hash simples para strings
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Converte para 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Obtém configuração baseada na prioridade
   */
  private getConfig(
    priority: 'normal' | 'high' | 'urgent'
  ):
    | typeof DEDUPLICATION_CONFIGS.toast
    | typeof DEDUPLICATION_CONFIGS.notification
    | typeof DEDUPLICATION_CONFIGS.urgent {
    switch (priority) {
      case 'urgent':
        return DEDUPLICATION_CONFIGS.urgent;
      case 'high':
        return DEDUPLICATION_CONFIGS.notification;
      case 'normal':
      default:
        return DEDUPLICATION_CONFIGS.toast;
    }
  }

  /**
   * Limpa cache de itens antigos
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutos

    for (const [hash, entry] of this.contentCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.contentCache.delete(hash);
      }
    }
  }

  /**
   * Limpa cache manualmente
   */
  clearCache(): void {
    this.contentCache.clear();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { size: number; oldest: number; newest: number } {
    if (this.contentCache.size === 0) {
      return { size: 0, oldest: 0, newest: 0 };
    }

    const timestamps = Array.from(this.contentCache.values()).map((entry) => entry.timestamp);
    return {
      size: this.contentCache.size,
      oldest: Math.min(...timestamps),
      newest: Math.max(...timestamps),
    };
  }

  /**
   * Verifica se há espaço para nova notificação
   */
  hasSpace(priority: 'normal' | 'high' | 'urgent' = 'normal'): boolean {
    const config = this.getConfig(priority);
    const stats = this.getCacheStats();

    // Limitar número total de itens no cache
    return stats.size < 100;
  }

  /**
   * Força bloqueio de conteúdo duplicado
   */
  blockContent(title: string, message: string, category?: NotificationCategory): void {
    const contentHash = this.generateContentHash(title, message, category);
    this.contentCache.set(contentHash.hash, {
      hash: contentHash.hash,
      timestamp: Date.now(),
      count: 999, // Contagem alta para bloqueio
      lastSeen: Date.now(),
    });
  }

  /**
   * Desbloqueia conteúdo previamente bloqueado
   */
  unblockContent(title: string, message: string, category?: NotificationCategory): void {
    const contentHash = this.generateContentHash(title, message, category);
    this.contentCache.delete(contentHash.hash);
  }
}

// Instância singleton do serviço
export const deduplicationService = new DeduplicationService();

// Funções de conveniência
export const checkToastDuplicate = (
  title: string,
  message: string,
  category?: NotificationCategory
) => deduplicationService.checkDuplicate(title, message, category, 'normal');

export const checkNotificationDuplicate = (
  title: string,
  message: string,
  category?: NotificationCategory,
  priority: 'normal' | 'high' | 'urgent' = 'normal'
) => deduplicationService.checkAdvancedDuplicate(title, message, category, priority);

export const checkUrgentDuplicate = (
  title: string,
  message: string,
  category?: NotificationCategory
) => deduplicationService.checkDuplicate(title, message, category, 'urgent');

export const clearCache = () => deduplicationService.clearCache();

export default deduplicationService;
