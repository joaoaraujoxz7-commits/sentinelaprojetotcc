import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
export const Route = createFileRoute("/org/relatorios")({ component: () => <ManagedRecords kind="reports" title="Relatórios" description="Controle os relatórios realmente gerados e disponíveis para consulta." /> });
