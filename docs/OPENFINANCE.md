# Integração Open Finance Brasil - Documentação Técnica

## Visão Geral

Este documento descreve a implementação da integração com Open Finance Brasil no aplicativo Fins, permitindo conexão automática com contas bancárias, cartões de crédito e importação de extratos.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     Fins Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  BankConnection  │    │TransactionImporter│              │
│  │     Modal        │    │                  │              │
│  └────────┬─────────┘    └────────┬─────────┘              │
│           │                       │                         │
│           └───────────┬───────────┘                         │
│                       │                                     │
│           ┌───────────▼───────────┐                        │
│           │   openFinanceStore    │                        │
│           │     (Zustand)         │                        │
│           └───────────┬───────────┘                        │
│                       │                                     │
│     ┌─────────────────▼─────────────────┐                 │
│     │       openFinanceService          │                 │
│     │     (API Communication)          │                 │
│     └─────────────────┬─────────────────┘                 │
│                       │                                     │
│     ┌─────────────────▼─────────────────┐                 │
│     │       statementParser             │                 │
│     │    (CSV/OFX Processing)          │                 │
│     └──────────────────────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Open Finance API                          │
│         (Bancos Participantes do Open Finance)             │
└─────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. openFinanceService

**Arquivo:** `src/services/openFinanceService.ts`

Responsável pela comunicação com a API do Open Finance.

**Principais métodos:**

| Método                                      | Descrição                                         |
| ------------------------------------------- | ------------------------------------------------- |
| `generateConsentUrl(permissions)`           | Gera URL para consentimento OAuth2                |
| `generateCreditCardConsentUrl()`            | Gera URL para consentimento de cartões de crédito |
| `exchangeCodeForTokens(code)`               | Troca código por tokens                           |
| `getAccounts()`                             | Lista contas bancárias conectadas                 |
| `getCreditCards()`                          | Lista cartões de crédito conectados               |
| `getAccountBalance(accountId)`              | Obtém saldo de uma conta bancária                 |
| `getCreditCardBalance(cardId)`              | Obtém limite e saldo de cartão de crédito         |
| `getAccountTransactions(accountId, params)` | Lista transações de conta                         |
| `getCreditCardTransactions(cardId, params)` | Lista transações de cartão                        |
| `syncAccount(accountId)`                    | Sincroniza dados de uma conta                     |
| `syncCreditCard(cardId)`                    | Sincroniza dados de um cartão                     |
| `convertTransaction(tx)`                    | Converte transação bancária                       |
| `convertCreditCardTransaction(tx)`          | Converte transação de cartão                      |

### 2. openFinanceStore

**Arquivo:** `src/stores/openFinanceStore.ts`

Gerencia estado da integração bancária com persistência.

**Estado:**

```typescript
interface OpenFinanceState {
  connectedBanks: ConnectedBank[];
  connectedCreditCards: ConnectedCreditCard[];
  isConnecting: boolean;
  isSyncing: boolean;
  syncProgress: number;
  lastError: string | null;
}
```

**Ações para contas bancárias:**

- `connectBank(participantId)` - Conecta conta bancária
- `disconnectBank(accountId)` - Desconecta conta bancária
- `syncAccount(accountId)` - Sincroniza conta bancária
- `importTransactions(accountId)` - Importa transações

**Ações para cartões de crédito:**

- `connectCreditCard(participantId)` - Conecta cartão de crédito
- `disconnectCreditCard(cardId)` - Desconecta cartão de crédito
- `syncCreditCard(cardId)` - Sincroniza cartão de crédito
- `importCreditCardTransactions(cardId)` - Importa transações de cartão

### 3. statementParser

**Arquivo:** `src/utils/statementParser.ts`

Parser de extratos bancários em CSV e OFX.

**Formatos suportados:**

- CSV (Itáu, Bradesco, BB, Caixa, Santander, Nubank, Inter)
- OFX/QFX (versão simplificada)

**Principais funções:**

| Função                           | Descrição                         |
| -------------------------------- | --------------------------------- |
| `parseCsv(content, options)`     | Parseia CSV                       |
| `parseOfx(content)`              | Parseia OFX                       |
| `parseStatement(content)`        | Detecta e parseia automaticamente |
| `detectStatementFormat(content)` | Detecta formato                   |
| `exportToCsv(transactions)`      | Exporta para CSV                  |

### 4. Componentes UI

| Componente            | Arquivo                   | Descrição                           |
| --------------------- | ------------------------- | ----------------------------------- |
| `BankConnectionModal` | `BankConnectionModal.tsx` | Modal de conexão bancária e cartões |
| `BankAccountList`     | `BankAccountList.tsx`     | Lista contas e cartões conectados   |
| `TransactionImporter` | `TransactionImporter.tsx` | Importação de extratos              |

## Tipos TypeScript

**Arquivo:** `src/types/openfinance.ts`

### Conta Bancária

```typescript
interface BankAccount {
  id: string;
  participantId: string;
  participantName: string;
  brandName: string;
  cnpjNumber: string;
  accountId: string;
  accountType: 'checking' | 'savings' | 'salary' | 'payment';
  accountSubtype: 'individual' | 'joint' | 'simplified' | 'digital' | 'payroll';
  accountNumber: string;
  checkDigit: string;
  currency: string;
  status: 'available' | 'blocked' | 'unblocked';
  statusUpdatedAt: string;
  lastSyncedAt?: string;
}
```

### Cartão de Crédito

```typescript
interface CreditCardAccount {
  id: string;
  participantId: string;
  participantName: string;
  brandName: string;
  cnpjNumber: string;
  cardId: string;
  cardNumber: string;
  cardLast4Digits: string;
  cardBrand: 'visa' | 'mastercard' | 'amex' | 'elo' | 'hipercard' | 'outro';
  accountId: string;
  accountType: 'credit_card';
  productName: string;
  status: 'available' | 'blocked' | 'canceled';
  statusUpdatedAt: string;
  openedAt: string;
  lastSyncedAt?: string;
}

interface CreditCardBalance {
  cardId: string;
  currentAmount: number;
  availableAmount: number;
  creditLimit: number;
  billTotalAmount: number;
  billDueDate: string;
  currency: string;
  lastUpdatedAt: string;
}

interface CreditCardTransaction {
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
}
```

### Transação

```typescript
interface BankTransaction {
  transactionId: string;
  completedAt: string;
  amount: number;
  creditDebitType: 'credit' | 'debit';
  description: string;
  transactionType: {
    code: string;
    subType: string;
    description: string;
  };
}
```

## Configuração

### Variáveis de Ambiente

```env
VITE_OPEN_FINANCE_API_URL=https://api.openbanking.b3.digital
VITE_OPEN_FINANCE_CLIENT_ID=seu-client-id
VITE_OPEN_FINANCE_CLIENT_SECRET=seu-client-secret
VITE_OPEN_FINANCE_REDIRECT_URI=http://localhost:5173/openfinance/callback
VITE_OPEN_FINANCE_AUTH_URL=https://auth.openbanking.b3.digital/oauth/authorize
VITE_OPEN_FINANCE_TOKEN_URL=https://auth.openbanking.b3.digital/oauth/token
```

## Fluxo de Conexão (Conta Bancária)

```
1. Usuário clica em "Conectar Conta"
         │
         ▼
2. Abre BankConnectionModal (aba "Banco" selecionada)
         │
         ▼
3. Seleciona banco da lista
         │
         ▼
4. Gera URL de consentimento OAuth2
         │
         ▼
5. Redireciona para página do banco
         │
         ▼
6. Usuário autoriza acesso
         │
         ▼
7. Recebe código de autorização
         │
         ▼
8. Troca código por tokens
         │
         ▼
9. Salva tokens no store
         │
         ▼
10. Conta aparece em BankAccountList
```

## Fluxo de Conexão (Cartão de Crédito)

```
1. Usuário clica em "Conectar"
         │
         ▼
2. Abre BankConnectionModal (seleciona aba "Cartão")
         │
         ▼
3. Seleciona emissor do cartão
         │
         ▼
4. Gera URL de consentimento para cartões
         │
         ▼
5. Redireciona para página do emissor
         │
         ▼
6. Usuário autoriza acesso
         │
         ▼
7. Recebe código de autorização
         │
         ▼
8. Troca código por tokens
         │
         ▼
9. Salva tokens no store
         │
         ▼
10. Cartão aparece em BankAccountList
```

## Permissões Open Finance

### Contas Bancárias

- `ACCOUNTS_READ` - Leitura de contas
- `ACCOUNTS_BALANCES_READ` - Leitura de saldos
- `ACCOUNTS_TRANSACTIONS_READ` - Leitura de transações

### Cartões de Crédito

- `CREDIT_CARDS_ACCOUNTS_READ` - Leitura de cartões
- `CREDIT_CARDS_ACCOUNTS_BALANCES_READ` - Leitura de limites e saldos
- `CREDIT_CARDS_ACCOUNTS_TRANSACTIONS_READ` - Leitura de transações

## Mapeamento de Categorias

### Transações Bancárias

```typescript
const categoryMap = {
  pix: 'Transferências',
  ted: 'Transferências',
  doc: 'Transferências',
  boleto: 'Pagamentos',
  debit: 'Débito',
  credit: 'Crédito',
  withdrawal: 'Saque',
  deposit: 'Depósito',
};
```

### Transações de Cartão de Crédito (por MCC)

```typescript
const mccCategoryMap = {
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
```

### Códigos de Transação de Cartão

```typescript
const cardCategoryMap = {
  purchase: 'Compras',
  installment_purchase: 'Compras Parceladas',
  recurring: 'Assinaturas',
  payment: 'Pagamento',
  fee: 'Taxas',
  interest: 'Juros',
  reversal: 'Estorno',
  refund: 'Reembolso',
};
```

## Formatos CSV Suportados

### Itáu

```
Data;Descrição;Valor;Saldo
15/01/2024;SUPERMERCADO;150,00;5000,00
```

### Bradesco

```
Data;Lançamento;Valor;Saldo
15/01/2024;SUPERMERCADO;150,00;5000,00
```

### Nubank

```
date,description,amount,balance
2024-01-15,Supermercado,150.00,5000.00
```

## Segurança

### OAuth 2.0 + PKCE

A implementação utiliza OAuth 2.0 com PKCE (Proof Key for Code Exchange) para segurança máxima:

1. **Code Verifier**: String aleatória de 43-128 caracteres
2. **Code Challenge**: Hash SHA-256 do code verifier
3. **State**: Proteção contra CSRF

### Armazenamento de Tokens

- Tokens são armazenados em memória
- Refresh token é persistido no localStorage (criptografado)
- Tokens nunca são expostos em URLs

## Webhooks

O sistema suporta webhooks para atualizações em tempo real:

```typescript
interface WebhookPayload {
  webhookId: string;
  consentId: string;
  eventType: 'TRANSACTION' | 'BALANCE' | 'CONSENT';
  timestamp: string;
  data: unknown;
}
```

## Testes

### Executar testes

```bash
npm run test
```

### Testes de integração

```typescript
// src/test/openfinance.test.ts
describe('OpenFinance Service', () => {
  it('deve conectar com banco simulado', async () => {
    const service = new OpenFinanceService();
    await service.connectBank('mock_participant');
    expect(service.isConnected()).toBe(true);
  });

  it('deve sincronizar transações bancárias', async () => {
    const result = await service.syncAccount('acc_123');
    expect(result.transactionsCount).toBeGreaterThan(0);
  });

  it('deve conectar cartão de crédito simulado', async () => {
    const service = new OpenFinanceService();
    await service.connectCreditCard('mock_participant');
    expect(service.isConnected()).toBe(true);
  });

  it('deve sincronizar transações de cartão', async () => {
    const result = await service.syncCreditCard('cc_123');
    expect(result.transactionsCount).toBeGreaterThan(0);
  });
});
```

## Limitações Atuais

1. **Mock de bancos**: Implementação atual usa bancos mockados
2. **Sem backend**: API Open Finance requer servidor para segurança
3. **Limitado a 100 transações**: Paginação não implementada
4. **Categorização por MCC limitada**: Apenas principais MCCs mapeados

## Próximos Passos

1. Implementar backend com segurança OAuth 2.0
2. Integrar com provider Open Finance certificado
3. Adicionar paginação de transações
4. Implementar webhooks
5. Suportar mais formatos de CSV
6. Adicionar categorização por IA
7. Suportar múltiplos titulares por conta
8. Adicionar suporte a cartões pré-pagos

## Referências

- [Open Finance Brasil](https://openfinancebrasil.org/)
- [Especificação Open Finance](https://openbanking-brasil.atlassian.net/wiki/spaces/OF/overview)
- [OAuth 2.0](https://oauth.net/2/)
- [PKCE](https://oauth.net/2/pkce/)
- [MCC Codes](https://www.emvco.com/emv-standards/)
