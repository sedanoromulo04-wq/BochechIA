create extension if not exists vector;

create table if not exists organizations (
  id text primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id text primary key,
  organization_id text not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null unique,
  focus text not null,
  created_at timestamptz not null default now()
);

create table if not exists operators (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  role text not null,
  created_at timestamptz not null default now()
);

create table if not exists knowledge_sources (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  kind text not null,
  title text not null,
  domain text not null,
  status text not null,
  trust_level text not null,
  uri text,
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by text not null references operators(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id text primary key,
  source_id text not null references knowledge_sources(id) on delete cascade,
  workspace_id text not null references workspaces(id) on delete cascade,
  title text not null,
  domain text not null,
  current_version_id text,
  created_at timestamptz not null default now()
);

create table if not exists document_versions (
  id text primary key,
  document_id text not null references documents(id) on delete cascade,
  version integer not null,
  content text not null,
  checksum text not null,
  status text not null,
  extracted_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id text primary key,
  document_version_id text not null references document_versions(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  source_id text not null references knowledge_sources(id) on delete cascade,
  workspace_id text not null references workspaces(id) on delete cascade,
  ordinal integer not null,
  content text not null,
  token_count integer not null default 0,
  lexical_terms jsonb not null default '[]'::jsonb,
  embedding vector(48),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists facts (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  source_id text not null references knowledge_sources(id) on delete cascade,
  document_id text not null references documents(id) on delete cascade,
  version_id text not null references document_versions(id) on delete cascade,
  chunk_id text not null references document_chunks(id) on delete cascade,
  type text not null,
  subject text not null,
  claim text not null,
  confidence numeric(5,4) not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists entities (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  kind text not null,
  name text not null,
  slug text not null,
  aliases jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists relationships (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  from_entity_id text not null references entities(id) on delete cascade,
  to_entity_id text not null references entities(id) on delete cascade,
  type text not null,
  weight numeric(5,4) not null default 1,
  source_id text references knowledge_sources(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists policies (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  category text not null,
  description text not null,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '{}'::jsonb,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists decision_records (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  run_id text,
  process_id text not null,
  squad_id text not null,
  action text not null,
  rationale jsonb not null default '[]'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  policy_ids jsonb not null default '[]'::jsonb,
  model_id text not null,
  knowledge_confidence numeric(5,4) not null default 0,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists runs (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  client_id text not null,
  squad_id text not null,
  task_name text,
  prompt text not null,
  status text not null,
  model_id text not null,
  provider text not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  output text,
  error text,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(12,6),
  knowledge_confidence numeric(5,4),
  approval_id text,
  decision_record_id text
);

create table if not exists run_steps (
  id bigserial primary key,
  run_id text not null references runs(id) on delete cascade,
  squad_id text not null,
  agent_id text not null,
  model_id text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(12,6),
  output text
);

create table if not exists tool_calls (
  id bigserial primary key,
  run_id text not null references runs(id) on delete cascade,
  tool_name text not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists approvals (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  run_id text not null references runs(id) on delete cascade,
  decision_record_id text not null references decision_records(id) on delete cascade,
  status text not null,
  reason text,
  requested_by text not null,
  responded_by text,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create table if not exists connectors (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  kind text not null,
  status text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists sync_jobs (
  id text primary key,
  connector_id text not null references connectors(id) on delete cascade,
  workspace_id text not null references workspaces(id) on delete cascade,
  status text not null,
  last_run_at timestamptz,
  records_processed integer not null default 0
);

create table if not exists ingestion_events (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  source_id text not null references knowledge_sources(id) on delete cascade,
  status text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists eval_sets (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists eval_runs (
  id text primary key,
  eval_set_id text not null references eval_sets(id) on delete cascade,
  workspace_id text not null references workspaces(id) on delete cascade,
  status text not null,
  score numeric(5,4) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists retrieval_metrics (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  query text not null,
  confidence numeric(5,4) not null default 0,
  citations_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_chunks_workspace on document_chunks(workspace_id);
create index if not exists idx_facts_workspace on facts(workspace_id);
create index if not exists idx_decision_records_workspace on decision_records(workspace_id);
create index if not exists idx_approvals_workspace on approvals(workspace_id);
