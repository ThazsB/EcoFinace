# WCAG 2.1 Checklist - Projeto Fins

## 🎯 Nível AA (Meta)

### 1. Perceptível

#### 1.1 Alternativas em Texto
- [x] Imagens têm alt text descritivo
- [x] Ícones decorativos usam `aria-hidden="true"`
- [x] Complexas informações visuais têm descrição alternativa

#### 1.2 Mídia
- [ ] Vídeos têm legendas (quando adicionados)
- [ ] Áudio tem transcrição (quando adicionados)

#### 1.3 Adaptável
- [x] Conteúdo pode ser apresentado de diferentes formas
- [x] Informação e estrutura não dependem de apresentação visual

#### 1.4 Distinguível
- [x] Contraste mínimo de 4.5:1 para texto normal
- [x] Contraste mínimo de 3:1 para texto grande
- [x] Não depende apenas de cor para transmitir informação

### 2. Operável

#### 2.1 Acessibilidade por Teclado
- [x] Toda funcionalidade é operável por teclado
- [x] Ordem de foco é lógica
- [x] Foco não fica preso
- [x] Skip links implementados

#### 2.2 Tempo Adequado
- [ ] Sessões expiram com opção de estender
- [ ] Conteúdo animado pode ser pausado
- [ ] Atualizações automáticas podem ser controladas

#### 2.3 Convulsões
- [ ] Conteúdo não pisca mais de 3 vezes por segundo
- [ ] Animações respeitam `prefers-reduced-motion`

#### 2.4 Navegação
- [x] Páginas têm títulos descritivos
- [x] Link têm propósito claro
- [x] múltiplos caminhos para encontrar páginas

#### 2.5 Modalidades de Entrada
- [ ] Suporte para diferentes dispositivos de entrada
- [ ] Não exige movimentos específicos de pointer

### 3. Compreensível

#### 3.1 Legibilidade
- [x] Idioma padrão definido
- [x] Texto em idioma estrangeiro marcado

#### 3.2 Previsível
- [x] Comportamento consistente
- [x] Navegação previsível
- [x] Identificação consistente de componentes

#### 3.3 Ajuda de Entrada
- [x] Labels claramente visíveis
- [ ] Sugestões para erros
- [ ] Prevenção de erros em ações críticas

### 4. Robusto

#### 4.1 Compatibilidade
- [x] Uso válido de HTML
- [x] Componentes customizados têm ARIA quando necessário
- [x] Status de elementos dinâmicos announced

---

## 📋 Auditoria de Componentes

### Dashboard
| Componente | Status WCAG | Observações |
|------------|-------------|-------------|
| BudgetSummary | ✅ Passa | - |
| TransactionList | ✅ Passa | Usa React.memo |
| FinancialInsights | ✅ Passa | - |
| Charts | ⚠️ Precisa | Adicionar aria-label |

### Páginas
| Página | Status WCAG | Observações |
|--------|-------------|-------------|
| Dashboard | ✅ Passa | Skip link pendente |
| Transactions | ✅ Passa | Filtros acessíveis |
| Budgets | ✅ Passa | - |
| Reports | ✅ Passa | - |
| Goals | ✅ Passa | - |
| Settings | ✅ Passa | - |

---

## 🛠️ Ferramentas de Teste

```bash
# Teste de contraste
npm run test:a11y

# Lighthouse CI
npx lighthouse-ci run

# Teste manual
- Tab navigation
- Screen reader (NVDA/VoiceOver)
- Keyboard only
```

---

## 📚 Referências

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core](https://www.deque.com/axe/)
