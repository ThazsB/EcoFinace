# Documentação de Componentes - Fins

Este documento descreve os principais componentes do projeto.

## Índice

- [Layout](#layout)
- [Transações](#transações)
- [Categorias](#categorias)
- [Orçamentos](#orçamentos)
- [Metas](#metas)
- [Notificações](#notificações)
- [UI](#ui)

---

## Layout

### DashboardLayout

Componente de layout principal que envolve todas as páginas.

```typescript
import { DashboardLayout } from '@/components/layout/DashboardLayout';

<DashboardLayout>
  <Dashboard />
</DashboardLayout>
```

**Props:**

| Prop            | Tipo         | Padrão | Descrição                      |
| --------------- | ------------ | ------ | ------------------------------ |
| children        | `ReactNode`  | -      | Conteúdo da página             |
| sidebarOpen     | `boolean`    | -      | Estado do sidebar (controlado) |
| onSidebarToggle | `() => void` | -      | Callback para toggle           |

**Funcionalidades:**

- Menu lateral responsivo (hamburger menu em mobile)
- Header com título e ações contextuais
- Container principal com espaçamento adequado

---

## Transações

### TransactionList

Lista de transações com suporte a visualização em lista ou grid.

```typescript
import { TransactionList } from '@/components/TransactionList';

<TransactionList
  transactions={transactions}
  showActions={true}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Props:**

| Prop         | Tipo                        | Padrão  | Descrição              |
| ------------ | --------------------------- | ------- | ---------------------- |
| transactions | `Transaction[]`             | -       | Lista de transações    |
| showActions  | `boolean`                   | `true`  | Mostrar botões de ação |
| onEdit       | `(tx: Transaction) => void` | -       | Callback de edição     |
| onDelete     | `(tx: Transaction) => void` | -       | Callback de exclusão   |
| compact      | `boolean`                   | `false` | Versão compacta        |

### TransactionItem

Item individual de transação.

```typescript
<TransactionItem
  transaction={tx}
  onClick={() => console.log(tx)}
  showCategory={true}
/>
```

### AdvancedFilters

Filtros avançados para transações.

```typescript
<AdvancedFilters
  filters={filters}
  onChange={setFilters}
  onClear={() => setFilters({})}
/>
```

**Filtros disponíveis:**

- Tipo (receita/despesa)
- Categoria
- Período (data inicial/final)
- Valor mínimo/máximo
- Descrição (busca)

---

## Categorias

### CategoriesManager

Gerenciador completo de categorias.

```typescript
<CategoriesManager
  onSelect={(cat) => console.log(cat)}
  onClose={() => setShowManager(false)}
/>
```

**Funcionalidades:**

- Visualização em lista ou grid
- Pesquisa de categorias
- Criação/edição/exclusão
- Cores e ícones customizáveis

### CategoryIconSelector

Seletor de ícone para categorias.

```typescript
<CategoryIconSelector
  selectedIcon="food"
  onSelect={(icon) => setSelectedIcon(icon)}
/>
```

### CategoryColorPicker

Seletor de cor para categorias.

```typescript
<CategoryColorPicker
  selectedColor="#6366F1"
  onSelect={(color) => setSelectedColor(color)}
/>
```

---

## Orçamentos

### BudgetSummary

Resumo de orçamentos com progressbar.

```typescript
<BudgetSummary
  budgets={budgets}
  transactions={transactions}
/>
```

**Props:**

| Prop         | Tipo            | Descrição               |
| ------------ | --------------- | ----------------------- |
| budgets      | `Budget[]`      | Lista de orçamentos     |
| transactions | `Transaction[]` | Transações para cálculo |

**Funcionalidades:**

- Cálculo automático de gastos vs. limite
- Alertas visuais quando接近 limite
- Percentual de utilização

---

## Metas

### FinancialInsights

Card de insights financeiros.

```typescript
<FinancialInsights
  transactions={transactions}
  goals={goals}
/>
```

**Funcionalidades:**

- Detecção de gastos incomuns
- Sugestões de economia
- Progresso em metas
- Alertas de orçamento

---

## Notificações

### ToastContainer

Container global para toasts.

```typescript
import { ToastContainer } from '@/components/notifications/ToastContainer';

<ToastContainer />
```

**Toast Types:**

```typescript
type ToastType =
  | 'success' // Verde
  | 'error' // Vermelho
  | 'warning' // Amarelo
  | 'info' // Azul
  | 'delete'; // Cinza
```

**Uso com hook:**

```typescript
import { useToast } from '@/components/notifications/ToastContainer';

function MyComponent() {
  const { showToast } = useToast();

  const handleSave = () => {
    showToast({
      title: 'Salvo!',
      message: 'Transação adicionada com sucesso',
      type: 'success',
    });
  };
}
```

### NotificationCenter

Centro de notificações completo.

```typescript
<NotificationCenter
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
/>
```

**Funcionalidades:**

- Lista de notificações
- Filtros por tipo
- Marcar como lida/todas
- Preferências de notificação

---

## UI

### Skeleton

Componente de loading esqueleto.

```typescript
<Skeleton className="h-4 w-32" />
<Skeleton className="h-20 w-full rounded-lg" />
```

### LoadingScreen

Tela de loading full-screen.

```typescript
<LoadingScreen message="Carregando dados..." />
```

### ConfirmDialog

Diálogo de confirmação.

```typescript
<ConfirmDialog
  isOpen={showDialog}
  title="Excluir Transação"
  message="Tem certeza que deseja excluir esta transação?"
  confirmText="Excluir"
  cancelText="Cancelar"
  isDestructive={true}
  onConfirm={handleDelete}
  onCancel={() => setShowDialog(false)}
/>
```

### LazyRoute

Wrapper para carregamento lazy de rotas.

```typescript
<LazyRoute
  component={() => import('./pages/Reports')}
  fallback={<Skeleton />}
/>
```

---

## Hooks Personalizados

### useExportModal

Hook para modal de exportação.

```typescript
const { isOpen, showExport, hideExport, exportData } = useExportModal();

<button onClick={showExport}>Exportar</button>
```

### usePushNotifications

Hook para notificações push.

```typescript
const { requestPermission, subscribe } = usePushNotifications();
```

---

## Ícones

O projeto utiliza ícones do [Lucide React](https://lucide.dev/):

```typescript
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
```

---

## Estilização

Todos os componentes utilizam [Tailwind CSS](https://tailwindcss.com/) com as seguintes convenções:

### Cores

```css
/* Primárias */
.bg-primary
.text-primary

/* Secundárias */
.bg-secondary
.text-secondary

/* Feedback */
.text-success    /* Verde */
.text-warning    /* Amarelo */
.text-error     /* Vermelho */
.text-info      /* Azul */
```

### Breakpoints

```typescript
// Mobile
text-xs sm:text-sm md:text-base lg:text-lg
p-2 sm:p-4 md:p-6

// Desktop
hidden md:block
```

### Dark Mode

```typescript
dark: bg - slate - 900;
dark: text - white;
dark: border - gray - 700;
```
