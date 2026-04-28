# Dashboard Gating

Regra operacional:

O dashboard **não** deve ser tratado como camada de operação real enquanto os comandos abaixo não passarem:

```bash
npm run validate:aios
npm run smoke:aios
```

## Gate atual

Em `2026-04-26`, o gate estrutural está **aprovado**:

- validator zerado
- smoke dos 7 fluxos ouro aprovado

## O que isso significa

Podemos confiar na consistência declarativa dos squads.

## O que isso não significa

Ainda não existe runtime real com:
- dispatch de tarefas
- memória Mem0 ativa
- chamadas reais a providers
- trilha persistida de aprovação/custo

Ou seja: o gate dos agentes está aprovado, mas o gate de operação do dashboard ainda depende da próxima camada de execução.
