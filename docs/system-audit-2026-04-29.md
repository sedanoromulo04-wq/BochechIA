# Auditoria do Sistema — 2026-04-29

## Objetivo

Documentar o estado real do BochechIA, verificar o funcionamento da base atual e preparar o encaixe da próxima arquitetura sem perder o que já está sólido.

## Resumo executivo

O sistema atual está funcional como um **knowledge-first brain** com cinco blocos já conectados:

1. knowledge layer
2. policy / orchestration engine
3. run engine
4. dashboard de governança
5. squads especializados

Ele ainda não está na arquitetura final de "especialistas compostos orientados por dados", mas já possui a espinha dorsal correta para chegar lá.

## O que foi verificado

### Validação estrutural dos squads

Comando:

```bash
npm run check:aios
```

Resultado:

- `validate:aios` passou com `0 errors / 0 warnings`
- `smoke:aios` passou com `7/7 squads aprovados`

Squads verificados no smoke:

- `brand-squad`
- `c-level-squad`
- `content-squad`
- `copy-squad`
- `data-squad`
- `hormozi-squad`
- `traffic-masters`

### Build do dashboard

Comando:

```bash
cd dashboard
npm run build
```

Resultado:

- build de produção concluído com sucesso
- rotas App Router e APIs foram geradas sem erro

### Lint

Comando:

```bash
cd dashboard
npm run lint
```

Resultado após limpeza:

- warnings de imports não usados removidos
- lint sem erros bloqueantes

## Arquitetura atual confirmada

### 1. Knowledge layer

Arquivos centrais:

- `dashboard/src/lib/knowledge-store.ts`
- `dashboard/src/lib/knowledge-retrieval.ts`
- `core/knowledge/brain-store.json`

Função atual:

- indexa documentação base
- quebra conteúdo em chunks
- extrai fatos
- registra fontes, versões, fatos, aprovações e decisões

### 2. Policy / orchestration

Arquivos centrais:

- `dashboard/src/lib/policy-engine.ts`
- `dashboard/src/lib/router.ts`
- `core/routing/model-routing.yaml`

Função atual:

- escolhe ação do cérebro: `answer`, `execute`, `clarify`, `escalate`
- decide modelo
- aplica regra de privacidade
- exige approval em cenários críticos

### 3. Runtime operacional

Arquivos centrais:

- `dashboard/src/lib/engine.ts`
- `dashboard/src/lib/runs-store.ts`
- `dashboard/src/lib/providers.ts`
- `dashboard/src/lib/mem0.ts`

Função atual:

- cria run
- consulta conhecimento
- monta plano
- executa provider
- calcula custo
- abre approval quando necessário
- salva output aprovado como conhecimento

### 4. Control plane

Rotas principais:

- `/dashboard`
- `/dashboard/knowledge`
- `/dashboard/processes`
- `/dashboard/decisions`
- `/dashboard/approvals`
- `/dashboard/runs`
- `/dashboard/connectors`
- `/dashboard/evals`

### 5. Squads especializados

O sistema já possui um catálogo consistente de especialistas operacionais por domínio:

- branding
- copy
- conteúdo
- tráfego
- estratégia executiva
- dados
- ofertas

## O que está sólido hoje

- A base já é orientada por conhecimento, não apenas por prompts soltos
- Há governança explícita de decisão, approval e privacidade
- Existe separação clara entre cérebro central e squads executores
- O dashboard já funciona como cockpit de operação
- O sistema consegue evoluir localmente sem depender de infraestrutura externa

## Limites atuais

### 1. A inteligência cognitiva ainda não é uma camada formal

Hoje existem especialistas e frameworks por squad, mas ainda não existe uma camada nativa de:

- filosofia
- comportamento
- psicologia
- neurociência

Esses elementos ainda não operam como módulos transversais do cérebro.

### 2. O storage ainda é local

Estado atual:

- `core/knowledge/brain-store.json`
- `core/knowledge/runs.json`

Isso é ótimo para evolução rápida, mas limita:

- concorrência
- escala
- auditoria mais robusta
- analytics históricos

### 3. Retrieval ainda é v1

O sistema já usa retrieval híbrido, mas ainda não chegou em:

- embeddings reais externos
- conectores de dados vivos
- relações densas entre entidades
- GraphRAG

### 4. Os squads ainda são especialistas operacionais

Hoje eles executam bem por domínio, mas ainda não foram reorganizados como "especialistas compostos" abastecidos por camadas cognitivas transversais.

## Como aplicar a nova arquitetura sem refazer o sistema

A nova arquitetura deve entrar como **camada acima da atual**, não como substituição do núcleo existente.

### Estrutura sugerida

#### Camada 1. Cérebro central

Já existe parcialmente:

- knowledge
- policy
- orchestration
- approvals

#### Camada 2. Camadas cognitivas transversais

Nova adição:

- `philosophy layer`
- `behavior layer`
- `psychology layer`
- `neuroscience layer`

Função:

- enriquecer análise
- modular decisão
- alterar priorização, framing, persuasão, timing e interpretação humana

#### Camada 3. Especialistas compostos

Em vez de um agente isolado de copy ou funil, cada especialista passaria a ser composto por:

- competência operacional
- dados do domínio
- filtros cognitivos
- critérios estratégicos

Exemplo:

`copy specialist = copy frameworks + behavioral triggers + psychological framing + ethical/philosophical constraints + performance data`

#### Camada 4. Data ingestion / scrapers

Nova adição:

- scrapers por especialista
- ingestão de benchmarks
- ingestão de estudos e frameworks
- ingestão de dados de mercado e performance

Função:

- manter a base viva
- alimentar especialistas com evidência
- transformar repertório em ativos consultáveis

## Próxima evolução recomendada

### Fase 1. Documentar o estado presente

- consolidar a visão atual do sistema
- registrar o que já existe e o que ainda é hipótese
- definir a ideia central do projeto em linguagem clara

### Fase 2. Modelar a nova arquitetura

- definir as camadas cognitivas
- definir como elas entram no `policy-engine` e nos `workers`
- definir quais squads serão pioneiros

### Fase 3. Criar base de especialistas compostos

Começar por 1 ou 2 verticais de maior valor:

- `copy`
- `offer`
- `funnel`

### Fase 4. Conectar ingestão viva

- scrapers
- bases de benchmark
- biblioteca de estudos
- fontes com versionamento e proveniência

## Conclusão

O BochechIA atual está operacionalmente consistente e arquiteturalmente promissor.

Ele ainda não é, por completo, o sistema de especialistas escaláveis orientados por dados que você imaginou. Mas já possui o núcleo certo para isso:

- cérebro central
- conhecimento estruturado
- política de decisão
- execução supervisionada
- especialistas por domínio

A próxima arquitetura deve ser tratada como **evolução cognitiva do núcleo atual**, não como reconstrução do projeto.
