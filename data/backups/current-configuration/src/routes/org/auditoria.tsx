import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
export const Route = createFileRoute("/org/auditoria")({ component: () => <ManagedRecords kind="audits" title="Auditoria e Transparência" description="Auditorias reais cadastradas no sistema, sem indicadores de demonstração." /> });
