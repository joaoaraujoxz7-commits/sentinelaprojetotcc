import { createFileRoute, redirect } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
import { Disclaimer } from "@/components/sentinela/ui-kit";

export const Route = createFileRoute("/org/alertas-vies")({
  beforeLoad: ({ context }) => { if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" }); },
  component: Alertas,
});
function Alertas() { return <div className="space-y-5"><ManagedRecords kind="bias_alerts" title="Possíveis disparidades detectadas" description="Alertas que precisam ser analisados antes do uso em decisões sensíveis." allowCreate={false} /><Disclaimer>Não utilize estes indicadores isoladamente para decisões individuais. Uma diferença observada não determina causalidade nem comprova discriminação.</Disclaimer></div>; }
