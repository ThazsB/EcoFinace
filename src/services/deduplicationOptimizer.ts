/**
 * Otimizador de performance para o sistema de deduplicação
 * Implementa estratégias avançadas para melhorar performance em alta carga
 */

import { deduplicationService } from './deduplicationService';
import type { DeduplicationResult } from './deduplicationService';
import type { NotificationCategory } from '@/types/notifications';

// Interface para estatísticas de performance
export interface PerformanceStats {
  totalChecks: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  blockedRequests: number;
  memoryUsage: number;
}

// Interface para configuração de otimização
export interface OptimizationConfig {
  enableBatching: boolean;
  batchSize: number;
  enableCaching: boolean;
  cacheTTL: number;
  enableProfiling: boolean;
  maxConcurrentRequests: number;
  debounceTime: number;
}

// Configuração padrão de otimização
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableBatching: true,
  batchSize: 10,
  enableCaching: true,
  cacheTTL: 300000, // 5 minutos
  enableProfiling: false,
  maxConcurrentRequests: 10,
  debounceTime: 50, // 50ms
};

class DeduplicationOptimizer {
  private config: OptimizationConfig;
  private batchQueue: Array<{
    title: string;
    message: string;
    category?: NotificationCategory;
    priority: 'normal' | 'high' | 'urgent';
    resolve: (result: DeduplicationResult) => void;
    reject: (error: Error) => void;
  }> = [];

  private cache = new Map<string, { result: DeduplicationResult; timestamp: number }>();
  private isProcessingBatch = false;
  private stats: PerformanceStats = {
    totalChecks: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    blockedRequests: 0,
    memoryUsage: 0,
  };
  private responseTimes: number[] = [];
  private activeRequests = 0;

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };

    // Limpar cache periodicamente
    if (this.config.enableCaching) {
      setInterval(() => this.cleanupCache(), this.config.cacheTTL);
    }
  }

  /**
   * Verifica duplicidade com otimizações de performance
   */
  async checkDuplicate(
    title: string,
    message: string,
    category?: NotificationCategory,
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<DeduplicationResult> {
    const startTime = performance.now();
    this.stats.totalChecks++;

    // Verificar cache primeiro
    if (this.config.enableCaching) {
      const cacheKey = this.generateCacheKey(title, message, category, priority);
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
        this.stats.cacheHits++;
        this.updateStats(startTime);
        return cached.result;
      }
      this.stats.cacheMisses++;
    }

    // Verificar limite de requisições concorrentes
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      this.stats.blockedRequests++;
      throw new Error('Too many concurrent requests');
    }

    this.activeRequests++;

    try {
      let result: DeduplicationResult;

      if (this.config.enableBatching) {
        // Processar em lote
        result = await this.processBatch(title, message, category, priority);
      } else {
        // Processamento individual
        result = deduplicationService.checkDuplicate(
          title,
          message,
          category as NotificationCategory | undefined,
          priority
        );
      }

      // Armazenar no cache
      if (this.config.enableCaching) {
        const cacheKey = this.generateCacheKey(title, message, category, priority);
        this.cache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }

      this.updateStats(startTime);
      return result;
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Processa verificações em lote para melhor performance
   */
  private async processBatch(
    title: string,
    message: string,
    category?: NotificationCategory,
    priority: 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<DeduplicationResult> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        title,
        message,
        category,
        priority,
        resolve,
        reject,
      });

      // Processar lote se atingir o tamanho máximo ou após debounce time
      if (this.batchQueue.length >= this.config.batchSize) {
        this.processCurrentBatch();
      } else {
        setTimeout(() => {
          if (this.batchQueue.length > 0) {
            this.processCurrentBatch();
          }
        }, this.config.debounceTime);
      }
    });
  }

  /**
   * Processa o lote atual de verificações
   */
  private async processCurrentBatch(): Promise<void> {
    if (this.isProcessingBatch || this.batchQueue.length === 0) {
      return;
    }

    this.isProcessingBatch = true;
    const currentBatch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      // Processar todas as verificações do lote
      const results = await Promise.all(
        currentBatch.map((item) =>
          deduplicationService.checkDuplicate(
            item.title,
            item.message,
            item.category,
            item.priority
          )
        )
      );

      // Resolver todas as promises
      currentBatch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // Rejeitar todas as promises em caso de erro
      currentBatch.forEach((item) => {
        item.reject(error as Error);
      });
    } finally {
      this.isProcessingBatch = false;
    }
  }

  /**
   * Gera chave para cache
   */
  private generateCacheKey(
    title: string,
    message: string,
    category?: string,
    priority?: string
  ): string {
    return `${title}|${message}|${category || ''}|${priority || ''}`;
  }

  /**
   * Atualiza estatísticas de performance
   */
  private updateStats(startTime: number): void {
    const responseTime = performance.now() - startTime;
    this.responseTimes.push(responseTime);

    // Manter apenas as últimas 1000 medições
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    // Calcular tempo médio
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.stats.averageResponseTime = sum / this.responseTimes.length;

    // Calcular uso de memória aproximado
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  /**
   * Estima uso de memória do cache
   */
  private estimateMemoryUsage(): number {
    let size = 0;

    // Estimar tamanho do cache
    for (const [key, value] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(value.result).length * 2;
      size += 8; // timestamp
    }

    return size;
  }

  /**
   * Limpa cache expirado
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));
  }

  /**
   * Obtém estatísticas de performance
   */
  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Obtém estatísticas detalhadas
   */
  getDetailedStats(): {
    stats: PerformanceStats;
    cacheSize: number;
    queueSize: number;
    activeRequests: number;
    hitRate: number;
    missRate: number;
  } {
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const hitRate = totalRequests > 0 ? this.stats.cacheHits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.cacheMisses / totalRequests : 0;

    return {
      stats: this.stats,
      cacheSize: this.cache.size,
      queueSize: this.batchQueue.length,
      activeRequests: this.activeRequests,
      hitRate,
      missRate,
    };
  }

  /**
   * Limpa todos os caches e filas
   */
  clear(): void {
    this.cache.clear();
    this.batchQueue = [];
    this.responseTimes = [];
    this.stats = {
      totalChecks: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      blockedRequests: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Atualiza configuração de otimização
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Habilita/desabilita profiling
   */
  setProfiling(enabled: boolean): void {
    this.config.enableProfiling = enabled;
  }

  /**
   * Exporta estatísticas para análise
   */
  exportStats(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        config: this.config,
        stats: this.getDetailedStats(),
        cacheKeys: Array.from(this.cache.keys()),
      },
      null,
      2
    );
  }

  /**
   * Importa estatísticas (para debugging)
   */
  importStats(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.stats) {
        this.stats = parsed.stats.stats;
      }
      if (parsed.cacheKeys) {
        // Recriar cache a partir das chaves (simplificado)
        parsed.cacheKeys.forEach((key: string) => {
          this.cache.set(key, {
            result: { isDuplicate: false, shouldBlock: false },
            timestamp: Date.now(),
          });
        });
      }
    } catch (error) {
      console.error('Failed to import stats:', error);
    }
  }
}

// Instância singleton do otimizador
export const deduplicationOptimizer = new DeduplicationOptimizer();

// Funções de conveniência otimizadas
export const optimizedCheckToastDuplicate = async (
  title: string,
  message: string,
  category?: NotificationCategory
): Promise<DeduplicationResult> => {
  return deduplicationOptimizer.checkDuplicate(title, message, category, 'normal');
};

export const optimizedCheckNotificationDuplicate = async (
  title: string,
  message: string,
  category?: NotificationCategory,
  priority: 'normal' | 'high' | 'urgent' = 'normal'
): Promise<DeduplicationResult> => {
  return deduplicationOptimizer.checkDuplicate(title, message, category, priority);
};

export const optimizedCheckUrgentDuplicate = async (
  title: string,
  message: string,
  category?: NotificationCategory
): Promise<DeduplicationResult> => {
  return deduplicationOptimizer.checkDuplicate(title, message, category, 'urgent');
};

// Exportar funções de gerenciamento
export const getOptimizerStats = () => deduplicationOptimizer.getDetailedStats();
export const clearOptimizerCache = () => deduplicationOptimizer.clear();
export const exportOptimizerStats = () => deduplicationOptimizer.exportStats();
export const updateOptimizerConfig = (config: Partial<OptimizationConfig>) =>
  deduplicationOptimizer.updateConfig(config);

export default deduplicationOptimizer;
