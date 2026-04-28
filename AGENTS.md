# BochechIA — Regras de Agentes e Frontend

Este arquivo define como agentes devem se comportar, como o dashboard deve ser
construído, e como squads interagem entre si.

---

## Contexto do sistema

- Projeto: BochechIA AIOS
- Dashboard: `dashboard/` — Next.js 16.2.4 + TypeScript + Tailwind 4
- Squads: `squads/` — Claude Code skills com squad.yaml
- Memória: Mem0 via MCP
- Roteamento: `core/routing/model-routing.yaml`

---

## Fluxo obrigatório antes de qualquer tarefa de cliente

```
1. Identificar client_id  →  ex: "cliente-torq"
2. Carregar Mem0          →  user_id=<client_id>, agent_id=<squad>
3. Executar a tarefa      →  com contexto já carregado
4. Salvar no Mem0         →  fatos relevantes gerados na sessão
5. Aprovação humana       →  antes de qualquer publicação ou distribuição
```

Nunca pule o passo 2. Um agente sem contexto do cliente é um agente sem memória.

---

## Fluxo de delegação entre squads

Quando um squad precisar do output de outro:

```
squad-origem → descreve o output necessário em linguagem clara
squad-destino → executa com contexto do Mem0 já carregado
squad-origem → recebe o output e continua o workflow
```

Não há chamada direta de API entre squads. A delegação é por tarefa documentada.

---

## Regras do orquestrador (Tier 0 de cada squad)

O agente `*-chief` de cada squad é o orquestrador. Suas responsabilidades:

1. Receber a tarefa do usuário
2. Consultar o Mem0 para contexto do cliente
3. Decidir qual sub-agente é o mais adequado
4. Delegar com o contexto completo
5. Revisar o output antes de entregar
6. Nunca escrever o output final diretamente — delegar sempre

O orquestrador usa `qwen3.5-flash` (Alibaba) para roteamento interno.
Só escala para modelo superior se a própria análise de delegação for complexa.

---

## Regras de governança e aprovação

Todo output que sair do sistema para o mundo real passa por:

1. **Checklist do squad** (`checklists/output-quality.md` de cada squad)
2. **Aprovação humana** — o usuário precisa confirmar antes de publicar
3. **Log no Mem0** — o que foi aprovado é salvo como memória do cliente

Nunca automatize distribuição sem aprovação humana explícita no fluxo.

---

## Dashboard — Regras de implementação (Next.js)

### Estrutura de arquivos
- Páginas em `dashboard/app/`
- Componentes reutilizáveis em `dashboard/components/`
- Tipos TypeScript em `dashboard/types/`
- Chamadas a API e integrações em `dashboard/lib/`
- Constantes e configurações em `dashboard/config/`

### Estilo
- Usar exclusivamente Tailwind CSS
- Não instalar styled-components, emotion ou outra camada CSS
- Não hardcodar cores — usar o sistema de design tokens do Tailwind
- Paleta principal: tons de azul/slate para neutros, verde para sucesso,
  âmbar para pendente, vermelho para bloqueado

### Componentes obrigatórios em cada página
Toda página nova deve ter todos estes estados implementados:
- `loading` — skeleton ou spinner
- `empty` — estado vazio com CTA
- `error` — mensagem de erro com retry
- `blocked` — tarefa bloqueada aguardando aprovação
- `success` — feedback de ação concluída

### Responsividade
- Mobile-first obrigatório
- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px)
- Sidebar colapsa em mobile
- Grid de squads: 1 coluna (mobile) → 2 (tablet) → 3 (desktop)

### Componentes prioritários para o MVP
```
1. SquadCard         — card de squad com status e sub-agentes
2. TaskItem          — item de tarefa com status e responsável
3. ClientBadge       — identificador de cliente com cor
4. ApprovalButton    — botão de aprovar/rejeitar com confirmação
5. AgentAvatar       — avatar/ícone do sub-agente com tier
6. ModelBadge        — badge mostrando qual modelo foi usado
7. MemoryIndicator   — indica se contexto Mem0 foi carregado
8. CostTracker       — estimativa de custo da sessão
```

### Dados no MVP (sem Supabase ainda)
- Leia `squads/*/squad.yaml` para montar o org chart
- Leia `core/clients/registry.yaml` para lista de clientes
- Tarefas: estado local com `useState` + persistência em `localStorage`
- Migração para Supabase na Fase 2

---

## Regras de squad.yaml

Todo `squad.yaml` válido no BochechIA deve ter estes campos além dos básicos:

```yaml
routing:
  tier_0: qwen3.5-flash          # orquestrador (Alibaba)
  tier_1: qwen3.5-plus           # agentes principais (Alibaba)
  task_simple: qwen3.5-flash     # headlines, bullets, revisão
  task_complex: claude-sonnet-4-6 # copy crítico, estratégia

mem0:
  scope:
    - client_tone
    - approved_copy
    - failed_attempts
    - personas
    - objections
    - competitors
  load_on_start: true
  save_on_complete: true

privacy:
  client_data_model: claude      # modelo para dados de cliente
  internal_tasks_model: alibaba  # modelo para tarefas internas (Qwen)
```

---

## Convenções de nomenclatura

- Squads: `kebab-case` (ex: `copy-squad`, `brand-squad`)
- Agentes: `kebab-case` com nome descritivo (ex: `gary-halbert`, `hormozi-chief`)
- Tasks: `verb-noun.md` (ex: `write-headline.md`, `create-offer.md`)
- Workflows: `wf-nome.yaml` (ex: `wf-full-copy-project.yaml`)
- Clientes: `cliente-nome` (ex: `cliente-torq`, `cliente-abc`)

---

## O que este sistema não faz

- Não é um chatbot genérico — agentes têm funções específicas
- Não distribui conteúdo sem aprovação humana
- Não armazena dados de clientes no Git
- Não usa Alibaba/Qwen para dados sensíveis de clientes
- Não cria squads sem squad.yaml completo
