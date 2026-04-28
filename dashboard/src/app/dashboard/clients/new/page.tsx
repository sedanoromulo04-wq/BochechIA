import { DashboardShell } from "@/components/dashboard/ui";
import { NewClientForm } from "@/components/dashboard/new-client-form";

export default function NewClientPage() {
  return (
    <DashboardShell
      title="Novo cliente"
      description="Cadastre um cliente para começar a enviar demandas para os agentes."
    >
      <NewClientForm />
    </DashboardShell>
  );
}
