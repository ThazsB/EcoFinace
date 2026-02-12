/**
 * Importador de Transações via CSV/OFX
 * Componente para upload e parsing de extratos bancários
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import type { ParsedStatementTransaction } from '@/types/openfinance';
import { parseStatement, detectStatementFormat } from '@/utils/statementParser';
import { useAppStore } from '@/stores/appStore';
import { useToast } from '@/components/notifications/ToastContainer';

interface TransactionImporterProps {
  onClose?: () => void;
}

interface StatementImportResult {
  success: boolean;
  transactions: ParsedStatementTransaction[];
  errors: string[];
  totalImported: number;
  totalErrors: number;
}

export function TransactionImporter({ onClose }: TransactionImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<StatementImportResult | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const { showToast } = useToast();
  const appStore = useAppStore();

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setIsParsing(true);
      setParseResult(null);
      setSelectedTransactions([]);

      try {
        const content = await selectedFile.text();
        const result = parseStatement(content);
        setParseResult(result);

        if (result.success && result.transactions.length > 0) {
          // Seleciona todas por padrão
          setSelectedTransactions(result.transactions.map((_, index) => index));
        }
      } catch (error) {
        showToast({
          title: 'Erro ao ler arquivo',
          message: (error as Error).message,
          type: 'error',
        });
      } finally {
        setIsParsing(false);
      }
    },
    [showToast]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const droppedFile = event.dataTransfer.files[0];

      if (!droppedFile) return;

      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;

      const changeEvent = { target: input } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(changeEvent);
    },
    [handleFileChange]
  );

  const handleImport = async () => {
    if (!parseResult || selectedTransactions.length === 0) return;

    setIsImporting(true);

    try {
      const transactionsToImport = selectedTransactions.map(
        (index) => parseResult.transactions[index]
      );

      let imported = 0;
      for (const tx of transactionsToImport) {
        await appStore.addTransaction({
          desc: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category || 'Outros',
          date: tx.date.split('T')[0],
        });
        imported++;
      }

      showToast({
        title: 'Importação concluída',
        message: `${imported} transações importadas com sucesso!`,
        type: 'success',
      });

      onClose?.();
    } catch (error) {
      showToast({
        title: 'Erro na importação',
        message: (error as Error).message,
        type: 'error',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const toggleTransaction = (index: number) => {
    setSelectedTransactions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (!parseResult) return;
    if (selectedTransactions.length === parseResult.transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(parseResult.transactions.map((_, index) => index));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Importar Transações</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
      >
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-2">Arraste e solte um arquivo aqui ou</p>
        <label className="inline-block">
          <input
            type="file"
            accept=".csv,.ofx,.qfx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer text-sm">
            Selecionar Arquivo
          </span>
        </label>
        <p className="text-xs text-muted-foreground mt-3">Formatos suportados: CSV, OFX, QFX</p>
      </div>

      {/* Selected File */}
      {file && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{file.name}</span>
          <button
            onClick={() => {
              setFile(null);
              setParseResult(null);
              setSelectedTransactions([]);
            }}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Parsing Status */}
      {isParsing && (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Analisando arquivo...</span>
        </div>
      )}

      {/* Parse Result */}
      {parseResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div
            className={`p-3 rounded-lg ${parseResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}
          >
            <div className="flex items-center gap-2">
              {parseResult.success ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p
                  className={`font-medium ${parseResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}
                >
                  {parseResult.success
                    ? `${parseResult.totalImported} transações encontradas`
                    : 'Erro ao processar arquivo'}
                </p>
                {parseResult.errors.length > 0 && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {parseResult.totalErrors} erros encontrados
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          {parseResult.success && parseResult.transactions.length > 0 && (
            <>
              {/* Header Actions */}
              <div className="flex items-center justify-between">
                <button onClick={toggleAll} className="text-sm text-primary hover:underline">
                  {selectedTransactions.length === parseResult.transactions.length
                    ? 'Desmarcar todas'
                    : 'Selecionar todas'}
                </button>
                <span className="text-sm text-muted-foreground">
                  {selectedTransactions.length} de {parseResult.transactions.length} selecionadas
                </span>
              </div>

              {/* List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {parseResult.transactions.map((tx, index) => (
                  <label
                    key={index}
                    className={`card-base cursor-pointer ${
                      selectedTransactions.includes(index) ? 'card-transaction--selected' : ''
                    }`}
                  >
                    <div className="card-content">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(index)}
                        onChange={() => toggleTransaction(index)}
                        className="w-4 h-4 rounded border-border flex-shrink-0"
                      />
                      <div className="card-info">
                        <p className="card-title">{tx.description}</p>
                        <p className="card-meta">
                          {formatDate(tx.date)}
                          <span className="card-meta-separator">•</span>
                          {tx.category || 'Sem categoria'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`card-amount ${
                        tx.type === 'income' ? 'card-amount--income' : 'card-amount--expense'
                      }`}
                    >
                      {formatAmount(tx.amount, tx.type)}
                    </span>
                  </label>
                ))}
              </div>

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={selectedTransactions.length === 0 || isImporting}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importando...
                  </span>
                ) : (
                  `Importar ${selectedTransactions.length} transações`
                )}
              </button>
            </>
          )}

          {/* Errors */}
          {parseResult.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Erros encontrados:
              </p>
              <div className="max-h-32 overflow-y-auto p-3 bg-red-50 dark:bg-red-950 rounded-lg text-xs text-red-700 dark:text-red-300">
                {parseResult.errors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TransactionImporter;
