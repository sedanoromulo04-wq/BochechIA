# Setup do BochechIA — Passo a Passo

Guia completo para ir do zero ao sistema funcionando no VS Code com Claude Code.

---

## Pré-requisitos

- [ ] VS Code instalado
- [ ] Claude Code instalado no VS Code
- [ ] Git instalado
- [ ] Node.js 20+ instalado
- [ ] Conta no GitHub
- [ ] Conta no Mem0 (mem0.ai) — plano gratuito tem 10k memórias
- [ ] Chave de API da Anthropic (claude.ai/api)
- [ ] Chave de API do Alibaba Model Studio (dashscope.aliyuncs.com) — para Qwen flash/plus

---

## Passo 1 — Criar o repositório no GitHub

1. Vá em github.com → New repository
2. Nome: `bochechia`
3. Privado (recomendado — tem dados de squads)
4. Não inicialize com README (já temos)
5. Copie a URL do repositório

---

## Passo 2 — Subir a documentação inicial

```bash
# No terminal, na pasta onde você quer o projeto
git clone <url-do-repo>
cd bochechia

# Copie todos os arquivos que você baixou aqui
# (CLAUDE.md, AGENTS.md, README.md, docs/, core/, squads/, dashboard/)

git add .
git commit -m "feat: estrutura inicial do BochechIA"
git push origin main
```

---

## Passo 3 — Migrar os squads do skill-creator

```bash
# Com o skill-creator clonado separadamente:
# Copie as pastas de squads para bochechia/squads/

cp -r skill-creator/agents/copy-squad/ bochechia/squads/copy-squad/
cp -r skill-creator/agents/hormozi-squad/ bochechia/squads/hormozi-squad/
cp -r skill-creator/agents/brand-squad/ bochechia/squads/brand-squad/
cp -r skill-creator/agents/c-level-squad/ bochechia/squads/c-level-squad/
cp -r skill-creator/agents/storytelling/ bochechia/squads/content-squad/
cp -r skill-creator/agents/traffic-masters/ bochechia/squads/traffic-masters/
cp -r skill-creator/agents/data-squad/ bochechia/squads/data-squad/
```

Depois, em cada squad migrado, atualizar o `squad.yaml` com os novos campos:
- `routing:` (copiar do template)
- `mem0:` (copiar do template)
- `privacy:` (copiar do template)

Status atual em `2026-04-25`:
- os squads top-level ativos já foram alinhados
- `content-squad` já existe como fusão de storytelling + movement

---

## Passo 4 — Configurar o dashboard Next.js

```bash
cd bochechia/dashboard

npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

npm install
npm run dev
# Dashboard rodando em http://localhost:3000
```

Observação: o projeto real está em **Next.js 16.2.4** com **Tailwind CSS 4**.

---

## Passo 5 — Configurar variáveis de ambiente

```bash
# Na pasta dashboard/
cp .env.example .env.local

# Edite .env.local com suas chaves:
MEM0_API_KEY=sua_chave_mem0
ANTHROPIC_API_KEY=sua_chave_anthropic
ALIBABA_API_KEY=sua_chave_alibaba
ALIBABA_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

---

## Passo 6 — Abrir no VS Code com Claude Code

```bash
# Na raiz do bochechia/
code .
```

1. O Claude Code vai ler o `CLAUDE.md` automaticamente
2. Você já tem todo o contexto do sistema carregado
3. Primeiro prompt sugerido:

```
Leia o CLAUDE.md e me mostre um resumo do que você entendeu sobre o BochechIA.
Depois, me mostre a lista de squads disponíveis em squads/ com seus modelos de roteamento.
```

---

## Passo 7 — Conectar Mem0

1. Crie conta em mem0.ai
2. Copie a API key
3. Coloque em `.env.local`
4. No Claude Code, o Mem0 MCP já está disponível se configurado

---

## Próximos passos após o setup

- [x] Migrar e atualizar squad.yaml dos squads top-level ativos
- [x] Buildar a primeira versão navegável do dashboard (`/dashboard`)
- [ ] Testar o primeiro workflow de cliente com Mem0
- [ ] Configurar deploy no Vercel

---

## Problemas comuns

**Claude Code não lê o CLAUDE.md**
→ Certifique-se de abrir a pasta raiz do bochechia/ no VS Code, não uma subpasta.

**Erro no Next.js**
→ Apague `node_modules/` e `.next/` e rode `npm install` novamente.

**Mem0 não carrega contexto**
→ Verifique se o `user_id` e `agent_id` batem com o que foi salvo anteriormente.
