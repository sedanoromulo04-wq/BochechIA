import { notFound } from "next/navigation";
import { DashboardShell, KeyValueList, ModelBadge, Section, StatusBadge } from "@/components/dashboard/ui";
import { getSquad } from "@/lib/squads";

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ squad: string }>;
}) {
  const { squad: squadId } = await params;
  const squad = await getSquad(squadId);

  if (!squad) notFound();

  return (
    <DashboardShell title={squad.short_title} description={squad.description}>
      <div className="space-y-8">
        <Section
          title="Resumo"
          description="Leitura direta do `squad.yaml` atual. Esta tela e util para verificar se o manifest esta pronto para orquestracao e dashboard."
        >
          <KeyValueList
            items={[
              { label: "ID", value: squad.id },
              { label: "Versao", value: squad.version },
              { label: "Path", value: <code className="text-xs">{squad.path}</code> },
              {
                label: "Tags",
                value: (
                  <div className="flex flex-wrap gap-2">
                    {squad.tags.map((tag) => (
                      <StatusBadge key={tag} value={tag} />
                    ))}
                  </div>
                ),
              },
            ]}
          />
        </Section>

        <Section title="Componentes" description="Inventario basico do squad.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-base font-semibold">Agentes</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {squad.components.agents.map((agent) => (
                  <li key={agent}>
                    <code>{agent}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
                <h3 className="text-base font-semibold">Tarefas</h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  {(squad.components.tasks ?? []).map((task) => (
                    <li key={task}>
                      <code>{task}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
                <h3 className="text-base font-semibold">Workflows e checklists</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Workflows</p>
                    <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                      {(squad.components.workflows ?? []).map((workflow) => (
                        <li key={workflow}>
                          <code>{workflow}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Checklists</p>
                    <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                      {(squad.components.checklists ?? []).map((checklist) => (
                        <li key={checklist}>
                          <code>{checklist}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Roteamento e memoria"
          description="Campos obrigatorios adicionados para sustentar a proxima camada de execucao."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-base font-semibold">Routing</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {squad.routing ? (
                  Object.entries(squad.routing)
                    .map(([key, value]) =>
                      value ? (
                        <div key={key} className="space-x-2 text-sm">
                          <span className="text-[var(--muted)]">{key}</span>
                          <ModelBadge model={value} />
                        </div>
                      ) : null,
                    )
                ) : (
                  <p className="text-sm text-[var(--muted)]">Nao configurado.</p>
                )}
              </div>
            </div>
            <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-base font-semibold">Mem0</h3>
              {squad.mem0 ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(squad.mem0.scope ?? []).map((item) => (
                      <StatusBadge key={item} value={item} />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    load_on_start: {String(squad.mem0.load_on_start)} · save_on_complete:{" "}
                    {String(squad.mem0.save_on_complete)}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">Nao configurado.</p>
              )}
            </div>
            <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-base font-semibold">Privacy</h3>
              {squad.privacy ? (
                <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                  <p>client_data_model: {squad.privacy.client_data_model}</p>
                  <p>internal_tasks_model: {squad.privacy.internal_tasks_model}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted)]">Nao configurado.</p>
              )}
            </div>
          </div>
        </Section>
      </div>
    </DashboardShell>
  );
}
