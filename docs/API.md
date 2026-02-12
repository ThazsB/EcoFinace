# Documentação da API - Fins

Este documento descreve as interfaces TypeScript utilizadas no projeto.

## Tipos Principais

### Transaction

Representa uma transação financeira.

```typescript
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO 8601
  profileId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Exemplo:**

```json
{
  "id": "tx_123",
  "description": "Supermercado",
  "amount": 250.0,
  "type": "expense",
  "category": "Alimentação",
  "date": "2024-01-15",
  "profileId": "profile_1",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### Budget

Representa um orçamento mensal por categoria.

```typescript
interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string; // Formato: "YYYY-MM"
  profileId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Exemplo:**

```json
{
  "id": "bud_123",
  "category": "Alimentação",
  "limit": 1000.0,
  "month": "2024-01",
  "profileId": "profile_1",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### Goal

Representa uma meta financeira.

```typescript
interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO 8601
  icon?: string;
  color?: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Exemplo:**

```json
{
  "id": "goal_123",
  "name": "Viagem",
  "targetAmount": 5000.0,
  "currentAmount": 1500.0,
  "deadline": "2024-12-31",
  "icon": "plane",
  "color": "#6366F1",
  "profileId": "profile_1",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### Category

Representa uma categoria de transação.

```typescript
interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isSystem: boolean;
  isActive: boolean;
  profileId?: string; // Apenas para categorias customizadas
  createdAt: string;
  updatedAt: string;
}
```

**Exemplo:**

```json
{
  "id": "cat_123",
  "name": "Alimentação",
  "type": "expense",
  "icon": "utensils",
  "color": "#EF4444",
  "isSystem": true,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### FixedExpense

Representa uma receita ou despesa fixa recorrente.

```typescript
interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  dayOfMonth: number; // 1-31
  isActive: boolean;
  startDate: string;
  endDate?: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
}
```

**Exemplo:**

```json
{
  "id": "fix_123",
  "description": "Aluguel",
  "amount": 1200.0,
  "type": "expense",
  "category": "Moradia",
  "dayOfMonth": 5,
  "isActive": true,
  "startDate": "2024-01-01",
  "profileId": "profile_1",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### User

Representa um usuário autenticado.

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Profile

Representa um perfil financeiro (para uso múltiplo).

```typescript
interface Profile {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## Tipos de Notificação

### Notification

Representa uma notificação do sistema.

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category?: NotificationCategory;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}
```

**NotificationType:**

```typescript
type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'insight' | 'delete';
```

**NotificationCategory:**

```typescript
type NotificationCategory = 'transaction' | 'budget' | 'goal' | 'system' | 'insight' | 'reminder';
```

---

## Utility Types

### Tipos de Resposta de API

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

### Tipos de Filtro

```typescript
interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

interface DateRange {
  start: string;
  end: string;
}
```

---

## Constantes

### Icons de Categoria

```typescript
const CATEGORY_ICONS = [
  { id: 'wallet', label: 'Carteira', component: Wallet },
  { id: 'food', label: 'Alimentação', component: Utensils },
  { id: 'home', label: 'Moradia', component: Home },
  { id: 'car', label: 'Transporte', component: Car },
  { id: 'plane', label: 'Viagem', component: Plane },
  { id: 'health', label: 'Saúde', component: Heart },
  { id: 'education', label: 'Educação', component: GraduationCap },
  { id: 'entertainment', label: 'Entretenimento', component: Film },
  { id: 'shopping', label: 'Compras', component: ShoppingBag },
  { id: 'work', label: 'Trabalho', component: Briefcase },
  { id: 'gift', label: 'Presentes', component: Gift },
  { id: 'other', label: 'Outros', component: MoreHorizontal },
];
```

### Tipos de Transação

```typescript
const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

const TRANSACTION_TYPE_LABELS = {
  income: 'Receita',
  expense: 'Despesa',
};
```

---

## Esquema de Validação (Zod)

### TransactionSchema

```typescript
import { z } from 'zod';

export const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Categoria obrigatória'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }),
});
```

### BudgetSchema

```typescript
export const budgetSchema = z.object({
  category: z.string().min(1, 'Categoria obrigatória'),
  limit: z.number().positive('Limite deve ser positivo'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
});
```

### GoalSchema

```typescript
export const goalSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  targetAmount: z.number().positive('Valor alvo deve ser positivo'),
  deadline: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }),
});
```
