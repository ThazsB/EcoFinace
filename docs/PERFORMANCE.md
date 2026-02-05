# Performance Guidelines - Projeto Fins

## 🎯 Objetivos

- First Contentful Paint (FCP): < 1s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- Bundle Size: < 150KB (gzipped)

---

## 📦 Code Splitting

### Lazy Loading de Rotas

```tsx
// App.tsx
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Transactions = lazy(() => import('@/pages/Transactions'));
const Budgets = lazy(() => import('@/pages/Budgets'));
const Reports = lazy(() => import('@/pages/Reports'));
const Goals = lazy(() => import('@/pages/Goals'));
const Settings = lazy(() => import('@/pages/Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### Componentes Lazy

```tsx
import { useLazyComponent } from '@/components/ui/LazyRoute';

// Uso
const HeavyChart = useLazyComponent(() => import('@/components/charts/HeavyChart'));
```

---

## ⚡ Otimizações React

### useMemo para Cálculos Caros

```tsx
// ✅ Bom
const expensiveValue = useMemo(() => {
  return data.items.reduce((sum, item) => sum + item.price, 0);
}, [data.items]);

// ❌ Evitar
const value = data.items.reduce((sum, item) => sum + item.price, 0);
```

### useCallback para Props de Componentes Memoizados

```tsx
// ✅ Bom
const handleDelete = useCallback((id: number) => {
  setItems(prev => prev.filter(item => item.id !== id));
}, []);

<ItemList items={items} onDelete={handleDelete} />
```

### React.memo para Componentes Puros

```tsx
const TransactionItem = memo(function TransactionItem({ 
  transaction, 
  onDelete 
}: TransactionItemProps) {
  // Componente só re-renderiza se props mudarem
});
```

---

## 🗜️ Otimizações de Bundle

### Tree Shaking

```json// package.json
{
  "sideEffects": [
    "**/*.css",
    "./src/index.tsx"
  ]
}
```

### Importações Tree-shake friendly

```tsx
// ✅ Bom - import named
import { Trash2, Edit2 } from 'lucide-react';

// ❌ Evitar - import default
import Icon from 'lucide-react';
```

### Dynamic Imports para Funcionalidades Grandes

```tsx
import { defineAsyncComponent } from 'react';

// Charts grandes
const HeavyChart = defineAsyncComponent(() => 
  import('@/components/charts/HeavyChart')
);
```

---

## 🧠 Memória

### Cleanup de Subscriptions

```tsx
useEffect(() => {
  const subscription = dataSource.subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, [dataSource]);
```

### Evitar Memory Leaks em Listeners

```tsx
useEffect(() => {
  const handleResize = () => { /* ... */ };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

---

## 📊 Monitoramento

### Web Vitals

```tsx
// analytics.ts
import { getCLS, getFID, getLCP, getFCP } from 'web-vitals';

function reportWebVitals(metric: Metric) {
  // Enviar para analytics
  console.log(metric);
}

getCLS(reportWebVitals);
getFID(reportWebVitals);
getLCP(reportWebVitals);
getFCP(reportWebVitals);
```

### Performance Budget

```json
// .size-limit.json
{
  "limits": {
    "js": 150,
    "css": 20,
    "fonts": 50
  }
}
```

---

## 🔧 Ferramentas

```bash
# Analisar bundle
npm run build
npx vite-bundle-visualizer

# Lighthouse
npx lighthouse-ci run

# Performance profiling
npm run dev -- --profile
```

---

## 📋 Checklist de Performance

- [ ] Code splitting implementado
- [ ] Lazy loading de rotas
- [ ] useMemo/useCallback aplicados corretamente
- [ ] React.memo em componentes pesados
- [ ] Dynamic imports para bibliotecas grandes
- [ ] Tree shaking habilitado
- [ ] Icons tree-shake friendly
- [ ] Web Vitals monitorados
- [ ] Bundle size dentro do budget
- [ ] Memory leaks resolvidos
