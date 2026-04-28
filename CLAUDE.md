# BochechIA — AI Operating System

Este repositório é a base operacional do **BochechIA**, um AI Operating System (AIOS)
construído sobre Claude Code para orquestrar múltiplos squads de agentes especializados.
Serve como infraestrutura para a Synkra (empresa de serviços de IA) e para os clientes
do Grupo Torq.

---

## O que é o BochechIA

BochechIA é um AIOS multi-cliente com squads de agentes especializados para:

- Estratégia de marca e posicionamento (brand-squad, c-level-squad)
- Copywriting e direct response (copy-squad — 23 personas)
- Frameworks de crescimento Hormozi (hormozi-squad — 16 agentes)
- Conteúdo, storytelling e movimento de marca (content-squad)
- Tráfego pago e distribuição (traffic-masters)
- Análise de dados e relatórios (data-squad)

O dashboard vive em `dashboard/` (Next.js) e permite delegar tarefas, visualizar o
org chart de squads e acompanhar projetos por cliente.

---

## Fontes de verdade

Leia nesta ordem antes de propor qualquer mudança estrutural:

1. Este arquivo (`CLAUDE.md`)
2. `docs/architecture/overview.md`
3. `docs/architecture/model-routing.md`
4. `core/routing/model-routing.yaml`
5. `squads/_template/squad.yaml`

---

## Regras operacionais

### Hierarquia de prioridade
- Memória antes de volume
- Pesquisa antes de opinião
- Estratégia antes de design
- Conversão antes de conteúdo
- Aprovação humana antes de automação e distribuição

### Privacidade de dados — CRÍTICO
- Dados de clientes NUNCA enviados para a API do Alibaba/Qwen
- Tarefas com dados de clientes reais → use Claude Sonnet ou Opus obrigatoriamente
- Qwen (flash/pro) é permitido apenas para tarefas internas sem dados sensíveis de cliente
- Qualquer dado que inclua nome de cliente, estratégia de marca, copy aprovado ou
  persona = Claude sempre
- DeepSeek foi removido completamente em 2026-04-26 — não existe mais no sistema

---

## Roteamento de modelos

Aplique esta lógica antes de iniciar qualquer tarefa. A decisão de modelo é
responsabilidade do agente orquestrador (tier 0 de cada squad).

| Nível | Modelo | Casos de uso |
|-------|--------|-------------|
| Simples | `qwen3.5-flash` (Alibaba) | Headlines, bullets, formatação, revisão, orquestração |
| Médio | `qwen3.5-plus` (Alibaba) | Copy estruturado, análise, frameworks, email sequences |
| Alto | `claude-sonnet-4-6` | Estratégia de marca, brand foundation, copy de alto valor |
| Crítico | `claude-opus-4-6` | Decisões C-level, posicionamento, tese de categoria |

**Regra de escalada:** se uma tarefa começar simples e revelar complexidade estratégica,
escale para o modelo superior imediatamente. Nunca force um modelo barato em raciocínio profundo.

**Regra de tarefa:** veja `core/routing/model-routing.yaml` para o mapeamento completo
de tarefa → modelo.

---

## Memória — Mem0

Este sistema usa Mem0 como camada de memória universal entre sessões e entre squads.

### Escopos obrigatórios por operação
```
user_id  → ID do cliente  (ex: cliente-torq, cliente-abc)
agent_id → Nome do squad  (ex: copy-squad, brand-squad)
run_id   → ID da sessão atual
app_id   → bochechia
```

### O que salvar no Mem0
- Tom de voz aprovado pelo cliente
- Personas e público-alvo definidos
- Ofertas testadas e seus resultados (aprovadas e reprovadas)
- Headlines e copy aprovados
- O que foi reprovado e por quê
- Concorrentes mapeados
- Tese de categoria aprovada
- Regras editoriais do cliente

### O que NÃO salvar
- Conteúdo bruto não aprovado
- Dados pessoais identificáveis
- Informações financeiras ou contratuais

### Antes de iniciar qualquer tarefa para um cliente
1. Chamar Mem0 com `user_id=<cliente>` e `agent_id=<squad>` para carregar contexto
2. Só então iniciar a tarefa com o contexto já carregado
3. Ao finalizar, salvar os fatos relevantes de volta no Mem0

---

## Estrutura de squads

```
squads/<nome-do-squad>/
├── squad.yaml          # Config, tiers, routing, mem0 scope — OBRIGATÓRIO
├── agents/             # Sub-agentes especializados (.md)
├── workflows/          # Processos passo a passo (.yaml)
├── checklists/         # Governança e aprovação (.md)
├── tasks/              # Tarefas disponíveis (.md)
└── data/               # Base de conhecimento do squad
```

Todo `squad.yaml` deve incluir os campos `routing:` e `mem0:`.
Use `squads/_template/squad.yaml` como base para novos squads.

### Squads ativos (migrados do skill-creator)
- `copy-squad` — 23 personas de copywriters lendários
- `hormozi-squad` — 16 agentes com frameworks Hormozi
- `brand-squad` — posicionamento e brand foundation
- `c-level-squad` — estratégia C-level + advisory board
- `content-squad` — storytelling + movement (fusão)
- `traffic-masters` — tráfego pago e distribuição
- `data-squad` — análise e relatórios

---

## Dashboard — Next.js

O dashboard vive em `dashboard/` — aplicação Next.js com App Router.

- Framework: Next.js 16.2.4 com App Router
- Linguagem: TypeScript estrito
- Estilo: Tailwind CSS
- Dados MVP: JSON local em `core/clients/`
- Dados produção: Supabase (fase 2)
- Deploy: Vercel

### Estrutura do dashboard
```
dashboard/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Redireciona para /dashboard
│   ├── api/
│   │   ├── runs/route.ts     # GET (lista) + POST (cria e dispara async)
│   │   └── runs/[id]/route.ts # GET (detalhe) + PATCH (approve/reject)
│   └── dashboard/
│       ├── page.tsx          # Visão geral — squads + clientes + aprovações
│       ├── squads/
│       │   ├── page.tsx      # Lista todos os squads
│       │   └── [squad]/
│       │       └── page.tsx  # Detalhe + sub-agentes + tarefas
│       ├── clients/
│       │   ├── page.tsx      # Lista de clientes
│       │   └── [client]/
│       │       └── page.tsx  # Projetos do cliente
│       ├── tasks/
│       │   └── page.tsx      # Catálogo de capacidades por squad
│       └── runs/
│           └── page.tsx      # Central de demandas — nova tarefa + lista + aprovação
├── components/dashboard/
├── lib/                      # clients, squads, tasks, router, engine, mem0, providers
└── types/
```

### Regras do dashboard
- Não usar CSS puro — apenas Tailwind
- Componentes em `dashboard/components/`
- Tipos TypeScript em `dashboard/types/`
- Integrações em `dashboard/lib/`
- Todo componente com responsividade para mobile desde o início
- Estados: loading, empty, error, blocked, approval — todos obrigatórios

---

## Convenções do repositório

- Novos squads nascem em `squads/<nome>/` usando o template
- Novas skills nascem em `skills/<nome>/`
- Documentação transversal em `docs/`
- Dados de cliente NUNCA versionados no Git
- Arquivos temporários em `tmp/` dentro de cada squad (ignorado pelo Git)
- Commits semânticos: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

---

## Como trabalhar neste repositório

1. Leia este arquivo completamente antes de qualquer ação
2. Para trabalhar num squad: leia o `squad.yaml` dele primeiro
3. Para criar algo novo: use os templates em `squads/_template/`
4. Para tarefa de cliente: carregue contexto do Mem0 antes de começar
5. Nunca distribua ou publique conteúdo sem aprovação humana explícita
6. Ao finalizar sessão: documente o que foi feito se houver impacto estrutural

---

## Integração com Claude Code

- O launcher padrão deste repo é Claude Code com este arquivo como raiz
- Não use `--bare` — este arquivo precisa ser carregado automaticamente
- MCP servers disponíveis: Mem0, Canva, Google Drive, Gmail, Google Calendar, Miro
