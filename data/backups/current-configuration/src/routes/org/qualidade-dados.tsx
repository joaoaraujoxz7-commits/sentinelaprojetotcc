import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";
import { Disclaimer } from "@/components/sentinela/ui-kit";

export const Route = createFileRoute("/org/qualidade-dados")({ component: QualidadeDados });
function QualidadeDados() { return <div className="space-y-5"><ManagedRecords kind="data_quality" title="Qualidade e origem dos dados" description="Monitore completude, duplicidade, atualização, origem e confiabilidade das fontes utilizadas." /><Disclaimer>Dados históricos podem refletir padrões de registro e fiscalização, e não necessariamente a distribuição real das ocorrências.</Disclaimer></div>; }
