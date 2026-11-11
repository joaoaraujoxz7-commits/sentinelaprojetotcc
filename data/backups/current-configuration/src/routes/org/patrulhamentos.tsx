import { createFileRoute, redirect } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";

export const Route = createFileRoute("/org/patrulhamentos")({
  beforeLoad: ({ context }) => { if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" }); },
  component: () => <ManagedRecords kind="patrols" title="Patrulhamentos" description="Registre horário, localização, resultado e se a recomendação operacional foi seguida." />,
});
