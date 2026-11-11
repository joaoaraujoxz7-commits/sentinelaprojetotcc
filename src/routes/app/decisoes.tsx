import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfidenceBar, Disclaimer, PageHeader, Panel, StatusPill } from "@/components/sentinela/ui-kit";
import { citizenDecisionRecordsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/app/decisoes")({ component: Decisoes });
type Decision = ManagedRecord & { kind: "occurrence" | "prediction"; protocol: string };

function Decisoes() {
  const [records, setRecords] = useState<Decision[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("Todos");
  useEffect(() => { void citizenDecisionRecordsFn().then((items) => setRecords(items as Decision[])); }, []);
  const visible = useMemo(() => records.filter((record) => (kind === "Todos" || record.kind === kind) && `${record.title} ${record.region} ${record.protocol}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [records, kind, search]);
  return <div className="space-y-5"><PageHeader title="Decisões e previsões" description="Consulte resultados relacionados aos seus registros e entenda como devem ser interpretados." />
    <Panel title="Consultar resultado" action={<div className="flex gap-2"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={kind} onChange={(event) => setKind(event.target.value)}><option>Todos</option><option value="occurrence">Ocorrências</option><option value="prediction">Previsões</option></select><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-64 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Protocolo, tipo ou região" /></div></div>}>
      {visible.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum resultado disponível.</p> : <div className="space-y-3">{visible.map((record) => <article key={`${record.kind}-${record.id}`} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs text-primary">{record.protocol}</p><h3 className="mt-1 font-semibold">{record.title}</h3><p className="mt-1 text-xs text-muted-foreground">{record.eventDate} · {record.region}</p></div><div className="flex items-center gap-2"><StatusPill tone={record.kind === "prediction" ? "info" : "success"}>{record.status}</StatusPill><Button size="sm" variant="secondary" onClick={() => setOpened((current) => current === record.id ? null : record.id)}>{opened === record.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}{opened === record.id ? "Fechar" : "Entender"}</Button></div></div>{opened === record.id && <Explanation record={record} />}</article>)}</div>}
    </Panel><Disclaimer>Dado, previsão e decisão são elementos diferentes. Uma previsão não é certeza e não deve resultar automaticamente em decisão contra uma pessoa.</Disclaimer></div>;
}

function Explanation({ record }: { record: Decision }) {
  const factors = [
    ["Histórico recente de ocorrências confirmadas", record.confidence],
    ["Concentração temporal", Math.max(0, record.confidence - 12)],
    ["Distribuição geográfica agregada", Math.max(0, record.confidence - 20)],
    ["Qualidade e quantidade dos dados", Math.max(0, record.confidence - 28)],
  ] as const;
  return <div className="mt-5 space-y-5 border-t pt-5"><div className="grid gap-4 md:grid-cols-2"><div><p className="text-xs text-muted-foreground">Resultado informado</p><p className="mt-1 font-semibold">{record.status}</p></div><div><p className="text-xs text-muted-foreground">Fonte</p><p className="mt-1 font-semibold">{record.source}</p></div></div>{record.kind === "prediction" && <ConfidenceBar value={record.confidence} label="Confiabilidade estimada do modelo" />}<Panel title="Como o sistema chegou a este resultado?"><div className="space-y-3">{factors.map(([label, value]) => <div key={label}><div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span>{value}%</span></div><div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Período: {record.eventDate} {record.eventTime}. Fonte: {record.source}. {record.details}</p></Panel><div className="rounded-lg border border-warning/25 bg-warning/5 p-4"><p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-warning" />Limitações desta análise</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Dados históricos podem refletir diferenças na forma como ocorrências são registradas ou fiscalizadas. Este resultado não representa certeza sobre o que acontecerá.</p></div><div className="flex flex-wrap gap-2"><Button asChild><Link to="/app/contestacao">Contestar esta decisão</Link></Button><Button asChild variant="secondary"><Link to="/app/revisao">Solicitar revisão humana</Link></Button><Button asChild variant="secondary"><Link to="/app/lumia"><Bot className="size-4" />Perguntar à LumIA</Link></Button></div></div>;
}
