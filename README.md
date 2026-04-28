# BochechIA 🤖

**AI Operating System para agências e serviços de IA**

BochechIA é um AIOS (AI Operating System) que orquestra squads de agentes especializados
para entregar serviços de IA, copywriting, estratégia de marca, tráfego pago e automação
para múltiplos clientes a partir de um único sistema.

---

## Visão geral

```
┌─────────────────────────────────────────────────────┐
│                    Você (CEO)                        │
│              Dashboard Next.js                       │
├──────────────┬──────────────┬───────────────────────┤
│ Strategy OS  │ Conversion   │ Content OS            │
│ brand-squad  │ copy-squad   │ content-squad         │
│ c-level-squad│ hormozi-squad│ traffic-masters       │
├──────────────┴──────────────┴───────────────────────┤
│         Mem0 (memória por cliente)                   │
│    Model Router (Flash / Pro / Sonnet / Opus)        │
└─────────────────────────────────────────────────────┘
```

## Squads ativos

| Squad | Agentes | Especialidade |
|-------|---------|--------------|
| `copy-squad` | 23 personas | Direct response, VSL, email, funis |
| `hormozi-squad` | 16 agentes | Ofertas, leads, pricing, sales |
| `brand-squad` | — | Posicionamento, tese de categoria |
| `c-level-squad` | — | Estratégia, advisory, decisões críticas |
| `content-squad` | — | Storytelling, movimento de marca |
| `traffic-masters` | — | Tráfego pago, distribuição |
| `data-squad` | — | Métricas, relatórios, análise |

## Stack

- **Agentes:** Claude Code com squad.yaml
- **Memória:** Mem0 (90% redução de tokens vs full-context)
- **Modelos:** Qwen flash/plus (Alibaba) + Claude Sonnet/Opus (roteamento por complexidade e privacidade)
- **Dashboard:** Next.js 16 + TypeScript + Tailwind 4
- **Deploy:** Vercel

## Início rápido

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/bochechia.git
cd bochechia

# 2. Configure o dashboard
cd dashboard
npm install
npm run dev

# 3. Configure o Claude Code
# Abra a pasta raiz no VS Code com Claude Code instalado
# O CLAUDE.md será lido automaticamente
```

## Documentação

- [Arquitetura do sistema](docs/architecture/overview.md)
- [Progresso de implementação](docs/progress.md)
- [Handoff para próxima LLM](docs/handoff-next-llm.md)
- [Validação operacional dos agentes](docs/operations/agent-validation.md)
- [Gate do dashboard](docs/operations/dashboard-gating.md)
- [Roteamento de modelos](docs/architecture/model-routing.md)
- [Schema de memória Mem0](docs/architecture/memory-schema.md)
- [Estrutura de squads](docs/squads/squad-structure.md)
- [Schema de clientes](docs/clients/client-schema.md)

## Licença

MIT © 2026 Synkra / BochechIA
