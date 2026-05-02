# Deploy na Vercel

## Estrutura do projeto

O repositório do BochechIA é um monorepo simples:

- raiz do repo: documentação, `core/`, `squads/`, `docs/`
- app deployável: `dashboard/`

Na Vercel, o projeto deve apontar para a pasta `dashboard` como **Root Directory**.

## Configuração recomendada na Vercel

### 1. Importar o repositório

Importe o repositório normalmente no painel da Vercel.

### 2. Ajustar o Root Directory

Antes do primeiro deploy, configure:

- `Root Directory` = `dashboard`

Sem isso, a Vercel tende a interpretar a raiz do repo como projeto Node genérico, porque existe um `package.json` na raiz usado apenas para scripts operacionais.

### 3. Framework

- `Framework Preset` = `Next.js`

### 4. Variáveis de ambiente

Configure no projeto da Vercel:

- `ANTHROPIC_API_KEY`
- `ALIBABA_API_KEY`
- `ALIBABA_BASE_URL`
- `MEM0_API_KEY`
- `NEXT_PUBLIC_APP_NAME`

## Ajustes já feitos no código

Para suportar deploy na Vercel, o projeto foi preparado com:

### Monorepo tracing

Em `dashboard/next.config.ts`:

- `outputFileTracingRoot` aponta para a raiz do repositório
- `outputFileTracingIncludes` inclui:
  - `../core/**/*`
  - `../docs/**/*`
  - `../squads/**/*`

Isso é necessário porque o app lê arquivos fora de `dashboard/` em runtime.

### Escrita em runtime compatível com Vercel

Em produção na Vercel, o app agora usa:

- `/tmp/bochechia-runtime`

como área mutável para:

- `core/clients/registry.yaml`
- `core/knowledge/brain-store.json`
- `core/knowledge/runs.json`

O deploy continua lendo os arquivos seed do repositório, mas grava o estado mutável em `/tmp`, evitando erro de filesystem read-only.

## Limitação importante

O uso de `/tmp` permite o app funcionar na Vercel, mas esse armazenamento é efêmero.

Isso significa:

- dados criados em runtime podem se perder entre execuções
- não é a solução final para produção

Para produção estável, o caminho certo continua sendo:

- Supabase para dados persistentes
- Storage/DB canônico para knowledge, runs, clients e approvals

## Checklist rápido

- `Root Directory` configurado como `dashboard`
- variáveis de ambiente preenchidas
- deploy usando o preset `Next.js`
- validar `/dashboard`
- validar APIs:
  - `/api/runs`
  - `/api/knowledge/search`
  - `/api/decisions/plan`

## Se ainda falhar

Os erros mais prováveis serão:

1. Root Directory incorreto
2. variável de ambiente faltando
3. alguma rota tentando persistência que deveria ir para banco real
