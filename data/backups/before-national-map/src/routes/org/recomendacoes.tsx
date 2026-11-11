import { createFileRoute, redirect } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";

export const Route = createFileRoute("/org/recomendacoes")({
  beforeLoad: ({ context }) => { if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" }); },
  component: () => <ManagedRecords kind="recommendations" title="Recomendações de patrulhamento" description="Recomendações operacionais registradas para consulta e acompanhamento dos agentes." />,
});
