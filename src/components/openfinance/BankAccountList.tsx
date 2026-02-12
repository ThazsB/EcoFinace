/**
 * Lista de Contas e Cartões Conectados
 * Exibe contas bancárias e cartões de crédito conectados via Open Finance
 * Refatorado com design system padronizado
 */

import { useState } from 'react';
import {
  Building2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Check,
  Wallet,
  Clock,
  CreditCard,
} from 'lucide-react';
import { useOpenFinanceStore } from '@/stores/openFinanceStore';
import { BankConnectionModal } from './BankConnectionModal';

export function BankAccountList() {
  const {
    connectedBanks,
    connectedCreditCards,
    isSyncing,
    syncProgress,
    syncAll,
    disconnectBank,
    disconnectCreditCard,
  } = useOpenFinanceStore();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSyncAccount = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      const { syncAccount } = useOpenFinanceStore.getState();
      await syncAccount(accountId);
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncCard = async (cardId: string) => {
    setSyncingId(cardId);
    try {
      const { syncCreditCard: syncCard } = useOpenFinanceStore.getState();
      await syncCard(cardId);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (confirm('Tem certeza que deseja desconectar esta conta?')) {
      await disconnectBank(accountId);
    }
  };

  const handleDisconnectCard = async (cardId: string) => {
    if (confirm('Tem certeza que deseja desconectar este cartão?')) {
      await disconnectCreditCard(cardId);
    }
  };

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const formatCardBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      elo: 'Elo',
      hipercard: 'Hipercard',
    };
    return brands[brand.toLowerCase()] || brand;
  };

  const hasConnectedItems = connectedBanks.length > 0 || connectedCreditCards.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Contas e Cartões</h3>
        <div className="flex gap-2">
          <button
            onClick={syncAll}
            disabled={isSyncing || !hasConnectedItems}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? `${syncProgress}%` : 'Sincronizar Tudo'}
          </button>
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Conectar
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!hasConnectedItems && (
        <div className="empty-state border border-dashed border-border rounded-lg">
          <div className="empty-state__icon">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="empty-state__title">Nenhuma conta ou cartão conectado</p>
          <p className="empty-state__description max-w-md mx-auto px-4">
            Conecte sua conta bancária ou cartão de crédito para sincronizar automaticamente suas
            transações.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            Conectar Conta ou Cartão
          </button>
        </div>
      )}

      {/* Connected Items */}
      {hasConnectedItems && (
        <div className="space-y-4">
          {/* Section: Bank Accounts */}
          {connectedBanks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Contas Bancárias ({connectedBanks.length})
              </h4>
              <div className="space-y-3">
                {connectedBanks.map((bank) => (
                  <div key={bank.account.accountId} className="card-account">
                    <div className="card-account__header">
                      <div className="card-account__info">
                        <div className="card-account__icon bg-primary/10">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="card-account__details">
                          <p className="card-account__name">{bank.account.brandName}</p>
                          <p className="card-account__type">
                            {bank.account.accountType === 'checking'
                              ? 'Conta Corrente'
                              : bank.account.accountType === 'savings'
                                ? 'Conta Poupança'
                                : 'Conta Salário'}{' '}
                            •••• {bank.account.accountNumber.slice(-4)}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`status-badge ${
                          bank.status === 'active'
                            ? 'status-badge--active'
                            : bank.status === 'error'
                              ? 'status-badge--error'
                              : 'status-badge--warning'
                        }`}
                      >
                        {bank.status === 'active'
                          ? 'Ativo'
                          : bank.status === 'error'
                            ? 'Erro'
                            : 'Renovação'}
                      </span>
                    </div>

                    {/* Error Message */}
                    {bank.errorMessage && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{bank.errorMessage}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="card-account__footer">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Último sync: {formatLastSync(bank.lastSync)}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSyncAccount(bank.account.accountId)}
                          disabled={syncingId === bank.account.accountId}
                          className="card-action-btn"
                          title="Sincronizar"
                          aria-label="Sincronizar conta"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              syncingId === bank.account.accountId ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDisconnectAccount(bank.account.accountId)}
                          className="card-action-btn card-action-btn--danger"
                          title="Desconectar"
                          aria-label="Desconectar conta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Credit Cards */}
          {connectedCreditCards.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Cartões de Crédito ({connectedCreditCards.length})
              </h4>
              <div className="space-y-3">
                {connectedCreditCards.map((card) => (
                  <div key={card.card.cardId} className="card-account">
                    <div className="card-account__header">
                      <div className="card-account__info">
                        <div className="card-account__icon bg-purple-100 dark:bg-purple-900/50">
                          <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="card-account__details">
                          <p className="card-account__name">{card.card.brandName}</p>
                          <p className="card-account__type">
                            {formatCardBrand(card.card.cardBrand)} •••• {card.card.cardLast4Digits}
                          </p>
                          {card.card.productName && (
                            <p className="text-xs text-muted-foreground">{card.card.productName}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`status-badge ${
                          card.status === 'active'
                            ? 'status-badge--active'
                            : card.status === 'error'
                              ? 'status-badge--error'
                              : 'status-badge--warning'
                        }`}
                      >
                        {card.status === 'active'
                          ? 'Ativo'
                          : card.status === 'error'
                            ? 'Erro'
                            : 'Renovação'}
                      </span>
                    </div>

                    {/* Error Message */}
                    {card.errorMessage && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-lg flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{card.errorMessage}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="card-account__footer">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Último sync: {formatLastSync(card.lastSync)}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSyncCard(card.card.cardId)}
                          disabled={syncingId === card.card.cardId}
                          className="card-action-btn"
                          title="Sincronizar"
                          aria-label="Sincronizar cartão"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              syncingId === card.card.cardId ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDisconnectCard(card.card.cardId)}
                          className="card-action-btn card-action-btn--danger"
                          title="Desconectar"
                          aria-label="Desconectar cartão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Open Finance Info */}
      <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <p>
          <strong>Open Finance Brasil:</strong> Suas transações são sincronizadas automaticamente
          através do Open Finance. Seus dados financeiros são transmitidos de forma segura e
          criptografada.
        </p>
      </div>

      {/* Modal */}
      <BankConnectionModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </div>
  );
}

export default BankAccountList;
