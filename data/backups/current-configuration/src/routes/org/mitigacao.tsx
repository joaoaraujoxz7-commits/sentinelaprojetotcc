import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";

export const Route = createFileRoute("/org/mitigacao")({ component: () => <ManagedRecords kind="mitigations" title="Plano de Mitigação" description="Acompanhe problemas, evidências, impacto, medida corretiva, responsável, prazo e validação." /> });
