/**
 * Utilitários de Exportação de Dados
 */

import { Transaction, Budget, Goal } from '@/types';
import { formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporta array para CSV
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  options?: {
    headers?: Record<string, string>;
    dateFields?: string[];
  }
): void {
  if (data.length === 0) {
    console.warn('Nenhum dado para exportar');
    return;
  }

  // Obter cabeçalhos
  const keys = Object.keys(data[0]);
  const headers = options?.headers || {};

  // Formatar cabeçalhos
  const headerRow = keys.map((key) => headers[key] || key).join(',');

  // Formatar linhas
  const rows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key];

        // Tratar datas
        if (options?.dateFields?.includes(key) && value) {
          return formatDate(value as string);
        }

        // Tratar objetos
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }

        // Tratar strings com vírgulas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }

        return String(value ?? '');
      })
      .join(',')
  );

  const csv = [headerRow, ...rows].join('\n');
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

/**
 * Exporta transações para CSV
 */
export function exportTransactions(
  transactions: Transaction[],
  filename: string = 'transacoes'
): void {
  const data = transactions.map((tx) => ({
    id: tx.id,
    descrição: tx.desc,
    valor: tx.amount,
    tipo: tx.type === 'income' ? 'Receita' : 'Despesa',
    categoria: tx.category,
    data: tx.date,
    perfil: tx.profileId,
  }));

  exportToCSV(data, filename, {
    dateFields: ['data'],
  });
}

/**
 * Exporta orçamentos para CSV
 */
export function exportBudgets(budgets: Budget[], filename: string = 'orcamentos'): void {
  const data = budgets.map((budget) => ({
    categoria: budget.category,
    limite: budget.limit,
    perfil: budget.profileId,
  }));

  exportToCSV(data, filename);
}

/**
 * Exporta metas para CSV
 */
export function exportGoals(goals: Goal[], filename: string = 'metas'): void {
  const data = goals.map((goal) => ({
    id: goal.id,
    nome: goal.name,
    atual: goal.current,
    meta: goal.target,
    progresso: `${((goal.current / goal.target) * 100).toFixed(1)}%`,
    perfil: goal.profileId,
  }));

  exportToCSV(data, filename);
}

/**
 * Exporta todos os dados do usuário
 */
export function exportAllData(
  data: {
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
  },
  profileName: string
): void {
  const timestamp = new Date().toISOString().split('T')[0];

  exportTransactions(data.transactions, `transacoes_${profileName}_${timestamp}`);
  exportBudgets(data.budgets, `orcamentos_${profileName}_${timestamp}`);
  exportGoals(data.goals, `metas_${profileName}_${timestamp}`);
}

/**
 * Exporta para JSON
 */
export function exportToJSON<T>(data: T, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
}

/**
 * Backup completo dos dados
 */
export function createBackup(data: {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  exportedAt: string;
  version: number;
}): void {
  const backup = {
    ...data,
    version: 1,
    exportedAt: new Date().toISOString(),
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  exportToJSON(backup, `fins_backup_${timestamp}`);
}

/**
 * Faz download de um arquivo
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copia dados para clipboard
 */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

/**
 * Exporta para PDF usando jsPDF
 */
export function exportToPDF(
  data: {
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
  },
  filename: string = 'relatorio'
): void {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(20);
  doc.text('Relatório Financeiro Fins', 20, 20);

  doc.setFontSize(12);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 35);

  // Estatísticas
  const totalIncome = data.transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = data.transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  doc.text(`Receitas Totais: R$ ${totalIncome.toFixed(2)}`, 20, 50);
  doc.text(`Despesas Totais: R$ ${totalExpense.toFixed(2)}`, 20, 60);
  doc.text(`Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}`, 20, 70);

  // Transações recentes (top 10)
  doc.text('Transações Recentes:', 20, 90);
  data.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .forEach((tx, index) => {
      const y = 100 + index * 10;
      const sign = tx.type === 'income' ? '+' : '-';
      doc.text(
        `${tx.desc} - ${tx.category} - ${sign} R$ ${tx.amount.toFixed(2)} (${tx.date})`,
        20,
        y
      );
    });

  doc.save(`${filename}.pdf`);
}
