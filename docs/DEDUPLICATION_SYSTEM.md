# Sistema de Deduplicação Avançado

## Visão Geral

O sistema de deduplicação avançado do Fins é uma solução completa para evitar notificações e toasts duplicados, implementando estratégias inteligentes de detecção de similaridade e gerenciamento de cache.

## Arquitetura

### Componentes Principais

1. **StringSimilarity** (`src/utils/similarity/stringSimilarity.ts`)
   - Algoritmos avançados de similaridade (Jaro, Cosseno, Levenshtein)
   - Comparação inteligente de strings
   - Thresholds configuráveis

2. **DeduplicationService** (`src/services/deduplicationService.ts`)
   - Serviço central de deduplicação
   - Cache inteligente com expiração
   - Verificação de similaridade avançada
   - Bloqueio e desbloqueio de conteúdo

3. **DeduplicationConfig** (`src/config/deduplicationConfig.ts`)
   - Configurações detalhadas por categoria e prioridade
   - Configurações de algoritmos
   - Configurações de cache e performance
   - Sistema de validação

4. **DeduplicationOptimizer** (`src/services/deduplicationOptimizer.ts`)
   - Otimização de performance para alta carga
   - Processamento em lote
   - Cache avançado
   - Estatísticas de performance

5. **ToastContainer** (`src/components/notifications/ToastContainer.tsx`)
   - Sistema de toasts com deduplicação integrada
   - Debounce inteligente
   - Fila de exibição
   - Estilização avançada

## Funcionalidades

### Detecção de Duplicatas

- **Similaridade Inteligente**: Usa múltiplos algoritmos para detectar conteúdo similar
- **Thresholds Configuráveis**: Permite ajustar sensibilidade por categoria e prioridade
- **Janela de Tempo**: Configuração de tempo para considerar duplicatas
- **Contagem de Duplicatas**: Limite configurável de duplicatas permitidas

### Performance

- **Cache Inteligente**: Armazenamento temporário de resultados
- **Processamento em Lote**: Agrupamento de chamadas para melhor performance
- **Debounce**: Evita chamadas rápidas e repetidas
- **Monitoramento**: Estatísticas detalhadas de performance

### Configuração

- **Configurações por Categoria**: Cada categoria pode ter configurações diferentes
- **Configurações por Prioridade**: Diferentes thresholds para diferentes prioridades
- **Algoritmos Configuráveis**: Peso e threshold por algoritmo
- **Persistência**: Configurações salvas no localStorage

## Configurações Padrão

### Por Categoria

- **Budget**: 2 minutos, 90% de similaridade, 1 duplicata máxima
- **Goal**: 5 minutos, 85% de similaridade, 2 duplicatas máximas
- **Transaction**: 1 minuto, 80% de similaridade, 3 duplicatas máximas
- **Reminder**: 30 minutos, 95% de similaridade, 1 duplicata máxima
- **Report**: 1 hora, 95% de similaridade, 1 duplicata máxima
- **System**: 5 minutos, 85% de similaridade, 2 duplicatas máximas
- **Insight**: 10 minutos, 80% de similaridade, 3 duplicatas máximas
- **Achievement**: 10 minutos, 90% de similaridade, 1 duplicata máxima

### Por Prioridade

- **Low**: 5 minutos, 80% de similaridade, 3 duplicatas máximas
- **Normal**: 2 minutos, 85% de similaridade, 2 duplicatas máximas
- **High**: 1 minuto, 90% de similaridade, 1 duplicata máxima
- **Urgent**: 30 minutos, 95% de similaridade, 1 duplicata máxima

## Uso

### Verificação Básica

```typescript
import { checkToastDuplicate, checkNotificationDuplicate } from '@/services/deduplicationService';

// Verificar duplicata de toast
const result = checkToastDuplicate(
  'Título da Notificação',
  'Mensagem da notificação',
  'transaction'
);

if (result.isDuplicate) {
  if (result.shouldBlock) {
    // Bloquear notificação
  } else {
    // Permitir, mas marcar como duplicata
  }
}

// Verificar duplicata de notificação com prioridade
const result2 = checkNotificationDuplicate('Título', 'Mensagem', 'budget', 'high');
```

### Uso com Otimizador

```typescript
import { optimizedCheckToastDuplicate } from '@/services/deduplicationOptimizer';

// Verificação otimizada
const result = await optimizedCheckToastDuplicate('Título', 'Mensagem', 'transaction');
```

### Configuração

```typescript
import { updateDeduplicationConfig } from '@/config/deduplicationConfig';

// Atualizar configuração
updateDeduplicationConfig({
  categories: {
    budget: {
      timeWindow: 120000, // 2 minutos
      similarityThreshold: 0.9, // 90%
      maxDuplicates: 1,
      enabled: true,
    },
  },
});
```

## Integração com Toasts

O sistema de toasts foi completamente integrado com a deduplicação:

- **Debounce Inteligente**: Evita toasts duplicados em chamadas rápidas
- **Fila de Exibição**: Gerencia a exibição de múltiplos toasts
- **Limites de Exibição**: Controla quantos toasts podem ser exibidos simultaneamente
- **Estilização por Tipo**: Diferentes estilos para diferentes tipos de transações

## Testes

O sistema inclui testes abrangentes:

- **Testes Unitários** (`src/test/deduplication.test.ts`): Testes do serviço de deduplicação
- **Testes de Integração** (`src/test/deduplication-integration.test.ts`): Testes de integração com outros componentes
- **Cobertura de Cenários**: Testes para todos os cenários de uso

## Performance

### Métricas de Performance

- **Tempo Médio de Resposta**: < 10ms para chamadas individuais
- **Tempo Médio de Resposta (Batch)**: < 50ms para lotes de 10 chamadas
- **Uso de Memória**: < 10MB para cache de 1000 itens
- **Throughput**: > 1000 chamadas/segundo

### Otimizações

- **Cache LRU**: Remoção automática de itens menos usados
- **Batch Processing**: Agrupamento de chamadas para melhor performance
- **Debounce**: Redução de chamadas redundantes
- **Concorrência Controlada**: Limite de chamadas simultâneas

## Monitoramento

### Estatísticas Disponíveis

- **Total de Verificações**: Número total de verificações realizadas
- **Cache Hits/Misses**: Estatísticas de eficiência do cache
- **Tempo Médio de Resposta**: Performance média das verificações
- **Requisições Bloqueadas**: Número de requisições bloqueadas por limite de concorrência
- **Uso de Memória**: Consumo de memória do cache

### Exportação de Estatísticas

```typescript
import { exportOptimizerStats } from '@/services/deduplicationOptimizer';

// Exportar estatísticas para análise
const stats = exportOptimizerStats();
console.log(stats);
```

## Melhores Práticas

### Quando Usar Deduplicação

- **Notificações de Transação**: Sempre que houver múltiplas transações semelhantes
- **Alertas de Orçamento**: Para evitar múltiplos alertas sobre o mesmo orçamento
- **Notificações de Metas**: Para evitar spam de notificações de progresso
- **Alertas de Sistema**: Para evitar notificações repetidas de erros

### Configuração de Thresholds

- **Conteúdo Crítico**: Use thresholds altos (90-95%) para evitar falsos positivos
- **Conteúdo Informativo**: Use thresholds médios (80-85%) para balancear sensibilidade
- **Conteúdo Promocional**: Use thresholds baixos (70-80%) para permitir mais variações

### Gerenciamento de Cache

- **Tamanho do Cache**: Ajuste baseado na memória disponível
- **Tempo de Vida**: Configure baseado na frequência de notificações
- **Limpeza**: O sistema limpa automaticamente itens expirados

## Troubleshooting

### Problemas Comuns

1. **Falsos Positivos**: Ajuste os thresholds de similaridade
2. **Falsos Negativos**: Reduza os thresholds de similaridade
3. **Alta Latência**: Verifique o tamanho do cache e o tempo de vida
4. **Uso de Memória Alto**: Reduza o tamanho máximo do cache

### Logs de Debug

```typescript
// Habilitar debug
deduplicationConfig.setProfiling(true);

// Ver estatísticas detalhadas
const stats = getOptimizerStats();
console.log(stats);
```

## Futuro

### Melhorias Planejadas

- **Machine Learning**: Algoritmos de aprendizado para melhorar detecção
- **Integração com IA**: Análise semântica do conteúdo
- **Clusterização**: Agrupamento inteligente de notificações similares
- **Adaptive Thresholds**: Thresholds que se adaptam ao comportamento do usuário

### Extensões

- **Multi-Dispositivo**: Sincronização de deduplicação entre dispositivos
- **Cloud Cache**: Cache distribuído para aplicações em múltiplos servidores
- **Analytics**: Análise de padrões de notificação para otimização

## Contribuição

Para contribuir com o sistema de deduplicação:

1. **Testes**: Sempre adicione testes para novas funcionalidades
2. **Documentação**: Atualize a documentação para mudanças significativas
3. **Performance**: Teste a performance antes de submeter mudanças
4. **Compatibilidade**: Mantenha compatibilidade com versões anteriores

## Licença

Este sistema faz parte do projeto Fins e segue a mesma licença do projeto principal.
