# BochechIA Dashboard

Painel de controle do BochechIA — visualiza squads, clientes, tarefas e custos.

## Stack

- **Next.js 16.2.4** com App Router
- **TypeScript** estrito
- **Tailwind CSS 4**
- **Dados MVP:** YAML local (`core/`)
- **Dados produção:** Supabase (Fase 2)

## Setup

```bash
# Na pasta dashboard/
npm install
npm run dev
```

## Estado atual

As rotas abaixo ja existem e leem dados locais:

| Rota | Status | Descrição |
|------|--------|-----------|
| `/dashboard` | pronto | visão geral de squads, clientes e catálogo de tarefas |
| `/dashboard/squads` | pronto | lista de squads top-level |
| `/dashboard/squads/[squad]` | pronto | detalhe estrutural do manifest do squad |
| `/dashboard/clients` | pronto | leitura do registry local de clientes |
| `/dashboard/clients/[client]` | pronto | detalhe do cliente e projetos |
| `/dashboard/tasks` | pronto | catálogo de tarefas derivado dos squads |

## Próxima camada

- persistência real de execuções
- fluxo de aprovação humana
- custos por run
- integração com Mem0 e providers

## Componentes prioritários

```
components/
├── SquadCard.tsx        # card com nome, tier, modelo, status
├── AgentAvatar.tsx      # avatar do sub-agente com tier badge
├── TaskItem.tsx         # tarefa com status, squad, cliente
├── ClientBadge.tsx      # badge colorido do cliente
├── ApprovalButton.tsx   # aprovar/rejeitar com confirmação
├── ModelBadge.tsx       # qual modelo foi/será usado
├── MemoryIndicator.tsx  # contexto Mem0 carregado ou não
└── CostTracker.tsx      # estimativa de custo da sessão
```

## Lendo dados dos squad.yaml

```typescript
// lib/squads.ts
import fs from "node:fs/promises";
import path from "node:path";

export function getAllSquads() {
  const squadsDir = path.join(process.cwd(), "../squads");
  // lê todos os squad.yaml e retorna array
}
```

## Variáveis de ambiente

```bash
# .env.local
MEM0_API_KEY=
ANTHROPIC_API_KEY=
ALIBABA_API_KEY=
ALIBABA_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
NEXT_PUBLIC_APP_NAME=BochechIA
```
