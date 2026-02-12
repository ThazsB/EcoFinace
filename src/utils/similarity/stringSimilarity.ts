/**
 * Utilitários para comparação de similaridade entre strings
 * Implementa algoritmos avançados para detecção de duplicatas
 */

// Interface para resultados de similaridade
interface SimilarityResult {
  similarity: number; // 0 a 1 (1 = idêntico)
  isDuplicate: boolean; // Baseado em threshold
  details: SimilarityDetails;
}

interface SimilarityDetails {
  method: string; // Método usado (jaro, cosine, etc.)
  threshold: number; // Threshold aplicado
  normalized: string; // String normalizada
  comparison: string; // String comparada normalizada
}

// Thresholds configuráveis
const DEFAULT_THRESHOLD = 0.85; // 85% de similaridade
const TITLE_THRESHOLD = 0.9; // 90% para títulos
const MESSAGE_THRESHOLD = 0.8; // 80% para mensagens
const TOAST_THRESHOLD = 0.85; // 85% para toasts
const CATEGORY_THRESHOLD = 0.95; // 95% para categorias

// Configurações de tempo
const DEFAULT_TIME_WINDOW = 60000; // 60 segundos padrão
const TOAST_TIME_WINDOW = 30000; // 30 segundos para toasts
const NOTIFICATION_TIME_WINDOW = 120000; // 2 minutos para notificações

// Cache para resultados de similaridade
const similarityCache = new Map<string, SimilarityResult>();

// Função principal para comparar similaridade
export function compareSimilarity(
  str1: string,
  str2: string,
  options: {
    threshold?: number;
    method?: 'jaro' | 'cosine' | 'levenshtein';
    normalize?: boolean;
  } = {}
): SimilarityResult {
  const { threshold = DEFAULT_THRESHOLD, method = 'jaro', normalize = true } = options;

  // Gerar chave de cache
  const cacheKey = `${method}:${threshold}:${str1.length}:${str2.length}`;

  // Verificar cache
  const cached = similarityCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Normalizar strings se necessário
  const normalizedStr1 = normalize ? normalizeString(str1) : str1;
  const normalizedStr2 = normalize ? normalizeString(str2) : str2;

  // Calcular similaridade baseado no método
  let similarity: number;
  switch (method) {
    case 'cosine':
      similarity = cosineSimilarity(normalizedStr1, normalizedStr2);
      break;
    case 'levenshtein':
      similarity = levenshteinSimilarity(normalizedStr1, normalizedStr2);
      break;
    case 'jaro':
    default:
      similarity = jaroSimilarity(normalizedStr1, normalizedStr2);
  }

  // Determinar se é duplicata
  const isDuplicate = similarity >= threshold;

  // Criar resultado
  const result: SimilarityResult = {
    similarity,
    isDuplicate,
    details: {
      method,
      threshold,
      normalized: normalizedStr1,
      comparison: normalizedStr2,
    },
  };

  // Salvar no cache (máximo 1000 itens)
  if (similarityCache.size < 1000) {
    similarityCache.set(cacheKey, result);
  }

  return result;
}

// Normalização de strings
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[áàãâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòõôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Algoritmo Jaro-Winkler (boa performance e precisão)
function jaroSimilarity(str1: string, str2: string): number {
  const str1Length = str1.length;
  const str2Length = str2.length;

  if (str1Length === 0 || str2Length === 0) {
    return str1Length === str2Length ? 1 : 0;
  }

  const matchDistance = Math.floor(Math.max(str1Length, str2Length) / 2) - 1;

  const str1Matches = new Array(str1Length).fill(false);
  const str2Matches = new Array(str2Length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < str1Length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, str2Length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j]) continue;
      if (str1[i] !== str2[j]) continue;

      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < str1Length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  transpositions /= 2;

  const jaro =
    (matches / str1Length + matches / str2Length + (matches - transpositions) / matches) / 3;

  // Aplicar Winkler (bonus para prefixo comum)
  const prefixLength = commonPrefixLength(str1, str2, 4);
  const jaroWinkler = jaro + prefixLength * 0.1 * (1 - jaro);

  return Math.min(jaroWinkler, 1);
}

// Comprimento do prefixo comum (máximo 4 caracteres)
function commonPrefixLength(str1: string, str2: string, maxPrefix: number): number {
  let length = 0;
  for (let i = 0; i < Math.min(str1.length, str2.length, maxPrefix); i++) {
    if (str1[i] === str2[i]) {
      length++;
    } else {
      break;
    }
  }
  return length;
}

// Similaridade por Cosseno (baseado em TF-IDF)
function cosineSimilarity(str1: string, str2: string): number {
  const vector1 = getTFIDFVector(str1);
  const vector2 = getTFIDFVector(str2);

  const dotProduct = dotProductVectors(vector1, vector2);
  const magnitude1 = magnitudeVector(vector1);
  const magnitude2 = magnitudeVector(vector2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

// Vetor TF-IDF para string
function getTFIDFVector(str: string): Map<string, number> {
  const words = str.split(/\s+/);
  const termFrequency = new Map<string, number>();
  const documentFrequency = new Map<string, number>();

  // Calcular TF
  for (const word of words) {
    termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
  }

  // Calcular IDF (simplificado para 2 documentos)
  for (const word of termFrequency.keys()) {
    documentFrequency.set(word, 1); // Assume 2 documentos para simplificação
  }

  // Calcular TF-IDF
  const tfidf = new Map<string, number>();
  const totalWords = words.length;

  for (const [word, freq] of termFrequency.entries()) {
    const tf = freq / totalWords;
    const idf = Math.log(2 / (documentFrequency.get(word) || 1));
    tfidf.set(word, tf * idf);
  }

  return tfidf;
}

// Produto escalar entre vetores
function dotProductVectors(vec1: Map<string, number>, vec2: Map<string, number>): number {
  let sum = 0;
  for (const [word, value1] of vec1.entries()) {
    const value2 = vec2.get(word) || 0;
    sum += value1 * value2;
  }
  return sum;
}

// Magnitude de vetor
function magnitudeVector(vec: Map<string, number>): number {
  let sum = 0;
  for (const value of vec.values()) {
    sum += value * value;
  }
  return Math.sqrt(sum);
}

// Similaridade por Levenshtein (distância de edição)
function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 1;

  return 1 - distance / maxLength;
}

// Distância de Levenshtein
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + indicator
      );
    }
  }

  return matrix[a.length][b.length];
}

// Funções utilitárias para comparação de conteúdo
export function compareContentSimilarity(
  content1: string,
  content2: string,
  options: {
    threshold?: number;
    method?: 'jaro' | 'cosine' | 'levenshtein';
    normalize?: boolean;
  } = {}
): SimilarityResult {
  // Remover HTML e markdown se presentes
  const cleanContent1 = stripMarkup(content1);
  const cleanContent2 = stripMarkup(content2);

  // Comparar similaridade
  return compareSimilarity(cleanContent1, cleanContent2, options);
}

// Remover markup (HTML, markdown) do conteúdo
function stripMarkup(content: string): string {
  return content
    .replace(/<[^>]*>/g, ' ') // HTML tags
    .replace(/[*_`~]/g, ' ') // Markdown formatting
    .replace(/[#\-+>!]/g, ' ') // Markdown headers/lists
    .replace(/\s+/g, ' ') // Multiple spaces
    .trim();
}

// Comparação rápida para detecção inicial
export function quickContentCheck(
  content1: string,
  content2: string,
  threshold: number = 0.7
): boolean {
  // Verificar se conteúdo é muito curto (semântica insuficiente)
  if (content1.length < 10 || content2.length < 10) {
    return content1 === content2;
  }

  // Verificar se conteúdo é muito longo (provavelmente diferente)
  if (content1.length > 1000 || content2.length > 1000) {
    return false;
  }

  // Verificar similaridade básica
  const result = compareSimilarity(content1, content2, {
    threshold,
    method: 'jaro',
  });

  return result.isDuplicate;
}

// Exportar funções principais
export const StringSimilarity = {
  compare: compareSimilarity,
  compareContent: compareContentSimilarity,
  quickCheck: quickContentCheck,
  jaro: jaroSimilarity,
  cosine: cosineSimilarity,
  levenshtein: levenshteinSimilarity,
};
