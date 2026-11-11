import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfidenceBar, Disclaimer, PageHeader, Panel, StatusPill } from "@/components/sentinela/ui-kit";
import { listRecordsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/org/recomendacoes")({
  beforeLoad: ({ context }) => { if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" }); },
  component: Recomendacoes,
});

function Recomendacoes() {
  const [records, setRecords] = useState<ManagedRecord[]>([]);
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState<string | null>(null);
  useEffect(() => { void listRecordsFn({ data: { kind: "recommendations" } }).then(setRecords); }, []);
  const visible = useMemo(() => records.filter((record) => `${record.title} ${record.region} ${record.details}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [records, search]);
  return <div className="space-y-5"><PageHeader title="Recomendações de patrulhamento" description="Consulte recomendações agregadas como apoio ao planejamento e registre a decisão operacional humana." />
    <Panel title="Recomendações disponíveis" subtitle="Nenhuma recomendação autoriza automaticamente uma abordagem ou ação individual." action={<div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-64 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar área ou recomendação" /></div>}>
      {visible.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma recomendação cadastrada pelo órgão.</p> : <div className="grid gap-4 xl:grid-cols-2">{visible.map((record) => <article key={record.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{record.title}</h3><p className="mt-1 text-xs text-muted-foreground">{record.region} · {record.eventDate} {record.eventTime}</p></div><StatusPill tone={/conclu|encerr/i.test(record.status) ? "success" : "info"}>{record.status}</StatusPill></div><div className="mt-4"><ConfidenceBar value={record.confidence} label="Confiabilidade da recomendação" /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Área recomendada</dt><dd className="mt-1">{record.region}</dd></div><div><dt className="text-muted-foreground">Período e horário</dt><dd className="mt-1">{record.eventDate} {record.eventTime}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setOpened((current) => current === record.id ? null : record.id)}>{opened === record.id ? "Fechar fundamentação" : "Ver fundamentação"}</Button><Button asChild size="sm"><Link to="/org/patrulhamentos">Registrar patrulhamento</Link></Button></div>{opened === record.id && <div className="mt-4 border-t pt-4"><p className="text-sm font-semibold">Fundamentação e limitações</p><p className="mt-2 text-sm text-muted-foreground">{record.details || "Nenhuma fundamentação adicional foi cadastrada."}</p><p className="mt-3 rounded-lg border border-warning/25 bg-warning/5 p-3 text-xs text-muted-foreground">A recomendação deve ser adaptada ao contexto observado. Registre se ela foi seguida e justifique a decisão operacional.</p></div>}</article>)}</div>}
    </Panel><Disclaimer>Recomendações são apoio ao planejamento. A responsabilidade final é humana e qualquer ação deve respeitar contexto, proporcionalidade, direitos e procedimentos institucionais.</Disclaimer></div>;
}
