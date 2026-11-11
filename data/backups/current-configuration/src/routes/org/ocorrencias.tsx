import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
export const Route = createFileRoute("/org/ocorrencias")({ component: () => <ManagedRecords kind="occurrences" title="Ocorrências" description="Visualize todas as ocorrências enviadas pela população e os registros institucionais." /> });
