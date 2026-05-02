# Memória e Conhecimento

## Papel do Mem0

No estado atual, o Mem0 **não é a fonte da verdade institucional**.

Ele existe como memória auxiliar para:

- contexto de sessão
- contexto curto por cliente
- continuidade conversacional

## Fonte da verdade

A fonte da verdade do cérebro é a knowledge base estruturada, composta por:

- `knowledge_sources`
- `documents`
- `document_versions`
- `document_chunks`
- `facts`
- `policies`
- `decision_records`
- `approvals`

## Regra operacional

- conhecimento institucional aprovado → knowledge base
- contexto curto / pessoal / transitório → Mem0
- output aprovado relevante → pode virar nova fonte ingerida

## Escopos

- curto prazo: sessão / conversa
- operacional: processo / policy / SOP
- organizacional: decisões e fatos aprovados

## Estado atual

- schema conceitual original do Mem0 segue em `core/mem0/schema.yaml`
- a camada de conhecimento estruturado já foi implementada no dashboard
