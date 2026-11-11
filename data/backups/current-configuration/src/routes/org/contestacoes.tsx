import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
export const Route = createFileRoute("/org/contestacoes")({ component: () => <ManagedRecords kind="contests" title="Contestações e revisões" description="Solicitações de revisão humana registradas no banco de dados." /> });
