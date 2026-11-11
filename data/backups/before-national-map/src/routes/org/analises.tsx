import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, StatCard } from "@/components/sentinela/ui-kit";
import { listRecordsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/org/analises")({ component: Analises });

function Analises() {
  const [occurrences, setOccurrences] = useState<ManagedRecord[]>([]);
  useEffect(() => { void listRecordsFn({ data: { kind: "occurrences" } }).then(setOccurrences); }, []);
  const stats = useMemo(() => {
    const confirmed = occurrences.filter((item) => item.status.toLowerCase().includes("confirm")).length;
    const average = occurrences.length ? Math.round(occurrences.reduce((sum, item) => sum + item.confidence, 0) / occurrences.length) : 0;
    const countBy = (field: "region" | "source") => Object.entries(occurrences.reduce<Record<string, number>>((acc, item) => { const key = item[field] || "Não informado"; acc[key] = (acc[key] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
    return { confirmed, average, regions: countBy("region"), sources: countBy("source") };
  }, [occurrences]);

  return <div className="space-y-6">
    <PageHeader title="Análises" description="Indicadores calculados automaticamente a partir das ocorrências cadastradas." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total de ocorrências" value={String(occurrences.length)} />
      <StatCard label="Ocorrências confirmadas" value={String(stats.confirmed)} tone="success" />
      <StatCard label="Taxa de confirmação" value={occurrences.length ? `${Math.round(stats.confirmed / occurrences.length * 100)}%` : "0%"} />
      <StatCard label="Confiabilidade média" value={`${stats.average}%`} />
    </div>
    {occurrences.length === 0 ? <Panel><p className="py-8 text-center text-sm text-muted-foreground">As análises aparecerão quando houver ocorrências cadastradas.</p></Panel> : <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Ocorrências por região"><RankedRows rows={stats.regions} /></Panel>
      <Panel title="Origem dos dados"><RankedRows rows={stats.sources} /></Panel>
    </div>}
  </div>;
}

function RankedRows({ rows }: { rows: [string, number][] }) {
  return <div className="space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-border pb-2 text-sm"><span>{label}</span><span className="font-semibold text-primary">{value}</span></div>)}</div>;
}
