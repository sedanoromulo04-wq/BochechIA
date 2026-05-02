# ADR — Knowledge-First Brain

## Decisão

Adotar uma arquitetura em que a **base de conhecimento estruturada** é a fundação do sistema, e não uma camada auxiliar ao redor de prompts.

## Motivação

O diferencial estratégico do BochechIA está em:

- memória corporativa persistente
- governança da decisão
- proveniência do conhecimento
- escalabilidade da operação

Sem isso, o sistema vira apenas um executor multiagente com contexto variável.

## Consequências

### O que sobe de prioridade

- schema de conhecimento
- ingestão
- facts
- approvals
- decision log
- evals

### O que desce de prioridade

- UI “bonita” antes da fundação
- autonomia irrestrita sem policy
- dependência de memória genérica como fonte primária

## V1 adotado

- storage local para desenvolvimento
- schema Supabase/pgvector para produção
- retrieval híbrido faseado
- workers especializados subordinados ao cérebro
- human-in-the-loop por padrão em saídas críticas
