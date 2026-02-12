# Guia de Contribuição - Fins

## Introdução

Obrigado por querer contribuir com o projeto Fins! Este guia contém todas as informações necessárias para começar a contribuir.

## Pré-requisitos

- Node.js 18+
- npm 9+
- Git

## Configuração do Ambiente

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/Fins.git
cd Fins
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Inicie o servidor de desenvolvimento**

```bash
npm run dev
```

## Estrutura do Projeto

```
Fins/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── stores/         # Zustand stores (estado global)
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Funções utilitárias
│   ├── services/       # Serviços de negócio
│   ├── types/          # Definições de tipos TypeScript
│   ├── lib/            # Configurações de bibliotecas
│   └── config/         # Configurações da aplicação
├── docs/               # Documentação
└── plans/             # Documentos de planejamento
```

## Convenções de Código

### TypeScript

- Use Tipos explícitos em vez de `any` quando possível
- Prefira interfaces para objetos e types para unions
- Use `const` para valores que não mudam

### Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(escopo): descrição

tipos disponíveis:
- feat: nova funcionalidade
- fix: correção de bug
- docs: mudanças na documentação
- style: formatação, ponto-e-vírgula, etc
- refactor: refatoração de código
- test: adicionar testes
- chore: tarefas de manutenção
```

Exemplos:

```
feat(auth): adicionar login com Google
fix(toast): corrigir toast de dados carregados
docs(readme): atualizar instruções de instalação
```

### Branches

- `main`: branch principal de produção
- `develop`: branch `feature/*`: novas funcionalidades de desenvolvimento
-
- `fix/*`: correções de bugs
- `improvement/*`: melhorias em código existente

## Fluxo de Contribuição

1. **Crie uma branch para sua funcionalidade**

```bash
git checkout -b feature/nova-funcionalidade
```

2. **Faça suas alterações**

- Siga as convenções de código
- Adicione testes para novas funcionalidades
- Atualize a documentação se necessário

3. **Execute os testes**

```bash
npm run test
```

4. **Execute o linter**

```bash
npm run lint
```

5. **Faça commit das suas alterações**

```bash
git add .
git commit -m "feat(pages): adicionar página de relatórios"
```

6. **Push para o repositório**

```bash
git push origin feature/nova-funcionalidade
```

7. **Crie um Pull Request**

- Descreva suas alterações
- Link com issues relacionados
- Solicite review de mantenedores

## Scripts Disponíveis

| Script                  | Descrição                             |
| ----------------------- | ------------------------------------- |
| `npm run dev`           | Inicia servidor de desenvolvimento    |
| `npm run build`         | Faz build para produção               |
| `npm run lint`          | Executa ESLint                        |
| `npm run lint:fix`      | Corrige erros de lint automaticamente |
| `npm run test`          | Executa testes unitários              |
| `npm run test:coverage` | Gera relatório de cobertura           |
| `npm run preview`       | Visualiza build de produção           |

## Configuração do Editor

### VSCode (Recomendado)

Instale as extensões:

- ESLint
- Prettier
- TypeScript Vue Plugin

Crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

## Testes

### Executando Testes

```bash
# Todos os testes
npm run test

# Tests em modo watch
npm run test -- --watch

# Cobertura de testes
npm run test:coverage
```

### Escrevendo Testes

Localize os testes em `src/test/` ou junto com os componentes:

```typescript
// src/utils/minha-funcao.test.ts
import { describe, it, expect } from 'vitest';
import { minhaFuncao } from '../utils/minha-funcao';

describe('minhaFuncao', () => {
  it('deve retornar o resultado esperado', () => {
    expect(minhaFuncao('entrada')).toBe('resultado');
  });
});
```

## Recursos Adicionais

- [Documentação do React](https://react.dev/)
- [Documentação do TypeScript](https://www.typescriptlang.org/)
- [Documentação do Zustand](https://zustand-demo.pmnd.rs/)
- [Documentação do Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
