/**
 * Serviço de Integração com Open Finance Brasil
 * Gerencia comunicação com APIs bancárias para importação de dados financeiros
 */

import type {
  BankAccount,
  BankBalance,
  BankTransaction,
  ConsentPayload,
  ConsentPermission,
  Participant,
  ConnectedBank,
  ConnectedCreditCard,
  SyncResult,
  CreditCardAccount,
  CreditCardBalance,
  CreditCardTransaction,
} from '@/types/openfinance';

// Configuração da API (normalmente viria de variáveis de ambiente)
const OPEN_FINANCE_CONFIG = {
  apiBaseUrl: import.meta.env.VITE_OPEN_FINANCE_API_URL || 'https://api.openbanking.b3.digital',
  clientId: import.meta.env.VITE_OPEN_FINANCE_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_OPEN_FINANCE_CLIENT_SECRET || '',
  redirectUri:
    import.meta.env.VITE_OPEN_FINANCE_REDIRECT_URI ||
    window.location.origin + '/openfinance/callback',
  authUrl:
    import.meta.env.VITE_OPEN_FINANCE_AUTH_URL ||
    'https://auth.openbanking.b3.digital/oauth/authorize',
  tokenUrl:
    import.meta.env.VITE_OPEN_FINANCE_TOKEN_URL ||
    'https://auth.openbanking.b3.digital/oauth/token',
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  accessToken?: string;
};

class OpenFinanceService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Gera URL de consentimento para iniciar fluxo OAuth2
   */
  generateConsentUrl(permissions: ConsentPermission[]): string {
    const state = this.generateState();
    const scope = permissions.join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: OPEN_FINANCE_CONFIG.clientId,
      redirect_uri: OPEN_FINANCE_CONFIG.redirectUri,
      scope,
      state,
      nonce: crypto.randomUUID(),
    });

    return `${OPEN_FINANCE_CONFIG.authUrl}?${params.toString()}`;
  }

  /**
   * Troca código de autorização por tokens
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(OPEN_FINANCE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: OPEN_FINANCE_CONFIG.clientId,
        client_secret: OPEN_FINANCE_CONFIG.clientSecret,
        redirect_uri: OPEN_FINANCE_CONFIG.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao trocar código por tokens');
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Renova tokens expirados
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('Refresh token não disponível');
    }

    const response = await fetch(OPEN_FINANCE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: OPEN_FINANCE_CONFIG.clientId,
        client_secret: OPEN_FINANCE_CONFIG.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao renovar token');
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
  }

  /**
   * Define tokens armazenados
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = Date.now() + expiresIn * 1000;
  }

  /**
   * Limpa tokens
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Verifica se token está expirado
   */
  isTokenExpired(): boolean {
    return !this.accessToken || Date.now() >= this.tokenExpiresAt;
  }

  /**
   * Faz requisição autenticada para API
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    if (this.isTokenExpired() && this.refreshToken) {
      await this.refreshAccessToken();
    }

    const headers: Record<string, string> = {
      ...options.headers,
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${OPEN_FINANCE_CONFIG.apiBaseUrl}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(error.message || `Erro na requisição: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Lista contas conectadas
   */
  async getAccounts(): Promise<BankAccount[]> {
    const response = await this.request<{ data: BankAccount[] }>(
      '/open-banking/accounts/v1/accounts'
    );
    return response.data;
  }

  /**
   * Obtém saldo de uma conta
   */
  async getAccountBalance(accountId: string): Promise<BankBalance> {
    const response = await this.request<{ data: BankBalance }>(
      `/open-banking/accounts/v1/${accountId}/balances`
    );
    return response.data;
  }

  /**
   * Lista transações de uma conta
   */
  async getAccountTransactions(
    accountId: string,
    params: {
      fromBookingDate?: string;
      toBookingDate?: string;
      limit?: number;
    } = {}
  ): Promise<BankTransaction[]> {
    const queryParams = new URLSearchParams();

    if (params.fromBookingDate) queryParams.set('fromBookingDate', params.fromBookingDate);
    if (params.toBookingDate) queryParams.set('toBookingDate', params.toBookingDate);
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<{ data: BankTransaction[] }>(
      `/open-banking/accounts/v1/${accountId}/transactions${query}`
    );
    return response.data;
  }

  /**
   * Lista participantes (bancos) do Open Finance
   */
  async getParticipants(): Promise<Participant[]> {
    const response = await this.request<{ data: Participant[] }>(
      '/open-banking/participants/v1/participants'
    );
    return response.data;
  }

  /**
   * Cria consentimento para acessar dados
   */
  async createConsent(permissions: ConsentPermission[]): Promise<ConsentPayload> {
    const response = await this.request<{ data: ConsentPayload }>(
      '/open-banking/consents/v1/consents',
      {
        method: 'POST',
        body: {
          data: {
            permissions,
            expirationDateTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      }
    );
    return response.data;
  }

  /**
   * Sincroniza dados de uma conta
   */
  async syncAccount(accountId: string): Promise<SyncResult> {
    const [account, balance, transactions] = await Promise.all([
      this.getAccountBalance(accountId),
      this.getAccountBalance(accountId),
      this.getAccountTransactions(accountId, { limit: 100 }),
    ]);

    return {
      accountId,
      lastSyncDate: new Date().toISOString(),
      transactionsCount: transactions.length,
      newTransactionsCount: 0,
      balance,
    };
  }

  /**
   * Converte transação do Open Finance para formato interno
   */
  convertTransaction(tx: BankTransaction): {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    category: string;
  } {
    return {
      description: tx.description || tx.transactionType.description,
      amount: tx.amount,
      type: tx.creditDebitType === 'credit' ? 'income' : 'expense',
      date: tx.completedAt,
      category: this.mapTransactionCategory(tx.transactionType.code),
    };
  }

  /**
   * Gera state aleatório para proteção CSRF
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Lista cartões de crédito conectados
   */
  async getCreditCards(): Promise<CreditCardAccount[]> {
    const response = await this.request<{ data: CreditCardAccount[] }>(
      '/open-banking/credit-cards-accounts/v1/accounts'
    );
    return response.data;
  }

  /**
   * Obtém saldo de um cartão de crédito
   */
  async getCreditCardBalance(cardId: string): Promise<CreditCardBalance> {
    const response = await this.request<{ data: CreditCardBalance }>(
      `/open-banking/credit-cards-accounts/v1/${cardId}/balances`
    );
    return response.data;
  }

  /**
   * Lista transações de um cartão de crédito
   */
  async getCreditCardTransactions(
    cardId: string,
    params: {
      fromBillingDate?: string;
      toBillingDate?: string;
      limit?: number;
    } = {}
  ): Promise<CreditCardTransaction[]> {
    const queryParams = new URLSearchParams();

    if (params.fromBillingDate) queryParams.set('fromBillingDate', params.fromBillingDate);
    if (params.toBillingDate) queryParams.set('toBillingDate', params.toBillingDate);
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.request<{ data: CreditCardTransaction[] }>(
      `/open-banking/credit-cards-accounts/v1/${cardId}/transactions${query}`
    );
    return response.data;
  }

  /**
   * Sincroniza dados de um cartão de crédito
   */
  async syncCreditCard(cardId: string): Promise<{
    cardId: string;
    lastSyncDate: string;
    transactionsCount: number;
    balance: CreditCardBalance;
  }> {
    const [balance, transactions] = await Promise.all([
      this.getCreditCardBalance(cardId),
      this.getCreditCardTransactions(cardId, { limit: 100 }),
    ]);

    return {
      cardId,
      lastSyncDate: new Date().toISOString(),
      transactionsCount: transactions.length,
      balance,
    };
  }

  /**
   * Converte transação de cartão de crédito para formato interno
   */
  convertCreditCardTransaction(tx: CreditCardTransaction): {
    description: string;
    amount: number;
    type: 'expense';
    date: string;
    category: string;
  } {
    // Transações de cartão de crédito são sempre despesas
    return {
      description: tx.description || tx.merchantInfo.name || tx.transactionType.description,
      amount: tx.amount,
      type: 'expense',
      date: tx.completedAt,
      category: this.mapTransactionCategory(tx.transactionType.code, tx.merchantInfo.mcc),
    };
  }

  /**
   * Mapeia código de transação e MCC para categoria
   */
  private mapTransactionCategory(code: string, mcc?: number): string {
    // Mapeamento por MCC (Merchant Category Code)
    const mccCategoryMap: Record<number, string> = {
      5411: 'Alimentação',
      5541: 'Combustível',
      5812: 'Restaurantes',
      5311: 'Varejo',
      4111: 'Transportes',
      5732: 'Eletrônicos',
      7922: 'Entretenimento',
      3000: 'Aéreo',
      7011: 'Hospedagem',
    };

    // Mapeamento por código de transação
    const categoryMap: Record<string, string> = {
      pix: 'Transferências',
      ted: 'Transferências',
      doc: 'Transferências',
      boleto: 'Pagamentos',
      debit: 'Débito',
      credit: 'Crédito',
      withdrawal: 'Saque',
      deposit: 'Depósito',
      purchase: 'Compras',
      installment_purchase: 'Compras Parceladas',
      recurring: 'Assinaturas',
      payment: 'Pagamento',
      fee: 'Taxas',
      interest: 'Juros',
      reversal: 'Estorno',
      refund: 'Reembolso',
    };

    // Primeiro tenta pelo MCC
    if (mcc && mccCategoryMap[mcc]) {
      return mccCategoryMap[mcc];
    }

    return categoryMap[code.toLowerCase()] || 'Outros';
  }

  /**
   * Lista bancos suportados (mock para desenvolvimento)
   */
  async getSupportedBanks(): Promise<Participant[]> {
    // Em produção, isso consultaria a API de participantes
    return [
      {
        cnpjNumber: '00000000000191',
        name: 'Banco do Brasil',
        brandName: 'Banco do Brasil',
        url: 'https://www.bb.com.br',
        isOpened: true,
      },
      {
        cnpjNumber: '00000000000143',
        name: 'Bradesco',
        brandName: 'Bradesco',
        url: 'https://www.bradesco.com.br',
        isOpened: true,
      },
      {
        cnpjNumber: '00000000000135',
        name: 'Caixa Econômica Federal',
        brandName: 'Caixa',
        url: 'https://www.caixa.gov.br',
        isOpened: true,
      },
      {
        cnpjNumber: '60701190000104',
        name: 'Itaú Unibanco',
        brandName: 'Itaú',
        url: 'https://www.itau.com.br',
        isOpened: true,
      },
      {
        cnpjNumber: '00000000000218',
        name: 'Santander Brasil',
        brandName: 'Santander',
        url: 'https://www.santander.com.br',
        isOpened: true,
      },
      {
        cnpjNumber: '20538738000158',
        name: 'Nu Pagamentos S.A.',
        brandName: 'Nubank',
        url: 'https://nubank.com.br',
        isOpened: true,
      },
    ];
  }

  /**
   * Gera URL de consentimento para cartões de crédito
   */
  generateCreditCardConsentUrl(): string {
    const permissions: ConsentPermission[] = [
      'CREDIT_CARDS_ACCOUNTS_READ',
      'CREDIT_CARDS_ACCOUNTS_BALANCES_READ',
      'CREDIT_CARDS_ACCOUNTS_TRANSACTIONS_READ',
    ];
    return this.generateConsentUrl(permissions);
  }
}

// Singleton instance
export const openFinanceService = new OpenFinanceService();
export default openFinanceService;
