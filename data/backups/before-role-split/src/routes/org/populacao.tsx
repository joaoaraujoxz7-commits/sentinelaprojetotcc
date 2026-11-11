import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
export const Route = createFileRoute("/org/populacao")({ component: () => <ManagedRecords kind="occurrences" sourceFilter="População" title="Registros enviados pela população" description="Relatos de origem População armazenados na tabela de ocorrências." /> });
