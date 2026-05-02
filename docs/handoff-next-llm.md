# Handoff para Próxima LLM

## Estado atual

- Data: `2026-04-28`
- `npm run build` passa em `dashboard/`
- O projeto foi reestruturado para um **knowledge-first brain**

## O que mudou

### Núcleo novo

- `dashboard/src/lib/knowledge-store.ts`
- `dashboard/src/lib/knowledge-retrieval.ts`
- `dashboard/src/lib/policy-engine.ts`

### Runtime refatorado

- `dashboard/src/lib/engine.ts` agora consulta conhecimento e policy antes de executar
- `dashboard/src/lib/runs-store.ts` migra legacy para `core/knowledge/runs.json`

### APIs novas

- `GET/POST /api/knowledge/sources`
- `POST /api/knowledge/ingest`
- `GET /api/knowledge/search`
- `GET /api/knowledge/facts`
- `POST /api/decisions/plan`
- `POST /api/approvals/[id]/respond`
- `GET /api/evals/summary`

### Cockpit novo

- `/dashboard`
- `/dashboard/knowledge`
- `/dashboard/processes`
- `/dashboard/decisions`
- `/dashboard/approvals`
- `/dashboard/runs`
- `/dashboard/connectors`
- `/dashboard/evals`

## Fonte de dados

### Desenvolvimento

- `core/knowledge/brain-store.json`
- `core/knowledge/runs.json`

### Produção planejada

- `supabase/migrations/20260428_knowledge_first_brain.sql`

## Seed atual

Na primeira carga, o knowledge store indexa automaticamente:

- `docs/architecture/overview.md`
- `docs/progress.md`
- `docs/operations/agent-validation.md`
- `docs/operations/dashboard-gating.md`
- `core/routing/model-routing.yaml`
- `core/mem0/schema.yaml`

## Próximos passos recomendados

1. criar adapter real de Supabase para substituir o file-backed store
2. adicionar embeddings externos reais
3. criar conectores operacionais reais
4. expandir evals
5. preparar GraphRAG fase 2
