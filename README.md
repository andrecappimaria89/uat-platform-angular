# UATPlataform — Angular 17

Stack de frontend igual às imagens da empresa:
**Angular 17 + TypeScript + NgRx + Angular Material + Cypress**

Supabase e Netlify mantidos — zero alteração no banco de dados.

---

## Stack Frontend (igual à imagem da empresa)

| Camada         | Tecnologia                        |
|----------------|-----------------------------------|
| Framework      | Angular 17 (Standalone Components)|
| Linguagem      | TypeScript 5.4                    |
| Estado global  | NgRx (Store + Effects + Selectors)|
| UI Components  | Angular Material 17                |
| Gráficos       | ng2-charts (Chart.js)             |
| Testes E2E     | Cypress 13                        |
| Testes unit.   | Jasmine + Karma                   |
| Build          | Angular CLI / Webpack              |
| Planilhas      | SheetJS (xlsx)                    |

## Stack Mantida (sem alteração)

| Camada    | Tecnologia                    |
|-----------|-------------------------------|
| Banco     | Supabase (PostgreSQL)         |
| Auth      | Supabase Auth                 |
| RLS       | Row Level Security (igual)    |
| Deploy    | Netlify                       |
| Schema    | Idêntico ao projeto React     |

---

## Instalação

```bash
npm install --legacy-peer-deps
```

## Desenvolvimento local

```bash
ng serve
# Acesse: http://localhost:4200
```

## Build para produção (Netlify)

```bash
ng build --configuration production
# Pasta gerada: dist/uat-platform/browser/
```

---

## Arquitetura

```
src/app/
├── core/
│   ├── models/
│   │   ├── index.ts          # Interfaces TypeScript (idênticas ao React)
│   │   └── constants.ts      # Labels e opções (idênticas ao React)
│   └── services/
│       ├── supabase.service.ts   # Client Supabase
│       ├── data.service.ts       # CRUD Observables (mesmo do dataService.ts React)
│       ├── store.actions.ts      # NgRx Actions
│       ├── store.reducer.ts      # NgRx Reducer (estado global)
│       ├── store.selectors.ts    # NgRx Selectors (métricas dinâmicas)
│       └── store.effects.ts      # NgRx Effects (chama DataService → Supabase)
│
├── shared/components/
│   ├── sidebar/          # Menu lateral
│   └── topbar/           # Barra superior com busca e seletor de projeto
│
├── features/
│   ├── dashboard/        # Dashboard Executivo com Chart.js
│   ├── scenarios/        # Cenários e Evidências (tabela + filtros)
│   ├── issues/           # Controle de Issues
│   ├── plan/             # Plano de Testes (com Concluir + bloqueio)
│   ├── sumario/          # Sumário de Issues
│   ├── historico/        # Histórico de Versões
│   ├── areas/            # Gestão de Áreas
│   ├── users/            # Gestão de Usuários
│   ├── importar/         # Importar Planilha XLSX/CSV
│   └── config/           # Configurações
│
├── app.routes.ts         # Roteamento lazy-load
├── app.config.ts         # Providers (NgRx, Router, Animations)
└── app.component.ts      # Root component + bootstrap

cypress/e2e/
└── uat-platform.cy.ts    # Testes E2E de regras de negócio e usabilidade
```

---

## Diferenças React → Angular

| React                  | Angular                          |
|------------------------|----------------------------------|
| `useState` / `useEffect` | `ngOnInit` + `Observable`      |
| `Zustand store`        | `NgRx Store + Reducer`           |
| `useMemo`              | `createSelector` (NgRx)          |
| `dataService.ts`       | `DataService` (Injectable)       |
| `async/await` funções  | `Observable` + `pipe(map, catchError)` |
| `React Router`         | `Angular Router` (lazy-load)     |
| `react-hot-toast`      | `MatSnackBar`                    |
| `Modal` component      | `MatDialog`                      |
| `Tailwind CSS`         | `Angular Material + SCSS`        |
| `Chart.js` direto      | `ng2-charts` (wrapper Angular)   |

---

## Variáveis de Ambiente — Netlify

Adicionar em **Site settings → Environment variables**:

```
VITE_SUPABASE_URL      = https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY = SUA-CHAVE-ANON
```

---

## Testes E2E com Cypress

```bash
# Com o app rodando em localhost:4200
npx cypress open

# Ou headless (CI)
npx cypress run
```

Os testes cobrem:
- Dashboard — métricas dinâmicas e filtro por projeto
- Cenários — tabela, filtros, formato CT ID, exportação
- Issues — badges de severidade S1-S5, filtros
- Plano — edição, cancelamento, bloqueio ao concluir
- Usuários — perfil executor padrão
- Áreas — responsável automático ao editar
- Todas as 10 rotas sem erro
- Responsividade tablet e mobile

---

## Banco de Dados

**Zero alteração necessária no Supabase.**
O schema SQL, as políticas RLS, os triggers e as migrations são 100% compatíveis.
O `DataService` Angular faz exatamente as mesmas queries do `dataService.ts` React.
