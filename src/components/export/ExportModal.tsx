/**
 * Modal de Exportação de Dados
 */

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, X } from 'lucide-react';
import { Transaction, Budget, Goal } from '@/types';
import {
  exportTransactions,
  exportBudgets,
  exportGoals,
  exportAllData,
  createBackup,
  exportToPDF,
} from '@/utils/export';
import { useToast } from '@/components/notifications';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
  };
  profileName: string;
}

export function ExportModal({
  isOpen,
  onClose,
  data,
  profileName,
}: ExportModalProps) {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: 'csv' | 'json' | 'pdf' | 'all', format: 'transactions' | 'budgets' | 'goals' | 'all') => {
    setExporting(`${type}-${format}`);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const safeName = profileName.toLowerCase().replace(/\s+/g, '_');

      switch (type) {
        case 'csv':
          if (format === 'all' || format === 'transactions') {
            exportTransactions(data.transactions, `transacoes_${safeName}_${timestamp}`);
          }
          if (format === 'all' || format === 'budgets') {
            exportBudgets(data.budgets, `orcamentos_${safeName}_${timestamp}`);
          }
          if (format === 'all' || format === 'goals') {
            exportGoals(data.goals, `metas_${safeName}_${timestamp}`);
          }
          break;

        case 'json':
          if (format === 'all') {
            createBackup({
              transactions: data.transactions,
              budgets: data.budgets,
              goals: data.goals,
              exportedAt: new Date().toISOString(),
              version: 1,
            });
          }
          break;

        case 'pdf':
          exportToPDF(data, `relatorio_${safeName}_${timestamp}`);
          break;

        case 'all':
          exportAllData(data, safeName);
          break;
      }

      showToast({
        type: 'success',
        title: 'Exportação concluída',
        message: `Dados exportados com sucesso`,
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Erro na exportação',
        message: 'Não foi possível exportar os dados',
      });
    } finally {
      setExporting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Exportar Dados</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* CSV Export */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              Exportar como CSV
            </h3>
            <p className="text-xs text-muted-foreground">
              Formato ideal para Excel, Google Sheets e outros editores de planilhas.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExport('csv', 'transactions')}
                disabled={exporting !== null}
                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Transações
              </button>
              <button
                onClick={() => handleExport('csv', 'budgets')}
                disabled={exporting !== null}
                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Orçamentos
              </button>
              <button
                onClick={() => handleExport('csv', 'goals')}
                disabled={exporting !== null}
                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Metas
              </button>
              <button
                onClick={() => handleExport('csv', 'all')}
                disabled={exporting !== null}
                className="px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Tudo (CSV)
              </button>
            </div>
          </div>

          {/* PDF Export */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              Relatório PDF
            </h3>
            <p className="text-xs text-muted-foreground">
              Relatório profissional com estatísticas e transações recentes.
            </p>
            <button
              onClick={() => handleExport('pdf', 'all')}
              disabled={exporting !== null}
              className="w-full px-3 py-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {exporting === 'pdf-all' ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
            </button>
          </div>

          {/* JSON Export */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileJson className="w-4 h-4 text-yellow-500" />
              Backup Completo (JSON)
            </h3>
            <p className="text-xs text-muted-foreground">
              Backup completo com todos os dados. Ideal para restaurar posteriormente.
            </p>
            <button
              onClick={() => handleExport('json', 'all')}
              disabled={exporting !== null}
              className="w-full px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {exporting === 'json-all' ? 'Exportando...' : 'Fazer Backup (JSON)'}
            </button>
          </div>

          {/* All Formats */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-medium">Exportação Completa</h3>
            <p className="text-xs text-muted-foreground">
              Exporta todos os dados em todos os formatos disponíveis.
            </p>
            <button
              onClick={() => handleExport('all', 'all')}
              disabled={exporting !== null}
              className="w-full px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {exporting === 'all-all' ? 'Exportando...' : 'Exportar Tudo'}
            </button>
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium">Resumo dos dados:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Transações: {data.transactions.length}</p>
              <p>• Orçamentos: {data.budgets.length}</p>
              <p>• Metas: {data.goals.length}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
}

// Hook para usar o modal de exportação
export function useExportModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, open, close };
}
