/**
 * Configurações de deduplicação avançada
 * Permite personalização dos parâmetros de detecção de duplicatas
 */

import type { NotificationCategory } from '@/types/notifications';

// Configurações de deduplicação por categoria
export interface CategoryDeduplicationConfig {
  timeWindow: number; // Tempo de janela para verificação (ms)
  similarityThreshold: number; // Threshold de similaridade (0-1)
  maxDuplicates: number; // Máximo de duplicatas permitidas
  enabled: boolean; // Habilita/desabilita deduplicação
}

// Configurações de deduplicação por prioridade
export interface PriorityDeduplicationConfig {
  timeWindow: number;
  similarityThreshold: number;
  maxDuplicates: number;
  enabled: boolean;
}

// Configurações avançadas de algoritmo
export interface AlgorithmConfig {
  jaro: {
    threshold: number;
    weight: number;
  };
  cosine: {
    threshold: number;
    weight: number;
  };
  levenshtein: {
    threshold: number;
    weight: number;
  };
  enabled: boolean;
}

// Configurações de cache
export interface CacheConfig {
  maxSize: number; // Tamanho máximo do cache
  cleanupInterval: number; // Intervalo de limpeza (ms)
  maxAge: number; // Tempo máximo de vida (ms)
  enabled: boolean;
}

// Configurações de performance
export interface PerformanceConfig {
  debounceTime: number; // Tempo de debounce para chamadas rápidas (ms)
  maxConcurrentChecks: number; // Máximo de verificações simultâneas
  batchProcessing: boolean; // Processamento em lote
  enabled: boolean;
}

// Configurações completas de deduplicação
export interface DeduplicationConfig {
  global: {
    enabled: boolean;
    defaultTimeWindow: number;
    defaultSimilarityThreshold: number;
    defaultMaxDuplicates: number;
  };

  categories: Record<NotificationCategory, CategoryDeduplicationConfig>;

  priorities: {
    low: PriorityDeduplicationConfig;
    normal: PriorityDeduplicationConfig;
    high: PriorityDeduplicationConfig;
    urgent: PriorityDeduplicationConfig;
  };

  algorithms: AlgorithmConfig;
  cache: CacheConfig;
  performance: PerformanceConfig;

  // Configurações específicas para diferentes tipos de conteúdo
  contentTypes: {
    title: {
      weight: number;
      normalize: boolean;
      stripHtml: boolean;
    };
    message: {
      weight: number;
      normalize: boolean;
      stripHtml: boolean;
    };
    category: {
      weight: number;
      required: boolean;
    };
  };
}

// Configurações padrão
export const DEFAULT_DEDUPLICATION_CONFIG: DeduplicationConfig = {
  global: {
    enabled: true,
    defaultTimeWindow: 60000, // 1 minuto
    defaultSimilarityThreshold: 0.85, // 85%
    defaultMaxDuplicates: 2,
  },

  categories: {
    budget: {
      timeWindow: 120000, // 2 minutos
      similarityThreshold: 0.9, // 90% para orçamentos
      maxDuplicates: 1,
      enabled: true,
    },
    goal: {
      timeWindow: 300000, // 5 minutos
      similarityThreshold: 0.85, // 85% para metas
      maxDuplicates: 2,
      enabled: true,
    },
    transaction: {
      timeWindow: 60000, // 1 minuto
      similarityThreshold: 0.8, // 80% para transações
      maxDuplicates: 3,
      enabled: true,
    },
    reminder: {
      timeWindow: 1800000, // 30 minutos
      similarityThreshold: 0.95, // 95% para lembretes
      maxDuplicates: 1,
      enabled: true,
    },
    report: {
      timeWindow: 3600000, // 1 hora
      similarityThreshold: 0.95, // 95% para relatórios
      maxDuplicates: 1,
      enabled: true,
    },
    system: {
      timeWindow: 300000, // 5 minutos
      similarityThreshold: 0.85, // 85% para sistema
      maxDuplicates: 2,
      enabled: true,
    },
    insight: {
      timeWindow: 600000, // 10 minutos
      similarityThreshold: 0.8, // 80% para insights
      maxDuplicates: 3,
      enabled: true,
    },
    achievement: {
      timeWindow: 600000, // 10 minutos
      similarityThreshold: 0.9, // 90% para conquistas
      maxDuplicates: 1,
      enabled: true,
    },
  },

  priorities: {
    low: {
      timeWindow: 300000, // 5 minutos
      similarityThreshold: 0.8, // 80%
      maxDuplicates: 3,
      enabled: true,
    },
    normal: {
      timeWindow: 120000, // 2 minutos
      similarityThreshold: 0.85, // 85%
      maxDuplicates: 2,
      enabled: true,
    },
    high: {
      timeWindow: 60000, // 1 minuto
      similarityThreshold: 0.9, // 90%
      maxDuplicates: 1,
      enabled: true,
    },
    urgent: {
      timeWindow: 1800000, // 30 minutos
      similarityThreshold: 0.95, // 95%
      maxDuplicates: 1,
      enabled: true,
    },
  },

  algorithms: {
    jaro: {
      threshold: 0.9,
      weight: 0.6,
    },
    cosine: {
      threshold: 0.8,
      weight: 0.3,
    },
    levenshtein: {
      threshold: 0.7,
      weight: 0.1,
    },
    enabled: true,
  },

  cache: {
    maxSize: 1000,
    cleanupInterval: 300000, // 5 minutos
    maxAge: 1800000, // 30 minutos
    enabled: true,
  },

  performance: {
    debounceTime: 100, // 100ms
    maxConcurrentChecks: 5,
    batchProcessing: true,
    enabled: true,
  },

  contentTypes: {
    title: {
      weight: 0.6,
      normalize: true,
      stripHtml: true,
    },
    message: {
      weight: 0.3,
      normalize: true,
      stripHtml: true,
    },
    category: {
      weight: 0.1,
      required: true,
    },
  },
};

// Funções de utilidade para configuração
export class DeduplicationConfigManager {
  private static instance: DeduplicationConfigManager;
  private config: DeduplicationConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): DeduplicationConfigManager {
    if (!DeduplicationConfigManager.instance) {
      DeduplicationConfigManager.instance = new DeduplicationConfigManager();
    }
    return DeduplicationConfigManager.instance;
  }

  getConfig(): DeduplicationConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<DeduplicationConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig);
    this.saveConfig(this.config);
  }

  getCategoryConfig(category: NotificationCategory): CategoryDeduplicationConfig {
    return this.config.categories[category] || this.getDefaultCategoryConfig();
  }

  getPriorityConfig(priority: 'low' | 'normal' | 'high' | 'urgent'): PriorityDeduplicationConfig {
    return this.config.priorities[priority];
  }

  getAlgorithmConfig(): AlgorithmConfig {
    return this.config.algorithms;
  }

  getCacheConfig(): CacheConfig {
    return this.config.cache;
  }

  getPerformanceConfig(): PerformanceConfig {
    return this.config.performance;
  }

  private loadConfig(): DeduplicationConfig {
    try {
      const saved = localStorage.getItem('deduplication_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load deduplication config:', error);
    }
    return DEFAULT_DEDUPLICATION_CONFIG;
  }

  private saveConfig(config: DeduplicationConfig): void {
    try {
      localStorage.setItem('deduplication_config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save deduplication config:', error);
    }
  }

  private mergeConfig(
    base: DeduplicationConfig,
    update: Partial<DeduplicationConfig>
  ): DeduplicationConfig {
    return {
      ...base,
      ...update,
      categories: { ...base.categories, ...update.categories },
      priorities: { ...base.priorities, ...update.priorities },
      algorithms: { ...base.algorithms, ...update.algorithms },
      cache: { ...base.cache, ...update.cache },
      performance: { ...base.performance, ...update.performance },
      contentTypes: { ...base.contentTypes, ...update.contentTypes },
    };
  }

  private getDefaultCategoryConfig(): CategoryDeduplicationConfig {
    return {
      timeWindow: this.config.global.defaultTimeWindow,
      similarityThreshold: this.config.global.defaultSimilarityThreshold,
      maxDuplicates: this.config.global.defaultMaxDuplicates,
      enabled: true,
    };
  }

  // Métodos para resetar configurações
  resetToDefaults(): void {
    this.config = DEFAULT_DEDUPLICATION_CONFIG;
    this.saveConfig(this.config);
  }

  resetCategoryConfig(category: NotificationCategory): void {
    this.config.categories[category] = this.getDefaultCategoryConfig();
    this.saveConfig(this.config);
  }

  // Métodos para validação
  validateConfig(config: DeduplicationConfig): boolean {
    try {
      // Validar thresholds
      if (
        config.global.defaultSimilarityThreshold < 0 ||
        config.global.defaultSimilarityThreshold > 1
      ) {
        throw new Error('Invalid global similarity threshold');
      }

      // Validar tempos
      if (config.global.defaultTimeWindow <= 0) {
        throw new Error('Invalid global time window');
      }

      // Validar categorias
      Object.values(config.categories).forEach((cat) => {
        if (cat.similarityThreshold < 0 || cat.similarityThreshold > 1) {
          throw new Error(`Invalid similarity threshold for category`);
        }
        if (cat.timeWindow <= 0) {
          throw new Error(`Invalid time window for category`);
        }
      });

      return true;
    } catch (error) {
      console.error('Invalid deduplication config:', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const deduplicationConfig = DeduplicationConfigManager.getInstance();

// Exportar funções de conveniência
export const getDeduplicationConfig = () => deduplicationConfig.getConfig();
export const updateDeduplicationConfig = (config: Partial<DeduplicationConfig>) =>
  deduplicationConfig.updateConfig(config);
export const resetDeduplicationConfig = () => deduplicationConfig.resetToDefaults();
