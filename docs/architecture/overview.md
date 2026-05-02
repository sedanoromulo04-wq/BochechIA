# Arquitetura do BochechIA

## Visão geral

O BochechIA deixou de ser centrado em `runs + squads + memória auxiliar` e passou a ser centrado em um **cérebro estruturado**:

```
┌──────────────────────────────────────────────┐
│  1. CONTROL PLANE                           │
│     Dashboard: knowledge, decisions, evals  │
├──────────────────────────────────────────────┤
│  2. POLICY / ORCHESTRATION ENGINE           │
│     Planeja ação, risco, modelo e approvals │
├──────────────────────────────────────────────┤
│  3. KNOWLEDGE LAYER                         │
│     fontes, versões, chunks, facts, policy  │
├──────────────────────────────────────────────┤
│  4. WORKERS                                 │
│     squads especializados executam planos   │
├──────────────────────────────────────────────┤
│  5. AUXILIARY MEMORY                        │
│     Mem0 subordinado ao knowledge layer     │
└──────────────────────────────────────────────┘
```

## Implementação atual

### Fonte da verdade em desenvolvimento

- `core/knowledge/brain-store.json`
- `core/knowledge/runs.json`

### Fonte canônica planejada para produção

- Supabase Postgres
- `pgvector`
- Supabase Storage
- migration em `supabase/migrations/20260428_knowledge_first_brain.sql`

## Componentes principais

### Knowledge foundation

- `dashboard/src/lib/knowledge-store.ts`
- `dashboard/src/lib/knowledge-text.ts`
- `dashboard/src/lib/knowledge-retrieval.ts`

Responsabilidades:

- seed inicial da base
- ingestão de fontes
- versionamento de documentos
- chunking
- extração de fatos
- retrieval com citações

### Policy engine

- `dashboard/src/lib/policy-engine.ts`
- `dashboard/src/lib/router.ts`

Responsabilidades:

- decidir modelo
- decidir approval
- decidir ação (`clarify`, `execute`, `answer`, `escalate`)
- impor privacidade e confidence gating

### Orchestration runtime

- `dashboard/src/lib/engine.ts`
- `dashboard/src/lib/runs-store.ts`
- `dashboard/src/lib/providers.ts`
- `dashboard/src/lib/mem0.ts`

Responsabilidades:

- criar run
- consultar knowledge + policy
- executar worker
- registrar decision record
- abrir approval request
- salvar output aprovado como nova fonte de conhecimento

## Retrieval híbrido v1

1. lexical + metadata filtering
2. embedding local por hash vetorial
3. fatos estruturados e policies aprovadas

Toda execução relevante deve carregar:

- confiança de conhecimento
- citações
- rationale
- policies aplicadas

## Dashboard

O cockpit agora reflete o cérebro:

- `/dashboard`
- `/dashboard/knowledge`
- `/dashboard/processes`
- `/dashboard/decisions`
- `/dashboard/approvals`
- `/dashboard/runs`
- `/dashboard/connectors`
- `/dashboard/evals`

## Próxima fase natural

1. trocar store local por adapter Supabase
2. adicionar embeddings reais
3. incluir conectores externos
4. subir evals operacionais
5. preparar relações/GraphRAG para fase 2
