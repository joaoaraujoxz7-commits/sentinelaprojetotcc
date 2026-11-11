import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
import { Disclaimer } from "@/components/sentinela/ui-kit";

export const Route = createFileRoute("/org/equidade")({ component: Equidade });
function Equidade() { return <div className="space-y-5"><ManagedRecords kind="bias_alerts" title="Monitoramento de Equidade" description="Registre e investigue possíveis disparidades em métricas agregadas por período e região." /><Disclaimer>Esta análise identifica diferenças que necessitam investigação. Ela não determina causalidade, não classifica indivíduos e utiliza somente dados agregados e anonimizados para auditoria.</Disclaimer></div>; }
