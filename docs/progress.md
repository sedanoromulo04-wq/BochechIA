# BochechIA — Progresso de Construção

Documento vivo do que foi construído, decisões e TODOs por etapa.

---

## Reorganização inicial — 2026-04-25

### Construído
- Squads operacionais movidos de `BochechIA/squads/` para `bochechia/squads/`:
  copy-squad, hormozi-squad, brand-squad, c-level-squad, traffic-masters, data-squad
- Criado `content-squad/` (fusão de storytelling + movement, conforme CLAUDE.md)
- Squads não-AIOS (advisory-board, claude-code-mastery, cybersecurity, _example,
  além de storytelling/ e movement/ originais) movidos para `bochechia/_archive/`

### Decisões
- Consolidar tudo dentro de `bochechia/` para que `dashboard/` consiga ler
  `../squads/*` com caminho previsível e o projeto seja autossuficiente.
- `_archive/` em vez de delete — preservar conteúdo enquanto a migração estabiliza.

### TODOs
- [ ] Atualizar `squad.yaml` de cada squad com os campos `routing:`, `mem0:`, `privacy:`
      conforme `_template/squad.yaml`
- [ ] Criar `content-squad/squad.yaml` (fusão storytelling+movement)

---

## Etapa 1 — Setup Next.js dashboard — 2026-04-25

### Construído
- `bochechia/dashboard/` scaffolded com `create-next-app@latest`
  (Next.js 16.2.4, React 19.2, TypeScript 5, Tailwind 4, App Router, src-dir, alias `@/*`)
- Dependências instaladas: `js-yaml`, `mem0ai`, `@anthropic-ai/sdk`, `openai`,
  `@types/js-yaml`
- Estrutura: `src/app/`, `src/components/`, `src/lib/`, `src/types/`, `src/config/`
- `.env.example` e `.env.local` criados (`.env.local` ignorado pelo Git)
- Removidos placeholders `AGENTS.md` e `CLAUDE.md` gerados pelo Next dentro de `dashboard/`
  (conflitam com os do projeto raiz — os do projeto vencem)
- `npm run build` passa limpo

### Decisões
- **Next.js 16** (não 14 como o SETUP.md sugere) — versão atual estável;
  isso muda algumas coisas:
  - `params` e `searchParams` são `Promise` (precisam `await`)
  - Helpers globais `PageProps<'/path'>` e `LayoutProps<'/path'>`
  - Tailwind v4 com `@import "tailwindcss"` e `@theme inline` (sem `tailwind.config.js`)
- **Turbopack** habilitado por padrão (mais rápido em dev e build).
- `mem0ai` (não `@mem0ai/mem0`) — pacote oficial atual no npm.
- Alibaba/Qwen: usar SDK `openai` apontando para `ALIBABA_BASE_URL` (compat OpenAI).
- Tier 0 (orquestração) usa `qwen3.5-flash` via lib/router. DeepSeek foi removido (2026-04-26).

### TODOs
- [x] Documentar em `docs/architecture/` que estamos em Next 16, não 14
- [ ] Atualizar `SETUP.md` para refletir Next 16 + Tailwind 4

---

## Etapa 2 — Manifests + dashboard estrutural — 2026-04-25

### Construído
- Criado `squads/content-squad/squad.yaml` consolidando storytelling + movement
- Adicionados os campos obrigatórios `routing:`, `mem0:` e `privacy:` em:
  - `copy-squad`
  - `brand-squad`
  - `data-squad`
  - `hormozi-squad`
  - `traffic-masters`
  - `c-level-squad`
  - `content-squad`
- Home `/` agora redireciona para `/dashboard`
- Implementadas as rotas do dashboard:
  - `/dashboard`
  - `/dashboard/squads`
  - `/dashboard/squads/[squad]`
  - `/dashboard/clients`
  - `/dashboard/clients/[client]`
  - `/dashboard/tasks`
- Criado `dashboard/src/lib/tasks.ts` para agregar tarefas por squad e estimar modelo via roteador
- Atualizados os docs-base para refletir Next 16 e o escopo atual do painel

### Decisões
- O painel desta fase é de **observabilidade estrutural**, não de execução real
- `squad.yaml` segue como fonte da verdade para leitura de squads, agentes, tarefas e roteamento
- A tela de tarefas mostra **catálogo de capacidades** por enquanto, não histórico de runs

### Handoff para próxima LLM
- Entrada principal do frontend: `dashboard/src/app/dashboard/`
- Componentes visuais compartilhados: `dashboard/src/components/dashboard/ui.tsx`
- Loaders de dados locais:
  - `dashboard/src/lib/squads.ts`
  - `dashboard/src/lib/clients.ts`
  - `dashboard/src/lib/tasks.ts`
  - `dashboard/src/lib/router.ts`
- Fonte dos manifests: `squads/*/squad.yaml`

### Próximos passos recomendados
- [ ] Criar armazenamento de execuções reais de tarefas (`runs`, `approvals`, `costs`)
- [x] Conectar ações do dashboard a providers reais (Anthropic, Alibaba/Qwen, Mem0) — feito na Etapa 4
- [ ] Adicionar org chart visual por squad e leitura detalhada de agentes
- [ ] Substituir `core/clients/registry.yaml` por backend persistente quando a fase 2 começar

---

## Etapa 3 — Validação formal dos agentes — 2026-04-26

### Construído
- Criado `package.json` raiz com comandos operacionais:
  - `npm run validate:aios`
  - `npm run smoke:aios`
  - `npm run check:aios`
- Criada a camada de utilitários compartilhados em `scripts/lib/aios-utils.cjs`
- Implementado validator formal em `scripts/validate-aios.cjs`
- Implementado smoke runner em `scripts/smoke-runner.cjs`
- Criado `scripts/smoke-fixtures.json` com 1 fluxo ouro por squad top-level
- Fechado o gap de roteamento de tasks top-level em `core/routing/model-routing.yaml`
- Corrigidas inconsistências estruturais encontradas pelo validator em tasks/workflows

### Resultados
- `validate:aios` → **0 errors / 0 warnings**
- `smoke:aios` → **7/7 squads aprovados**

### Decisões
- A primeira camada de confiabilidade será **estrutural e determinística**
- O smoke runner não chama providers externos; ele prova a coerência dos fluxos
- O dashboard permanece desacoplado da operação real até existir runtime de execução

### Handoff para próxima LLM
- Scripts principais:
  - `scripts/validate-aios.cjs`
  - `scripts/smoke-runner.cjs`
  - `scripts/smoke-fixtures.json`
- Documentação operacional:
  - `docs/operations/agent-validation.md`
  - `docs/operations/dashboard-gating.md`

### Próximos passos recomendados
- [x] Criar executor real de tasks com persistência de runs → Etapa 4
- [x] Integrar Mem0 de forma operacional no ciclo load/save → Etapa 4
- [x] Implementar chamadas reais para Anthropic/Alibaba com enforcement de privacidade → Etapa 4
- [x] Conectar o dashboard à camada de operação → Etapa 4

---

## Etapa 4 — Run engine real + human-in-the-loop — 2026-04-26

### Construído
- `dashboard/src/types/run.ts` — tipos Run, RunStep, CreateRunInput, ReviewRunInput
- `core/runs/runs.json` — store JSON persistente de runs
- `dashboard/src/lib/runs-store.ts` — leitura/escrita do store (getAllRuns, saveRun, updateRun)
- `dashboard/src/lib/providers.ts` — clientes Anthropic SDK + Alibaba/Qwen via OpenAI compat
- `dashboard/src/lib/mem0.ts` — Mem0 client com stub mode (opera sem MEM0_API_KEY em dev)
- `dashboard/src/lib/engine.ts` — run engine completo:
  - `createRun()` — cria run com roteamento automático via router.ts
  - `executeRun()` — enforcement de privacidade + load Mem0 + call provider + persist custo
  - `approveRun()` — salva no Mem0 + marca approved
  - `rejectRun()` — registra motivo
- `dashboard/src/app/api/runs/route.ts` — GET (lista) + POST (cria e dispara execução async)
- `dashboard/src/app/api/runs/[id]/route.ts` — GET (detalhe) + PATCH (approve/reject)
- `dashboard/src/app/dashboard/runs/page.tsx` — página com formulário de nova tarefa + lista de runs + aprovação humana
- `dashboard/src/components/dashboard/run-actions.tsx` — componentes client-side (ReviewActions, NewRunForm)
- Overview atualizado com stats de runs e aprovações pendentes
- Nav atualizado com link "Runs"

### Enforcement de privacidade
Se `hasClientData=true` e o roteador seleciona Alibaba/Qwen, o engine intercepta e
força roteamento para `claude-sonnet-4-6` (ou `claude-opus-4-6` se `critical=true`).
Nunca há chamada ao Alibaba/Qwen com dados de cliente.

### Mem0 — modo stub
Quando `MEM0_API_KEY` não está configurada, o client opera em modo stub:
sem erros, sem persistência real. Permite desenvolvimento local sem conta Mem0.
O run registra `mem0Loaded: false` para rastreabilidade.

### Decisões
- Store JSON local (`core/runs/runs.json`) para MVP — mesma abordagem do registry de clientes
- execução async no POST: retorna 202 imediatamente, cliente faz polling no GET /api/runs/:id
- Human-in-the-loop obrigatório: output fica em `awaiting_approval` até PATCH explícito
- Mem0 save só ocorre após aprovação humana — nunca salva output não aprovado

### Resultados
- `npm run build` → **✓ 0 errors / 10 rotas**

### Próximos passos recomendados
- [x] Configurar `ANTHROPIC_API_KEY`, `ALIBABA_API_KEY`, `MEM0_API_KEY` em `.env.local` — todas configuradas
- [ ] Migrar store de runs para Supabase (fase 2)
- [ ] Adicionar polling automático no frontend (SSE ou React Query)
- [ ] Adicionar paginação na página de runs quando o volume crescer
