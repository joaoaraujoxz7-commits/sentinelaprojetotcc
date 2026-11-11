import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
export const Route = createFileRoute("/org/notificacoes")({ component: () => <ManagedRecords kind="notifications" title="Notificações" description="Novas ocorrências e contestações enviadas pela população aparecem automaticamente aqui." allowCreate={false} /> });
