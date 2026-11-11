import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Disclaimer, PageHeader, Panel, StatCard, StatusPill } from "@/components/sentinela/ui-kit";
import { addRecordFn, listRecordsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/org/alertas-vies")({
  beforeLoad: ({ context }) => { if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" }); },
  component: Alertas,
});
function Alertas() {
  const [alerts, setAlerts] = useState<ManagedRecord[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const load = () => listRecordsFn({ data: { kind: "bias_alerts" } }).then(setAlerts);
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => alerts.filter((item) => `${item.title} ${item.region} ${item.status} ${item.details}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [alerts, search]);
  const high = alerts.filter((item) => item.confidence >= 80 && !/conclu|encerr/i.test(item.status)).length;

  async function requestReview(alert: ManagedRecord) {
    const instant = new Date();
    await addRecordFn({ data: { kind: "ai_decisions", record: { title: `Revisão solicitada: ${alert.title}`, region: alert.region, eventDate: instant.toISOString().slice(0, 10), eventTime: instant.toTimeString().slice(0, 5), source: "Agente policial", status: "Revisão solicitada", confidence: alert.confidence, details: `Alerta relacionado: ${alert.id}. Motivo: possível disparidade requer avaliação antes do uso em decisão sensível. ${alert.details}` } } });
    setMessage("Solicitação registrada no histórico de decisões para revisão humana.");
  }

  return <div className="space-y-5"><PageHeader title="Alertas de disparidade" description="Analise diferenças relevantes antes de utilizar indicadores em decisões operacionais." />
    <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Alertas recebidos" value={String(alerts.length)} /><StatCard label="Necessitam análise" value={String(alerts.filter((item) => !/conclu|encerr/i.test(item.status)).length)} tone="warning" /><StatCard label="Severidade alta" value={String(high)} tone={high ? "danger" : "success"} /></div>
    {message && <Disclaimer>{message}</Disclaimer>}
    <Panel title="Possíveis disparidades detectadas" subtitle="Uma diferença observada é um sinal para investigação, não uma conclusão." action={<div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-64 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar alerta" /></div>}>
      {visible.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum alerta de disparidade encontrado.</p> : <div className="grid gap-4 xl:grid-cols-2">{visible.map((alert) => { const severity = alert.confidence >= 80 ? "Alta" : alert.confidence >= 50 ? "Média" : "Baixa"; return <article key={alert.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-warning" />Possível disparidade detectada</h3><p className="mt-1 text-sm">{alert.title}</p></div><StatusPill tone={severity === "Alta" ? "danger" : severity === "Média" ? "warning" : "info"}>{severity}</StatusPill></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><Entry label="Métrica" value={alert.title} /><Entry label="Período" value={alert.eventDate} /><Entry label="Área" value={alert.region} /><Entry label="Status" value={alert.status} /></dl><p className="mt-4 rounded-lg border border-warning/25 bg-warning/5 p-3 text-xs text-muted-foreground">Não utilize este indicador isoladamente para decisões individuais.</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setOpened((current) => current === alert.id ? null : alert.id)}>{opened === alert.id ? "Fechar análise" : "Ver análise"}</Button><Button size="sm" onClick={() => requestReview(alert)}><ShieldCheck className="size-4" />Solicitar revisão</Button><Button asChild size="sm" variant="secondary"><Link to="/org/lumia"><Bot className="size-4" />Consultar LumIA</Link></Button></div>{opened === alert.id && <div className="mt-5 border-t pt-5"><p className="text-sm font-semibold">Diferença observada</p><p className="mt-2 text-sm text-muted-foreground">{alert.details || "O registro não possui detalhes adicionais."}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border p-3 text-xs"><span className="text-muted-foreground">Nível de severidade</span><strong className="mt-1 block">{severity} ({alert.confidence}%)</strong></div><div className="rounded-lg border p-3 text-xs"><span className="text-muted-foreground">Orientação</span><strong className="mt-1 block">Necessita avaliação contextual</strong></div></div></div>}</article>; })}</div>}
    </Panel><Disclaimer>Uma disparidade estatística não determina causalidade nem comprova discriminação. O agente deve considerar qualidade dos dados, contexto e revisão humana antes de agir.</Disclaimer>
  </div>;
}

function Entry({ label, value }: { label: string; value: string }) { return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1">{value}</dd></div>; }
