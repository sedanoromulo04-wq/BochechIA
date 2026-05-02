# BochechIA

**AI Operating System orientado a conhecimento, decisão e execução supervisionada**

O BochechIA agora está estruturado como um **knowledge-first brain**:

1. **Knowledge Base própria** como fonte da verdade
2. **Pipeline de ingestão** para transformar conteúdo bruto em chunks, fatos e proveniência
3. **Policy / Orchestration Engine** para decidir modelo, approvals e ação
4. **Workers especializados** (`squads/*`) executando planos do cérebro central
5. **Control Plane** no dashboard para governança, approvals, decisions e evals

## Estado atual

- Dashboard em `dashboard/` compilando com Next.js 16.2.4
- Knowledge store local em `core/knowledge/brain-store.json`
- Seed operacional automática a partir de docs e policies do repositório
- Retrieval híbrido com:
  - lexical + metadata
  - embedding local por hash vetorial
  - fatos estruturados e políticas
- Policy engine com:
  - enforcement de privacidade
  - confidence gating
  - human-in-the-loop
- APIs novas:
  - `POST /api/knowledge/sources`
  - `POST /api/knowledge/ingest`
  - `GET /api/knowledge/search`
  - `GET /api/knowledge/facts`
  - `POST /api/decisions/plan`
  - `POST /api/approvals/:id/respond`
  - `GET /api/evals/summary`

## Cockpit

O dashboard agora está organizado em torno do cérebro:

- `/dashboard`
- `/dashboard/knowledge`
- `/dashboard/processes`
- `/dashboard/decisions`
- `/dashboard/approvals`
- `/dashboard/runs`
- `/dashboard/connectors`
- `/dashboard/evals`

## Stack

- **Frontend / Control Plane:** Next.js 16 + TypeScript + Tailwind 4
- **Modelos:** Anthropic + Alibaba/Qwen
- **Memória curta auxiliar:** Mem0
- **Base canônica planejada para produção:** Supabase Postgres + pgvector + Storage
- **Modo atual de desenvolvimento:** file-backed local brain store

## Produção vs desenvolvimento

No desenvolvimento, a base do cérebro roda localmente em arquivo para permitir evolução rápida sem depender de infra externa.

Para produção, o schema canônico já foi definido em:

- `supabase/migrations/20260428_knowledge_first_brain.sql`

## Início rápido

```bash
cd bochechia/dashboard
npm install
npm run dev
```

## Documentação

- [Arquitetura do cérebro](docs/architecture/overview.md)
- [Knowledge-first brain ADR](docs/architecture/knowledge-first-brain.md)
- [Memória e conhecimento](docs/architecture/memory-schema.md)
- [Handoff atual](docs/handoff-next-llm.md)

## Licença

MIT © 2026 Synkra / BochechIA
