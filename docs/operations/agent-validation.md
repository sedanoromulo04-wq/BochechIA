# Validação Operacional dos Agentes

Documento de operação para validar a lógica dos squads antes de ligar qualquer camada de dashboard operacional.

## Objetivo

Garantir que a base declarativa dos agentes esteja consistente em quatro dimensões:

1. manifests de squad válidos
2. tasks com contrato mínimo consistente
3. workflows executáveis em smoke estrutural
4. roteamento de tarefas completo

## Comandos

Na raiz do repositório:

```bash
npm run validate:aios
npm run smoke:aios
npm run check:aios
```

## O que cada comando faz

### `npm run validate:aios`

Executa o validator formal em `scripts/validate-aios.cjs`.

Valida:
- presença de `routing`, `mem0` e `privacy` nos `squad.yaml`
- existência de arquivos referenciados em `agents`, `tasks`, `workflows`, `checklists`
- frontmatter mínimo das tasks
- presença das seções obrigatórias das tasks
- consistência de `**Command:**` com o slug do arquivo
- consistência estrutural dos workflows
- cobertura completa de `core/routing/model-routing.yaml` para tasks top-level

### `npm run smoke:aios`

Executa o smoke runner em `scripts/smoke-runner.cjs`.

Ele não chama LLMs nem providers externos.
Em vez disso, executa um **smoke estrutural** de 1 fluxo ouro por squad:

- carrega o workflow escolhido
- resolve placeholders dinâmicos com fixtures controladas
- ordena fases por dependência
- valida agentes e tasks resolvidos
- confirma que o fluxo consegue ser percorrido até o fim

## Fluxos ouro atuais

Definidos em `scripts/smoke-fixtures.json`:

- `copy-squad` → `wf-full-copy-project`
- `brand-squad` → `wf-brand-creation`
- `hormozi-squad` → `wf-offer-creation`
- `content-squad` → `wf-story-development`
- `traffic-masters` → `wf-account-audit`
- `data-squad` → `wf-analytics-setup`
- `c-level-squad` → `wf-strategic-planning`

## Estado validado em 2026-04-26

- validator: **0 errors / 0 warnings**
- smoke runner: **7/7 squads aprovados**
- gap de roteamento: **fechado para tasks top-level**

## Limites atuais

Esta validação ainda é **estrutural**, não runtime real.

Ainda não cobre:
- chamadas reais para Anthropic
- chamadas reais para Alibaba/Qwen
- leitura/escrita real no Mem0
- aprovação humana persistida
- execução real de dispatch entre squads

## Próxima etapa recomendada

Depois desta camada, o próximo corte natural é:

1. criar um executor real de runs
2. registrar status/custo/aprovação
3. só então expor esse runtime no dashboard
