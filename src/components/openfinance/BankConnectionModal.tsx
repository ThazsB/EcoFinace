/**
 * Modal de Conexão com Open Finance
 * Interface para usuário conectar contas bancárias e cartões de crédito
 */

import { useState, useEffect } from 'react';
import { X, Building2, Shield, Check, RefreshCw, AlertCircle, CreditCard } from 'lucide-react';
import { useOpenFinanceStore } from '@/stores/openFinanceStore';
import type { Participant } from '@/types/openfinance';

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionType = 'bank' | 'credit_card';

export function BankConnectionModal({ isOpen, onClose }: BankConnectionModalProps) {
  const [step, setStep] = useState<'select' | 'connecting' | 'success'>('select');
  const [selectedBank, setSelectedBank] = useState<Participant | null>(null);
  const [connectionType, setConnectionType] = useState<ConnectionType>('bank');
  const [banks, setBanks] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { connectBank, connectCreditCard, isConnecting } = useOpenFinanceStore();

  useEffect(() => {
    if (isOpen) {
      loadBanks();
    }
  }, [isOpen]);

  const loadBanks = async () => {
    setIsLoading(true);
    try {
      const { openFinanceService } = await import('@/services/openFinanceService');
      const supportedBanks = await openFinanceService.getSupportedBanks();
      setBanks(supportedBanks);
    } catch (error) {
      console.error('Erro ao carregar bancos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (bank: Participant) => {
    setSelectedBank(bank);
    setStep('connecting');

    try {
      if (connectionType === 'credit_card') {
        await connectCreditCard(bank.cnpjNumber);
      } else {
        await connectBank(bank.cnpjNumber);
      }
      setStep('success');
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setStep('select');
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedBank(null);
    onClose();
  };

  const getConnectionTypeLabel = () => {
    return connectionType === 'bank' ? 'Conta Bancária' : 'Cartão de Crédito';
  };

  const getConnectionTypeDescription = () => {
    return connectionType === 'bank'
      ? 'Conecte sua conta bancária para importar transações e saldos automaticamente.'
      : 'Conecte seu cartão de crédito para importar faturas e transações automaticamente.';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-lg w-full max-w-md border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Conectar Conta
          </h2>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'select' && (
            <>
              {/* Connection Type Selector */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setConnectionType('bank')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    connectionType === 'bank'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-muted/80 border-border'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Banco</span>
                </button>
                <button
                  onClick={() => setConnectionType('credit_card')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                    connectionType === 'credit_card'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted hover:bg-muted/80 border-border'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Cartão</span>
                </button>
              </div>

              {/* Info */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {getConnectionTypeLabel()}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {getConnectionTypeDescription()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Banks List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Carregando...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {banks.map((bank) => (
                    <button
                      key={bank.cnpjNumber}
                      onClick={() => handleConnect(bank)}
                      className="w-full flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          connectionType === 'credit_card'
                            ? 'bg-purple-100 dark:bg-purple-900'
                            : 'bg-primary/10'
                        }`}
                      >
                        {connectionType === 'credit_card' ? (
                          <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{bank.brandName}</p>
                        <p className="text-xs text-muted-foreground">
                          {bank.isOpened ? 'Disponível' : 'Em breve'}
                        </p>
                      </div>
                      {bank.isOpened && <Check className="w-5 h-5 text-green-500" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Help Link */}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Não encontrou {connectionType === 'bank' ? 'seu banco' : 'seu cartão'}?{' '}
                <a href="#" className="text-primary hover:underline">
                  Ver lista completa
                </a>
              </p>
            </>
          )}

          {step === 'connecting' && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 font-medium">Conectando com {selectedBank?.brandName}...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Você será redirecionado para autorizar o acesso.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="mt-4 font-medium">
                {connectionType === 'credit_card' ? 'Cartão conectado' : 'Conta conectada'} com
                sucesso!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedBank?.brandName} agora está sincronizado.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'success' && (
          <div className="p-4 border-t border-border">
            <button
              onClick={handleClose}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BankConnectionModal;
