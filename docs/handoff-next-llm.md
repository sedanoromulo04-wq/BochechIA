# Handoff para Próxima LLM

Documento curto para permitir continuação rápida sem re-auditoria completa.

## Estado atual

- Data: `2026-04-26`
- Estrutura canônica do projeto: `bochechia/`
- Next.js 16.2.4 — `npm run build` passa limpo com 10 rotas

## O que já foi entregue

### Etapas 1–3 (concluídas anteriormente)
- Dashboard estrutural com todas as rotas de observabilidade
- Todos os `squad.yaml` com `routing`, `mem0`, `privacy`
- `validate:aios` → 0 errors / `smoke:aios` → 7/7 squads

### Etapa 4 — Run engine real (concluída 2026-04-26)
- **Run engine** (`lib/engine.ts`) — cria, executa, aprova e rejeita runs
- **Enforcement de privacidade** — se `hasClientData=true` e modelo seria DeepSeek, força Claude automaticamente
- **Providers** (`lib/providers.ts`) — Anthropic SDK + DeepSeek via OpenAI compat
- **Mem0 operacional** (`lib/mem0.ts`) — load antes da tarefa, save após aprovação, stub mode sem API key
- **Store JSON** (`core/runs/runs.json`) — persiste runs localmente (MVP)
- **API routes** — `GET/POST /api/runs`, `GET/PATCH /api/runs/[id]`
- **Página `/dashboard/runs`** — formulário de nova tarefa + lista de runs + aprovação humana inline

## Arquivos principais

### Runtime
- `dashboard/src/lib/engine.ts` — run engine central
- `dashboard/src/lib/providers.ts` — clientes Anthropic + DeepSeek
- `dashboard/src/lib/mem0.ts` — Mem0 client com stub mode
- `dashboard/src/lib/runs-store.ts` — CRUD do store JSON
- `core/runs/runs.json` — store de runs

### API
- `dashboard/src/app/api/runs/route.ts` — lista + criação
- `dashboard/src/app/api/runs/[id]/route.ts` — detalhe + aprovação/rejeição

### Frontend
- `dashboard/src/app/dashboard/runs/page.tsx` — página de runs
- `dashboard/src/components/dashboard/run-actions.tsx` — componentes client-side

### Tipos
- `dashboard/src/types/run.ts` — Run, RunStep, CreateRunInput, ReviewRunInput

### Config
- `dashboard/src/config/paths.ts` — inclui `runsStore`

## Fluxo de um run

```
POST /api/runs { clientId, squadId, taskName, prompt, hasClientData }
  → createRun() — roteamento via router.ts, status: "pending"
  → executeRun() async:
      1. Enforcement: hasClientData + provider=deepseek → força claude-sonnet
      2. loadContext() via Mem0 (stub se sem API key)
      3. callModel() → Anthropic ou DeepSeek
      4. Calcula custo, persiste output, status: "awaiting_approval"
PATCH /api/runs/:id { action: "approve" }
  → approveRun() → saveContext() no Mem0 → status: "approved"
PATCH /api/runs/:id { action: "reject", rejectionReason }
  → rejectRun() → status: "rejected"
```

## Para fazer o primeiro run real

Adicione em `dashboard/.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
MEM0_API_KEY=...   # opcional — sem ela opera em stub mode
```

## Próximos passos naturais

- [ ] Migrar store de runs para Supabase (fase 2 do CLAUDE.md)
- [ ] Polling automático no frontend (SSE ou React Query)
- [ ] Paginação na página de runs

## Comandos úteis

```bash
cd bochechia/dashboard
npm run build
npm run dev
```
