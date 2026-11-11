import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
export const Route = createFileRoute("/org/previsoes")({ component: () => <ManagedRecords kind="predictions" title="Previsões" description="Previsões cadastradas manualmente, com região, validade, status e confiabilidade." /> });
