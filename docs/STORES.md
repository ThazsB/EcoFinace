# Documentação das Stores - Fins

Este documento descreve as stores de estado global utilizadas no projeto, implementadas com [Zustand](https://zustand-demo.pmnd.rs/).

## Visão Geral

O projeto utiliza as seguintes stores:

| Store                | Propósito                                          | Arquivo                            |
| -------------------- | -------------------------------------------------- | ---------------------------------- |
| `authStore`          | Autenticação e perfil do usuário                   | `src/stores/authStore.ts`          |
| `appStore`           | Dados da aplicação (transações, orçamentos, metas) | `src/stores/appStore.ts`           |
| `categoriesStore`    | Gerenciamento de categorias                        | `src/stores/categoriesStore.ts`    |
| `notificationsStore` | Centro de notificações                             | `src/stores/notificationsStore.ts` |

---

## authStore

Gerencia o estado de autenticação e dados do usuário.

### Estrutura do Estado

```typescript
interface AuthState {
  user: User | null;
  profiles: Profile[];
  currentProfileId: string | null;
  isLoading: boolean;
  error: string | null;
}
```

### Métodos

| Método                     | Descrição            | Parâmetros                        | Retorno         |
| -------------------------- | -------------------- | --------------------------------- | --------------- |
| `login(email, password)`   | Realiza login        | `email: string, password: string` | `Promise<void>` |
| `logout()`                 | Realiza logout       | -                                 | `void`          |
| `setUser(user)`            | Define usuário atual | `user: User`                      | `void`          |
| `addProfile(profile)`      | Adiciona perfil      | `profile: Profile`                | `void`          |
| `switchProfile(profileId)` | Troca perfil atual   | `profileId: string`               | `Promise<void>` |
| `deleteProfile(profileId)` | Remove perfil        | `profileId: string`               | `Promise<void>` |

### Exemplo de Uso

```typescript
import { useAuthStore } from '@/stores/authStore';

function LoginComponent() {
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    await login('email@exemplo.com', 'senha123');
  };

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? 'Entrando...' : 'Entrar'}
    </button>
  );
}
```

---

## appStore

Gerencia os dados principais da aplicação: transações, orçamentos, metas e valores fixos.

### Estrutura do Estado

```typescript
interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  fixedExpenses: FixedExpense[];
  isLoading: boolean;
  error: string | null;
}
```

### Métodos

| Método                           | Descrição                    | Parâmetros                                  | Retorno          |
| -------------------------------- | ---------------------------- | ------------------------------------------- | ---------------- |
| `init(userId)`                   | Inicializa dados do usuário  | `userId: string`                            | `Promise<void>`  |
| `addTransaction(transaction)`    | Adiciona transação           | `transaction: Transaction`                  | `Promise<void>`  |
| `updateTransaction(id, updates)` | Atualiza transação           | `id: string, updates: Partial<Transaction>` | `Promise<void>`  |
| `deleteTransaction(id)`          | Remove transação             | `id: string`                                | `Promise<void>`  |
| `addBudget(budget)`              | Adiciona orçamento           | `budget: Budget`                            | `Promise<void>`  |
| `updateBudget(id, updates)`      | Atualiza orçamento           | `id: string, updates: Partial<Budget>`      | `Promise<void>`  |
| `deleteBudget(id)`               | Remove orçamento             | `id: string`                                | `Promise<void>`  |
| `addGoal(goal)`                  | Adiciona meta                | `goal: Goal`                                | `Promise<void>`  |
| `updateGoal(id, updates)`        | Atualiza meta                | `id: string, updates: Partial<Goal>`        | `Promise<void>`  |
| `deleteGoal(id)`                 | Remove meta                  | `id: string`                                | `Promise<void>`  |
| `addFixedExpense(expense)`       | Adiciona valor fixo          | `expense: FixedExpense`                     | `Promise<void>`  |
| `getActiveFixedExpenses()`       | Retorna valores fixos ativos | -                                           | `FixedExpense[]` |

### Seletores Úteis

```typescript
import { useAppStore } from '@/stores/appStore';

// Seletor para transações do mês atual
const currentMonthTransactions = useAppStore((state) => {
  const now = new Date();
  return state.transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });
});

// Seletor para total de despesas
const totalExpenses = useAppStore((state) =>
  state.transactions.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
);
```

---

## categoriesStore

Gerencia as categorias de transações (sistema e personalizadas).

### Estrutura do Estado

```typescript
interface CategoriesState {
  systemCategories: Category[];
  customCategories: Category[];
  isLoading: boolean;
  error: string | null;
}
```

### Métodos

| Método                        | Descrição                | Parâmetros                               | Retorno                 |
| ----------------------------- | ------------------------ | ---------------------------------------- | ----------------------- |
| `init(userId)`                | Inicializa categorias    | `userId: string`                         | `Promise<void>`         |
| `addCategory(category)`       | Adiciona categoria       | `category: Category`                     | `Promise<void>`         |
| `updateCategory(id, updates)` | Atualiza categoria       | `id: string, updates: Partial<Category>` | `Promise<void>`         |
| `deleteCategory(id)`          | Remove categoria         | `id: string`                             | `Promise<void>`         |
| `getCategoryById(id)`         | Busca categoria por ID   | `id: string`                             | `Category \| undefined` |
| `getCategoryByName(name)`     | Busca categoria por nome | `name: string`                           | `Category \| undefined` |
| `getCategoriesByType(type)`   | Filtra por tipo          | `'income' \| 'expense'`                  | `Category[]`            |

### Constantes de Categorias

O projeto define ícones padrão para categorias:

```typescript
import { CATEGORY_ICONS } from '@/stores/categoriesStore';

CATEGORY_ICONS.forEach((icon) => {
  console.log(`${icon.id}: ${icon.label}`);
});
```

---

## notificationsStore

Gerencia notificações e centro de notificações.

### Estrutura do Estado

```typescript
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
}
```

### Métodos

| Método                          | Descrição              | Parâmetros                       | Retorno |
| ------------------------------- | ---------------------- | -------------------------------- | ------- |
| `addNotification(notification)` | Adiciona notificação   | `notification: Notification`     | `void`  |
| `markAsRead(id)`                | Marca como lida        | `id: string`                     | `void`  |
| `markAllAsRead()`               | Marca todas como lidas | -                                | `void`  |
| `deleteNotification(id)`        | Remove notificação     | `id: string`                     | `void`  |
| `clearAll()`                    | Limpa todas            | -                                | `void`  |
| `updatePreferences(prefs)`      | Atualiza preferências  | `prefs: NotificationPreferences` | `void`  |

### Tipos de Notificação

```typescript
type NotificationType =
  | 'success' // Operação bem-sucedida
  | 'error' // Erro occurred
  | 'warning' // Aviso importante
  | 'info' // Informação geral
  | 'insight' // Insight/通知 financeiro
  | 'delete'; // Confirmação de exclusão
```

---

## Persistência

Todas as stores utilizam persistência automática via `zustand/persist`:

- **authStore**: Persistido no `localStorage`
- **appStore**: Persistido no `localStorage`
- **categoriesStore**: Persistido no `localStorage`
- **notificationsStore**: Persistido no `localStorage`

### Chaves de Storage

```typescript
// src/config/storage.ts
export const STORAGE_KEYS = {
  AUTH: 'fins_auth',
  APP: 'fins_app',
  CATEGORIES: 'fins_categories',
  NOTIFICATIONS: 'fins_notifications',
};
```

---

## Boas Práticas

### 1. Use Seletores Específicos

```typescript
// Ruim: Seleciona todo o estado
const all = useAppStore();

// Bom: Seleciona apenas o necessário
const transactions = useAppStore((state) => state.transactions);
```

### 2. Mantenha Stores Flat

Evite objetos aninhados profundos. Use IDs para referências.

```typescript
// Ruim
const budget = { id: '1', limits: { monthly: { janeiro: 1000 } } };

// Bom
const budget = { id: '1', category: 'Alimentação', limit: 1000, month: '2024-01' };
```

### 3. Use useCallback para Handlers

```typescript
const handleAddTransaction = useCallback(async (tx: Transaction) => {
  await appStore.addTransaction(tx);
}, []);
```
