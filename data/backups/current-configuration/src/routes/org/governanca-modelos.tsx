import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";

export const Route = createFileRoute("/org/governanca-modelos")({ component: () => <ManagedRecords kind="models" title="Governança dos Modelos" description="Cadastre versões, desempenho, auditorias, alertas e situação operacional de cada modelo." /> });
