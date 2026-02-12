/**
 * Store do Open Finance - Gerencia estado da integração bancária
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BankAccount,
  ConnectedBank,
  ConnectedCreditCard,
  SyncResult,
  ConsentPermission,
  CreditCardAccount,
  CreditCardBalance,
} from '@/types/openfinance';
import { openFinanceService } from '@/services/openFinanceService';
import { useAppStore } from './appStore';

interface OpenFinanceState {
  // Estado
  connectedBanks: ConnectedBank[];
  connectedCreditCards: ConnectedCreditCard[];
  isConnecting: boolean;
  isSyncing: boolean;
  syncProgress: number;
  lastError: string | null;

  // Ações para contas bancárias
  connectBank: (participantId: string) => Promise<void>;
  disconnectBank: (accountId: string) => Promise<void>;
  syncAllAccounts: () => Promise<void>;
  syncAccount: (accountId: string) => Promise<SyncResult>;
  importTransactions: (accountId: string) => Promise<void>;

  // Ações para cartões de crédito
  connectCreditCard: (participantId: string) => Promise<void>;
  disconnectCreditCard: (cardId: string) => Promise<void>;
  syncCreditCard: (
    cardId: string
  ) => Promise<{ cardId: string; lastSyncDate: string; balance: CreditCardBalance }>;
  importCreditCardTransactions: (cardId: string) => Promise<void>;

  // Ações gerais
  syncAll: () => Promise<void>;
  clearError: () => void;
}

export const useOpenFinanceStore = create<OpenFinanceState>()(
  persist(
    (set, get) => ({
      connectedBanks: [],
      connectedCreditCards: [],
      isConnecting: false,
      isSyncing: false,
      syncProgress: 0,
      lastError: null,

      // ===== CONTAS BANCÁRIAS =====

      connectBank: async (participantId: string) => {
        set({ isConnecting: true, lastError: null });

        try {
          // Gera URL de consentimento
          const permissions: ConsentPermission[] = [
            'ACCOUNTS_READ',
            'ACCOUNTS_BALANCES_READ',
            'ACCOUNTS_TRANSACTIONS_READ',
          ];

          const consentUrl = openFinanceService.generateConsentUrl(permissions);

          // Em desenvolvimento, simulamos a conexão
          // Em produção, abriríamos a URL em popup
          const mockAccount: ConnectedBank = {
            account: {
              id: `acc_${Date.now()}`,
              participantId,
              participantName: 'Banco Simulado',
              brandName: 'Banco Simulado',
              cnpjNumber: '00000000000191',
              accountId: `of_${Date.now()}`,
              accountType: 'checking',
              accountSubtype: 'individual',
              accountNumber: '12345',
              checkDigit: '6',
              currency: 'BRL',
              status: 'available',
              statusUpdatedAt: new Date().toISOString(),
              lastSyncedAt: undefined,
            },
            lastSync: new Date().toISOString(),
            status: 'active',
          };

          set((state) => ({
            connectedBanks: [...state.connectedBanks, mockAccount],
            isConnecting: false,
          }));
        } catch (error) {
          set({
            lastError: (error as Error).message,
            isConnecting: false,
          });
          throw error;
        }
      },

      disconnectBank: async (accountId: string) => {
        set({ lastError: null });

        try {
          // Revoga consentimento no servidor
          openFinanceService.clearTokens();

          set((state) => ({
            connectedBanks: state.connectedBanks.filter(
              (bank) => bank.account.accountId !== accountId
            ),
          }));
        } catch (error) {
          set({
            lastError: (error as Error).message,
          });
          throw error;
        }
      },

      syncAllAccounts: async () => {
        const { connectedBanks, syncAccount } = get();

        if (connectedBanks.length === 0) return;

        set({ isSyncing: true, syncProgress: 0, lastError: null });

        let synced = 0;
        const total = connectedBanks.length;

        for (const bank of connectedBanks) {
          try {
            await syncAccount(bank.account.accountId);
          } catch (error) {
            console.error(`Erro ao sincronizar conta ${bank.account.accountId}:`, error);
          }

          synced++;
          set({ syncProgress: Math.round((synced / total) * 100) });
        }

        set({ isSyncing: false, syncProgress: 100 });
      },

      syncAccount: async (accountId: string): Promise<SyncResult> => {
        set({ lastError: null });

        try {
          const result = await openFinanceService.syncAccount(accountId);

          // Atualiza ConnectedBank com último sync
          set((state) => ({
            connectedBanks: state.connectedBanks.map((bank) =>
              bank.account.accountId === accountId
                ? { ...bank, lastSync: result.lastSyncDate, status: 'active' as const }
                : bank
            ),
          }));

          return result;
        } catch (error) {
          set((state) => ({
            lastError: (error as Error).message,
            connectedBanks: state.connectedBanks.map((bank) =>
              bank.account.accountId === accountId
                ? { ...bank, status: 'error' as const, errorMessage: (error as Error).message }
                : bank
            ),
          }));

          throw error;
        }
      },

      importTransactions: async (accountId: string) => {
        set({ lastError: null });

        try {
          const transactions = await openFinanceService.getAccountTransactions(accountId, {
            limit: 100,
          });

          const appStore = useAppStore.getState();

          // Converte e importa transações
          for (const tx of transactions) {
            const converted = openFinanceService.convertTransaction(tx);

            await appStore.addTransaction({
              desc: converted.description,
              amount: converted.amount,
              type: converted.type,
              category: converted.category,
              date: converted.date,
            });
          }
        } catch (error) {
          set({
            lastError: (error as Error).message,
          });
          throw error;
        }
      },

      // ===== CARTÕES DE CRÉDITO =====

      connectCreditCard: async (participantId: string) => {
        set({ isConnecting: true, lastError: null });

        try {
          // Gera URL de consentimento para cartões
          const consentUrl = openFinanceService.generateCreditCardConsentUrl();

          // Em desenvolvimento, simulamos a conexão
          // Em produção, abriríamos a URL em popup
          const mockCard: ConnectedCreditCard = {
            card: {
              id: `cc_${Date.now()}`,
              participantId,
              participantName: 'Emissor Simulado',
              brandName: 'Emissor Simulado',
              cnpjNumber: '00000000000191',
              cardId: `cc_of_${Date.now()}`,
              cardNumber: '**** **** **** 1234',
              cardLast4Digits: '1234',
              cardBrand: 'visa',
              accountId: `cc_acc_${Date.now()}`,
              accountType: 'credit_card',
              creditCardAccountNumber: '1234567890123456',
              productName: 'Cartão Platinum',
              status: 'available',
              statusUpdatedAt: new Date().toISOString(),
              openedAt: new Date().toISOString(),
              lastSyncedAt: undefined,
            },
            lastSync: new Date().toISOString(),
            status: 'active',
          };

          set((state) => ({
            connectedCreditCards: [...state.connectedCreditCards, mockCard],
            isConnecting: false,
          }));
        } catch (error) {
          set({
            lastError: (error as Error).message,
            isConnecting: false,
          });
          throw error;
        }
      },

      disconnectCreditCard: async (cardId: string) => {
        set({ lastError: null });

        try {
          // Revoga consentimento no servidor
          openFinanceService.clearTokens();

          set((state) => ({
            connectedCreditCards: state.connectedCreditCards.filter(
              (card) => card.card.cardId !== cardId
            ),
          }));
        } catch (error) {
          set({
            lastError: (error as Error).message,
          });
          throw error;
        }
      },

      syncCreditCard: async (cardId: string) => {
        set({ lastError: null });

        try {
          const result = await openFinanceService.syncCreditCard(cardId);

          // Atualiza ConnectedCreditCard com último sync
          set((state) => ({
            connectedCreditCards: state.connectedCreditCards.map((card) =>
              card.card.cardId === cardId
                ? {
                    ...card,
                    lastSync: result.lastSyncDate,
                    card: { ...card.card, lastSyncedAt: result.lastSyncDate },
                    status: 'active' as const,
                  }
                : card
            ),
          }));

          return result;
        } catch (error) {
          set((state) => ({
            lastError: (error as Error).message,
            connectedCreditCards: state.connectedCreditCards.map((card) =>
              card.card.cardId === cardId
                ? { ...card, status: 'error' as const, errorMessage: (error as Error).message }
                : card
            ),
          }));

          throw error;
        }
      },

      importCreditCardTransactions: async (cardId: string) => {
        set({ lastError: null });

        try {
          const transactions = await openFinanceService.getCreditCardTransactions(cardId, {
            limit: 100,
          });

          const appStore = useAppStore.getState();

          // Converte e importa transações de cartão
          for (const tx of transactions) {
            const converted = openFinanceService.convertCreditCardTransaction(tx);

            await appStore.addTransaction({
              desc: converted.description,
              amount: converted.amount,
              type: converted.type,
              category: converted.category,
              date: converted.date,
            });
          }
        } catch (error) {
          set({
            lastError: (error as Error).message,
          });
          throw error;
        }
      },

      // ===== AÇÕES GERAIS =====

      syncAll: async () => {
        const { connectedBanks, connectedCreditCards, syncAccount, syncCreditCard } = get();

        if (connectedBanks.length === 0 && connectedCreditCards.length === 0) return;

        set({ isSyncing: true, syncProgress: 0, lastError: null });

        let synced = 0;
        const total = connectedBanks.length + connectedCreditCards.length;

        // Sincroniza contas bancárias
        for (const bank of connectedBanks) {
          try {
            await syncAccount(bank.account.accountId);
          } catch (error) {
            console.error(`Erro ao sincronizar conta ${bank.account.accountId}:`, error);
          }

          synced++;
          set({ syncProgress: Math.round((synced / total) * 100) });
        }

        // Sincroniza cartões de crédito
        for (const card of connectedCreditCards) {
          try {
            await syncCreditCard(card.card.cardId);
          } catch (error) {
            console.error(`Erro ao sincronizar cartão ${card.card.cardId}:`, error);
          }

          synced++;
          set({ syncProgress: Math.round((synced / total) * 100) });
        }

        set({ isSyncing: false, syncProgress: 100 });
      },

      clearError: () => set({ lastError: null }),
    }),
    {
      name: 'fins-openfinance',
      partialize: (state) => ({
        connectedBanks: state.connectedBanks,
        connectedCreditCards: state.connectedCreditCards,
      }),
    }
  )
);

// Selectors
export const selectConnectedBanks = (state: OpenFinanceState) => state.connectedBanks;
export const selectConnectedCreditCards = (state: OpenFinanceState) => state.connectedCreditCards;
export const selectIsConnecting = (state: OpenFinanceState) => state.isConnecting;
export const selectIsSyncing = (state: OpenFinanceState) => state.isSyncing;
export const selectSyncProgress = (state: OpenFinanceState) => state.syncProgress;
export const selectLastError = (state: OpenFinanceState) => state.lastError;

export default useOpenFinanceStore;
