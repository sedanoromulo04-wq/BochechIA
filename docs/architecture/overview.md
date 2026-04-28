# Arquitetura do BochechIA

## Visão geral

O BochechIA é composto por 4 camadas que se empilham:

```
┌──────────────────────────────────────────┐
│  1. VOCÊ — fundador / CEO humano          │
│     Dashboard Next.js para visibilidade   │
├──────────────────────────────────────────┤
│  2. ROTEADOR — decide qual modelo usar    │
│     core/routing/model-routing.yaml       │
├──────────────────────────────────────────┤
│  3. SQUADS — times especializados         │
│     Cada squad = squad.yaml + agentes     │
├──────────────────────────────────────────┤
│  4. MEM0 — memória por cliente            │
│     Elimina re-leitura de contexto        │
└──────────────────────────────────────────┘
```

## Estado atual da implementação

- A estrutura local canônica está dentro de `bochechia/`
- O dashboard já compila em `dashboard/` com Next.js 16.2.4
- O dashboard já executa runs reais (Etapa 4 concluída em 2026-04-26):
  - `squads/*/squad.yaml` — manifests dos squads
  - `core/clients/registry.yaml` — registry de clientes (JSON local, MVP)
  - `core/routing/model-routing.yaml` — roteamento de modelos
  - `core/runs/runs.json` — store persistente de runs
- Providers ativos: Anthropic (Sonnet/Opus) + Alibaba/Qwen (flash/pro)
- Mem0 integrado com stub mode (opera sem chave em dev)

## OS Layers

| Layer | Squads | Função |
|-------|--------|--------|
| Strategy OS | c-level-squad, brand-squad | Posicionamento, decisões críticas |
| Conversion OS | copy-squad, hormozi-squad | Copy, ofertas, vendas |
| Content OS | content-squad | Storytelling, conteúdo, movimento |
| Distribution OS | traffic-masters | Tráfego, distribuição, ads |
| Data OS | data-squad | Análise, relatórios, métricas |
| Memory OS | Mem0 (infra) | Persiste contexto entre sessões |

## Fluxo de um cliente real

```
1. Você registra o cliente (core/clients/registry.yaml)
2. Mem0 cria o escopo user_id=cliente
3. brand-squad → diagnóstico + brand foundation
4. copy-squad → copy com a persona certa para o nicho
5. content-squad → posts, hooks, stories com identidade visual
6. traffic-masters → estratégia de distribuição
7. Você aprova cada etapa no dashboard
8. Mem0 salva o que funcionou para o próximo ciclo
```

## Decisões arquiteturais

### Por que Alibaba/Qwen para tarefas simples?
Custo: `qwen3.5-flash` custa $0,03/M tokens de input vs $3,00/M do Sonnet.
Performance equivalente para tarefas estruturadas (headlines, bullets, formatação).
DeepSeek foi removido em 2026-04-26 — Qwen substituiu com a mesma SDK OpenAI-compat.
Ver `core/routing/model-routing.yaml` para custos atualizados.

### Por que Mem0 e não full-context?
Full-context: ~26.000 tokens por sessão.
Mem0: ~1.764 tokens por sessão.
Economia de ~90% em tokens mantendo qualidade equivalente.
Ver `docs/architecture/memory-schema.md` para schema.

### Por que Next.js e não React puro?
App Router do Next.js elimina boilerplate de roteamento.
API Routes para integração futura com Supabase.
Deploy direto no Vercel sem configuração adicional.

### Por que Next.js 16 e não 14?
O scaffold real do projeto foi feito em 2026-04-25 com Next.js 16.2.4 e Tailwind CSS 4.
O código e o build atuais devem seguir essa realidade, mesmo se documentos antigos mencionarem Next 14.

### Por que squad.yaml como fonte da verdade?
O dashboard lê os squad.yaml para montar o org chart automaticamente.
Nenhuma configuração duplicada — o YAML é a única fonte.
Adicionar um novo squad = criar a pasta e o YAML.
