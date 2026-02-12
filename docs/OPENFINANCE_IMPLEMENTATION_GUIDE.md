# Guia de Implementação - Open Finance Brasil Real

## Visão Geral

Este guia explica como conectar contas bancárias e cartões de crédito reais no Open Finance Brasil.

## Pré-requisitos

### 1. Cadastro no Diretório do Open Finance

Acesse o [Portal do Desenvolvedor Open Finance Brasil](https://openbankingbrasil.org.br/portal-do-participante/) e siga os passos:

1. **Crie uma conta** no Portal do Participante
2. **Solicite participação** como Iniciadora de Serviços
3. **Preencha o formulário** com informações da sua aplicação
4. **Aguarde aprovação** (pode levar algumas semanas)

### 2. Documentação Necessária

Prepare os seguintes documentos:

- Termo de Responsabilidade assinado
- Políticas de segurança e privacidade
- Descrição do caso de uso
- Comprovante de domínio/website

## Configuração Técnica

### 1. Certificados SSL/TLS

O Open Finance requer certificados de segurança para comunicação:

```bash
# Gerar chave privada
openssl genrsa -out private.key 2048

# Gerar CSR (Certificate Signing Request)
openssl req -new -key private.key -out cert.csr

# Enviar CSR para certificação no Open Finance
# Você receberá o certificado após aprovação
```

### 2. Variáveis de Ambiente

No seu `.env`, configure:

```env
# Open Finance Production
VITE_OPEN_FINANCE_API_URL=https://api.openbanking.br
VITE_OPEN_FINANCE_CLIENT_ID=seu-client-id-oficial
VITE_OPEN_FINANCE_CLIENT_SECRET=seu-client-secret-oficial
VITE_OPEN_FINANCE_REDIRECT_URI=https://seusite.com/openfinance/callback
VITE_OPEN_FINANCE_AUTH_URL=https://auth.openbanking.br/oauth/authorize
VITE_OPEN_FINANCE_TOKEN_URL=https://auth.openbanking.br/oauth/token
```

## Implementação do Fluxo OAuth2 com PKCE

### 1. Gerar Code Verifier e Code Challenge

```typescript
// src/services/oauthService.ts

export class OAuthService {
  private codeVerifier: string = '';

  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.codeVerifier = this.base64URLEncode(array);
    return this.codeVerifier;
  }

  async generateCodeChallenge(): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(hash));
  }

  private base64URLEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
```

### 2. Fluxo de Consentimento

```typescript
// src/services/openFinanceService.ts

class OpenFinanceService {
  private oauth = new OAuthService();

  async initiateConsent(type: 'bank' | 'credit_card'): Promise<string> {
    const codeVerifier = this.oauth.generateCodeVerifier();
    const codeChallenge = await this.oauth.generateCodeChallenge();
    const state = crypto.randomUUID();

    // Armazenar codeVerifier para troca posterior
    sessionStorage.setItem('of_code_verifier', codeVerifier);
    sessionStorage.setItem('of_state', state);

    const permissions =
      type === 'credit_card'
        ? [
            'CREDIT_CARDS_ACCOUNTS_READ',
            'CREDIT_CARDS_ACCOUNTS_BALANCES_READ',
            'CREDIT_CARDS_ACCOUNTS_TRANSACTIONS_READ',
          ]
        : ['ACCOUNTS_READ', 'ACCOUNTS_BALANCES_READ', 'ACCOUNTS_TRANSACTIONS_READ'];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: OPEN_FINANCE_CONFIG.clientId,
      redirect_uri: OPEN_FINANCE_CONFIG.redirectUri,
      scope: permissions.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${OPEN_FINANCE_CONFIG.authUrl}?${params.toString()}`;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const storedState = sessionStorage.getItem('of_state');
    if (state !== storedState) {
      throw new Error('Estado CSRF inválido');
    }

    const codeVerifier = sessionStorage.getItem('of_code_verifier');

    const response = await fetch(OPEN_FINANCE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: OPEN_FINANCE_CONFIG.clientId,
        client_secret: OPEN_FINANCE_CONFIG.clientSecret,
        redirect_uri: OPEN_FINANCE_CONFIG.redirectUri,
        code_verifier: codeVerifier || '',
      }),
    });

    const data = await response.json();
    this.setTokens(data.access_token, data.refresh_token, data.expires_in);
  }
}
```

## Usando um Aggregador (Recomendado para Iniciantes)

### Por que usar um aggregador?

- **Menor complexidade**: Não precisa de certificados próprios
- ** faster onboarding**: Aprovação mais rápida
- **Suporte nativo**: Documentação e SDKs prontos

### Aggregadores Populares

| Aggregador          | Site                     | Vantagens           |
| ------------------- | ------------------------ | ------------------- |
| Sensedia            | sensedia.com             | Maturidade, suporte |
| Accenture           | accenture.com            | Enterprise grade    |
| C6 Bank             | c6bank.com.br            | Foco no Brasil      |
| Open Finance Brasil | openbankingbrasil.org.br | Oficial             |

### Exemplo com Aggregador (Sensedia)

```typescript
// Usando SDK do aggregador
import { SensediaOpenFinance } from '@sensedia/openfinance-sdk';

const client = new SensediaOpenFinance({
  clientId: 'seu-client-id',
  clientSecret: 'seu-client-secret',
  environment: 'production',
});

// Conectar conta bancária
const consentUrl = await client.createConsent({
  permissions: ['ACCOUNTS_READ', 'ACCOUNTS_TRANSACTIONS_READ'],
  redirectUri: 'https://seusite.com/callback',
});

// Após autorização
const tokens = await client.exchangeCode(code);
const accounts = await client.getAccounts(tokens.accessToken);

// Conectar cartão de crédito
const creditCardConsent = await client.createConsent({
  permissions: ['CREDIT_CARDS_ACCOUNTS_READ', 'CREDIT_CARDS_TRANSACTIONS_READ'],
  redirectUri: 'https://seusite.com/callback',
});
```

## Implementação no Seu Site

### 1. Adicionar botão de conexão

```tsx
// src/components/OpenFinanceConnect.tsx

export function OpenFinanceConnect() {
  const handleConnect = async (type: 'bank' | 'credit_card') => {
    const consentUrl = await openFinanceService.initiateConsent(type);
    window.location.href = consentUrl;
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => handleConnect('bank')}
        className="w-full flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-lg"
      >
        <Building2 className="w-5 h-5" />
        Conectar Conta Bancária
      </button>

      <button
        onClick={() => handleConnect('credit_card')}
        className="w-full flex items-center justify-center gap-2 p-4 bg-purple-600 text-white rounded-lg"
      >
        <CreditCard className="w-5 h-5" />
        Conectar Cartão de Crédito
      </button>
    </div>
  );
}
```

### 2. Página de callback

```tsx
// src/pages/OpenFinanceCallback.tsx

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { openFinanceService } from '@/services/openFinanceService';

export function OpenFinanceCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Erro no consentimento:', error);
      navigate('/settings?openfinance=error');
      return;
    }

    if (code && state) {
      openFinanceService
        .handleCallback(code, state)
        .then(() => {
          navigate('/settings?openfinance=success');
        })
        .catch((err) => {
          console.error('Erro ao processar callback:', err);
          navigate('/settings?openfinance=error');
        });
    }
  }, [searchParams, navigate]);

  return <div>Processando conexão...</div>;
}
```

### 3. Configurar rotas

```tsx
// src/App.tsx

<Routes>
  <Route path="/openfinance/callback" element={<OpenFinanceCallback />} />
  {/* outras rotas */}
</Routes>
```

## Testes em Sandbox

### Open Finance Sandbox

O Open Finance oferece um ambiente de testes:

```env
VITE_OPEN_FINANCE_API_URL=https://apigateway.sandbox.openbanking.br
VITE_OPEN_FINANCE_AUTH_URL=https://auth.sandbox.openbanking.br/oauth/authorize
VITE_OPEN_FINANCE_TOKEN_URL=https://auth.sandbox.openbanking.br/oauth/token
```

### Dados de teste (Sandbox)

| Banco           | CPF         | Senha       |
| --------------- | ----------- | ----------- |
| Banco do Brasil | 01160352601 | password123 |
| Bradesco        | 01160352601 | password123 |
| Itaú            | 01160352601 | password123 |

## Checklist de Implementação

- [ ] Cadastro aprovado no Open Finance
- [ ] Certificados SSL instalados (se direto)
- [ ] SDK do aggregador configurado (se usado)
- [ ] Fluxo OAuth2 + PKCE implementado
- [ ] Página de callback configurada
- [ ] Tratamento de erros implementado
- [ ] Tokens armazenados com segurança
- [ ] Sincronização automática funcionando
- [ ] Testes em Sandbox concluídos
- [ ] Produção aprovada

## Referências

- [Portal do Desenvolvedor Open Finance](https://openbankingbrasil.atlassian.net/wiki/spaces/OF/overview)
- [Especificação Open Finance](https://openbankingbrasil.atlassian.net/wiki/spaces/OF/overview)
- [Guia de Segurança](https://openbankingbrasil.org.br/wp-content/uploads/2022/06/Guia-de-Seguranca-Open-Banking.pdf)
- [Sensedia Open Finance](https://sensedia.com/solucoes/open-banking/)
