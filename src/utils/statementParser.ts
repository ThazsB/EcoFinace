/**
 * Utilitário de Parsing de Extratos Bancários
 * Suporta CSV, OFX/QFX e formatos comuns de bancos brasileiros
 */

import type { ParsedStatementTransaction, StatementImportResult } from '@/types/openfinance';

// Mapeamento de bancos para formatos de CSV
interface BankCsvFormat {
  bankId: string;
  delimiter: string;
  dateFormat: string;
  hasHeader: boolean;
  columns: {
    date: number;
    description: number;
    amount: number;
    balance?: number;
    type?: number;
  };
}

const BANK_FORMATS: BankCsvFormat[] = [
  {
    bankId: 'itau',
    delimiter: ';',
    dateFormat: 'dd/MM/yyyy',
    hasHeader: true,
    columns: { date: 0, description: 1, amount: 2, balance: 3 },
  },
  {
    bankId: 'bradesco',
    delimiter: ';',
    dateFormat: 'dd/MM/yyyy',
    hasHeader: true,
    columns: { date: 0, description: 1, amount: 2, balance: 3 },
  },
  {
    bankId: 'bb',
    delimiter: ';',
    dateFormat: 'dd/MM/yyyy',
    hasHeader: true,
    columns: { date: 0, description: 1, amount: 3, balance: 4 },
  },
  {
    bankId: 'caixa',
    delimiter: ';',
    dateFormat: 'dd/MM/yyyy',
    hasHeader: true,
    columns: { date: 0, description: 1, amount: 2, balance: 3 },
  },
  {
    bankId: 'santander',
    delimiter: ';',
    dateFormat: 'dd/MM/yyyy',
    hasHeader: true,
    columns: { date: 0, description: 1, amount: 2, balance: 3 },
  },
  {
    bankId: 'nubank',
    delimiter: ',',
    dateFormat: 'yyyy-MM-dd',
    hasHeader: true,
    columns: { date: 0, description: 1, amount: 2, balance: 3 },
  },
  {
    bankId: 'inter',
    delimiter: ';',
    dateFormat: 'dd/MM/yyyy',
    hasHeader: true,
    columns: { date: 0, description: 1, amount: 2, balance: 3 },
  },
  {
    bankId: 'generic',
    delimiter: ',',
    dateFormat: 'yyyy-MM-dd',
    hasHeader: true,
    columns: { date: 0, description: 1, amount: 2 },
  },
];

/**
 * Detecta formato do CSV com base no conteúdo
 */
function detectCsvFormat(headers: string[], lines: string[][]): BankCsvFormat {
  const headerLower = headers.map((h) => h.toLowerCase());

  // Verifica padrões de cabeçalho
  if (headerLower.some((h) => h.includes('data') && h.includes('lançamento'))) {
    return (
      BANK_FORMATS.find((f) => f.bankId === 'bradesco') || BANK_FORMATS[BANK_FORMATS.length - 1]
    );
  }

  if (headerLower.some((h) => h.includes('data') && h.includes('histórico'))) {
    return BANK_FORMATS.find((f) => f.bankId === 'itau') || BANK_FORMATS[BANK_FORMATS.length - 1];
  }

  // Detecta pelo delimiter
  const sampleLine = lines[0];
  const commaCount = (sampleLine.join(',').match(/,/g) || []).length;
  const semicolonCount = (sampleLine.join(';').match(/;/g) || []).length;

  if (semicolonCount > commaCount) {
    return { ...BANK_FORMATS[BANK_FORMATS.length - 1], delimiter: ';' };
  }

  return BANK_FORMATS[BANK_FORMATS.length - 1];
}

/**
 * Parseia data em diversos formatos
 */
function parseDate(dateStr: string, format: string): Date | null {
  const cleanDate = dateStr.trim().replace(/"/g, '');

  // Formatos comuns brasileiros
  const brazilianFormats = [
    {
      regex: /^(\d{2})\/(\d{2})\/(\d{4})$/,
      parse: (_m: string, d: string, m: string, y: string) => new Date(`${y}-${m}-${d}`),
    },
    {
      regex: /^(\d{2})-(\d{2})-(\d{4})$/,
      parse: (_m: string, d: string, m: string, y: string) => new Date(`${y}-${m}-${d}`),
    },
  ];

  // ISO format
  const isoMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
  }

  // Formatos brasileiros
  for (const { regex, parse } of brazilianFormats) {
    const match = cleanDate.match(regex);
    if (match && match.length >= 4) {
      const d = match[1];
      const m = match[2];
      const y = match[3];
      return new Date(`${y}-${m}-${d}`);
    }
  }

  // Fallback para Date.parse
  const parsed = new Date(cleanDate);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parseia valor monetário brasileiro
 */
function parseAmount(amountStr: string): number | null {
  const cleanAmount = amountStr.trim().replace(/"/g, '').replace(/\./g, '').replace(',', '.');

  const amount = parseFloat(cleanAmount);
  return isNaN(amount) ? null : amount;
}

/**
 * Detecta tipo de transação pelo description
 */
function detectType(description: string, amount: number): 'income' | 'expense' {
  if (amount > 0) return 'income';
  if (amount < 0) return 'expense';

  const lowerDesc = description.toLowerCase();
  const creditKeywords = ['depósito', 'entrada', 'recebimento', 'crédito', 'pagamento recebido'];
  const debitKeywords = ['saque', 'retirada', 'débito', 'pagamento', 'transferência'];

  if (creditKeywords.some((kw) => lowerDesc.includes(kw))) return 'income';
  if (debitKeywords.some((kw) => lowerDesc.includes(kw))) return 'expense';

  return 'expense'; // Default
}

/**
 * Mapeia descrição para categoria
 */
function mapToCategory(description: string): string {
  const lowerDesc = description.toLowerCase();
  const categoryMap: Record<string, string[]> = {
    Alimentação: [
      'restaurante',
      'lanchonete',
      'café',
      'ifood',
      'delivery',
      'supermercado',
      'mercado',
    ],
    Transporte: ['uber', '99', 'gasolina', 'posto', 'combustível', 'metro', 'ônibus', 'táxi'],
    Moradia: ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'iptu'],
    Entretenimento: ['netflix', 'spotify', 'cinema', 'teatro', 'jogo', 'steam'],
    Saúde: ['farmácia', 'médico', 'hospital', 'laboratório', 'drogaria'],
    Educação: ['curso', 'escola', 'universidade', 'livro', 'material'],
    Transferências: ['pix', 'ted', 'doc', 'transferência'],
    Salário: ['salário', 'pagamento', 'vencimento', 'pro labore'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => lowerDesc.includes(kw))) {
      return category;
    }
  }

  return 'Outros';
}

/**
 * Parser principal de CSV
 */
export function parseCsv(
  content: string,
  options: {
    delimiter?: string;
    hasHeader?: boolean;
    bankFormat?: string;
  } = {}
): StatementImportResult {
  const errors: string[] = [];
  const transactions: ParsedStatementTransaction[] = [];

  try {
    // Detecta formato se não especificado
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) {
      return {
        success: false,
        transactions: [],
        errors: ['Arquivo vazio'],
        totalImported: 0,
        totalErrors: 0,
      };
    }

    // Detecta delimiter
    const firstLine = lines[0];
    const delimiter = options.delimiter || (firstLine.includes(';') ? ';' : ',');

    const columns = firstLine.split(delimiter).map((col) => col.trim().replace(/^"|"$/g, ''));
    const dataLines = options.hasHeader !== false ? lines.slice(1) : lines;

    // Determina formato
    const format =
      BANK_FORMATS.find((f) => f.bankId === options.bankFormat) ||
      detectCsvFormat(
        columns,
        dataLines.map((l) => l.split(delimiter))
      );

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const cells = line.split(delimiter).map((col) => col.trim().replace(/^"|"$/g, ''));

      try {
        // Extrai campos
        const dateStr = cells[format.columns.date];
        const description = cells[format.columns.description];
        const amountStr = cells[format.columns.amount];
        const balanceStr = format.columns.balance ? cells[format.columns.balance] : undefined;

        // Valida campos obrigatórios
        if (!dateStr || !description || !amountStr) {
          errors.push(`Linha ${i + 1}: Campos obrigatórios faltando`);
          continue;
        }

        // Parse valores
        const date = parseDate(dateStr, format.dateFormat);
        if (!date) {
          errors.push(`Linha ${i + 1}: Data inválida "${dateStr}"`);
          continue;
        }

        const amount = parseAmount(amountStr);
        if (amount === null) {
          errors.push(`Linha ${i + 1}: Valor inválido "${amountStr}"`);
          continue;
        }

        const balance = balanceStr ? parseAmount(balanceStr) : undefined;

        transactions.push({
          date: date.toISOString(),
          description,
          amount: Math.abs(amount),
          type: detectType(description, amount),
          balance: balance ?? undefined,
          category: mapToCategory(description),
        });
      } catch (err) {
        errors.push(`Linha ${i + 1}: ${(err as Error).message}`);
      }
    }

    return {
      success: errors.length === 0,
      transactions,
      errors,
      totalImported: transactions.length,
      totalErrors: errors.length,
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      errors: [(err as Error).message],
      totalImported: 0,
      totalErrors: 1,
    };
  }
}

/**
 * Parser de OFX/QFX (simplificado)
 */
export function parseOfx(content: string): StatementImportResult {
  const errors: string[] = [];
  const transactions: ParsedStatementTransaction[] = [];

  try {
    // Remove headers OFX
    const cleanContent = content.replace(/<OFX[^>]*>/g, '');

    // Extrai transações
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
    const match = cleanContent.matchAll(transactionRegex);

    for (const txnMatch of match) {
      try {
        const txnBlock = txnMatch[1];

        const dateMatch = txnBlock.match(/<DTPOSTED>(\d{4})(\d{2})(\d{2})/);
        const amountMatch = txnBlock.match(/<TRNAMT>(-?[\d.]+)/);
        const descMatch = txnBlock.match(/<MEMO>([^<]+)/) || txnBlock.match(/<NAME>([^<]+)/);

        if (!dateMatch || !amountMatch) {
          errors.push('Transação sem data ou valor');
          continue;
        }

        const year = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const day = parseInt(dateMatch[3]);

        const date = new Date(year, month, day);
        const amount = parseFloat(amountMatch[1]);
        const description = descMatch ? descMatch[1].trim() : 'Transação OFX';

        transactions.push({
          date: date.toISOString(),
          description,
          amount: Math.abs(amount),
          type: detectType(description, amount),
          category: mapToCategory(description),
        });
      } catch (err) {
        errors.push(`Erro ao processar transação: ${(err as Error).message}`);
      }
    }

    return {
      success: errors.length === 0,
      transactions,
      errors,
      totalImported: transactions.length,
      totalErrors: errors.length,
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      errors: [(err as Error).message],
      totalImported: 0,
      totalErrors: 1,
    };
  }
}

/**
 * Detecta formato do arquivo
 */
export function detectStatementFormat(content: string): 'csv' | 'ofx' | 'unknown' {
  const trimmed = content.trim();

  if (trimmed.startsWith('<')) {
    return 'ofx';
  }

  if (trimmed.includes(',') || trimmed.includes(';')) {
    return 'csv';
  }

  return 'unknown';
}

/**
 * Parser universal que detecta formato automaticamente
 */
export function parseStatement(
  content: string,
  options: { bankFormat?: string } = {}
): StatementImportResult {
  const format = detectStatementFormat(content);

  switch (format) {
    case 'csv':
      return parseCsv(content, options);
    case 'ofx':
      return parseOfx(content);
    default:
      return {
        success: false,
        transactions: [],
        errors: ['Formato de arquivo não suportado'],
        totalImported: 0,
        totalErrors: 1,
      };
  }
}

/**
 * Exporta transações para CSV no formato do Fins
 */
export function exportToCsv(transactions: ParsedStatementTransaction[]): string {
  const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria'];
  const rows = transactions.map((tx) => [
    new Date(tx.date).toLocaleDateString('pt-BR'),
    `"${tx.description.replace(/"/g, '""')}"`,
    tx.amount.toFixed(2).replace('.', ','),
    tx.type === 'income' ? 'Receita' : 'Despesa',
    tx.category || 'Outros',
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}
