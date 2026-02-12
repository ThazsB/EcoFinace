/**
 * Tipos TypeScript para Integração com Open Finance Brasil
 * Baseado na especificação: https://openfinancebrasil.atlassian.net/wiki/spaces/OF/pages/17343845
 */

// Tipos de conta
export type BankAccountType = 'checking' | 'savings' | 'salary' | 'payment';

export type BankAccountSubtype = 'individual' | 'joint' | 'simplified' | 'digital' | 'payroll';

// Tipos de cartão de crédito
export type CreditCardAccountType = 'credit_card';

export type CreditCardBrand = 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'outro';

export interface CreditCardAccount {
  id: string;
  participantId: string; // ID do participante (banco/emisso)
  participantName: string; // Nome do emissor
  brandName: string;
  cnpjNumber: string;
  cardId: string;
  cardNumber: string; // Últimos 4 dígitos
  cardLast4Digits: string;
  cardBrand: CreditCardBrand;
  accountId: string;
  accountType: CreditCardAccountType;
  creditCardAccountNumber: string;
  productName: string;
  status: 'available' | 'blocked' | 'canceled';
  statusUpdatedAt: string;
  openedAt: string;
  lastSyncedAt?: string;
}

export interface CreditCardBill {
  cardId: string;
  billId: string;
  dueDate: string;
  billTotalAmount: number;
  billMinimumAmount: number;
  isPaid: boolean;
  currency: string;
}

export interface CreditCardTransaction {
  id: string;
  cardId: string;
  transactionId: string;
  completedAt: string;
  creditDebitType: 'credit';
  amount: number;
  currency: string;
  transactionType: {
    code: string;
    subType: string;
    description: string;
  };
  description: string;
  merchantInfo: {
    name: string;
    mcc: number;
  };
  payeeMCC?: number;
}

export interface CreditCardBalance {
  cardId: string;
  currentAmount: number;
  availableAmount: number;
  creditLimit: number;
  billTotalAmount: number;
  billDueDate: string;
  currency: string;
  lastUpdatedAt: string;
}

export interface BankAccount {
  id: string;
  participantId: string; // ID do participante (banco)
  participantName: string; // Nome do banco
  brandName: string;
  cnpjNumber: string;
  accountId: string;
  accountType: BankAccountType;
  accountSubtype: BankAccountSubtype;
  accountNumber: string;
  checkDigit: string;
  currency: string;
  status: 'available' | 'blocked' | 'unblocked';
  statusUpdatedAt: string;
  lastSyncedAt?: string;
}

export interface BankBalance {
  accountId: string;
  availableAmount: number;
  blockedAmount: number;
  currentAmount: number;
  currency: string;
  lastUpdatedAt: string;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  transactionId: string;
  completedAt: string;
  creditDebitType: 'credit' | 'debit';
  amount: number;
  currency: string;
  transactionType: {
    code: string;
    subType: string;
    description: string;
  };
  counterparty: {
    name: string;
    document: string;
    accountId: string;
  };
  description: string;
  payeeMCC?: number;
}

// Tipos para consentimento
export interface ConsentPayload {
  consentId: string;
  permissions: ConsentPermission[];
  expirationDateTime: string;
  createdAt: string;
}

export type ConsentPermission =
  | 'ACCOUNTS_READ'
  | 'ACCOUNTS_BALANCES_READ'
  | 'ACCOUNTS_TRANSACTIONS_READ'
  | 'CREDIT_CARDS_ACCOUNTS_READ'
  | 'CREDIT_CARDS_ACCOUNTS_BALANCES_READ'
  | 'CREDIT_CARDS_ACCOUNTS_TRANSACTIONS_READ';

// Tipos para lista de participantes
export interface Participant {
  cnpjNumber: string;
  name: string;
  brandName: string;
  url: string;
  isOpened: boolean;
}

export interface ParticipantsResponse {
  data: Participant[];
  lastUpdated: string;
}

// Tipos para importação de extrato
export interface ParsedStatementTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  balance?: number;
  category?: string;
}

export interface StatementImportResult {
  success: boolean;
  transactions: ParsedStatementTransaction[];
  errors: string[];
  totalImported: number;
  totalErrors: number;
}

// Tipos para sincronização
export interface SyncResult {
  accountId: string;
  lastSyncDate: string;
  transactionsCount: number;
  newTransactionsCount: number;
  balance: BankBalance;
}

// Tipos para webhook
export interface WebhookPayload {
  webhookId: string;
  consentId: string;
  eventType: 'TRANSACTION' | 'BALANCE' | 'CONSENT';
  timestamp: string;
  data: unknown;
}

// Configuração do Open Finance
export interface OpenFinanceConfig {
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface ConnectedBank {
  account: BankAccount;
  lastSync: string;
  status: 'active' | 'error' | 'needs_reconsent';
  errorMessage?: string;
}

export interface ConnectedCreditCard {
  card: CreditCardAccount;
  lastSync: string;
  status: 'active' | 'error' | 'needs_reconsent';
  errorMessage?: string;
}

export type ConnectedAccount = ConnectedBank | ConnectedCreditCard;

export type AccountType = 'bank' | 'credit_card';
