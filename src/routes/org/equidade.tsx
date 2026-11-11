import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Database, Scale, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Disclaimer, PageHeader, Panel, StatCard, StatusPill } from "@/components/sentinela/ui-kit";
import { addRecordFn, listRecordsFn, updateRecordFn, type ManagedRecord, type RecordKind } from "@/lib/records";

export const Route = createFileRoute("/org/equidade")({ component: Equidade });

const kinds: RecordKind[] = ["occurrences", "predictions", "audits", "contests", "mitigations", "bias_alerts"];
const pct = (part: number, total: number) => total ? Math.round((part / total) * 100) : 0;
const matches = (record: ManagedRecord, expression: RegExp) => expression.test(`${record.title} ${record.status} ${record.details}`);

function Equidade() {
  const [records, setRecords] = useState<Record<RecordKind, ManagedRecord[]>>({} as Record<RecordKind, ManagedRecord[]>);
  const [period, setPeriod] = useState("90");
  const [region, setRegion] = useState("Todas");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<ManagedRecord | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ metric: "Taxa de revisão", region: "", difference: "", severity: "Média", details: "" });

  async function load() {
    const result = await Promise.all(kinds.map(async (kind) => [kind, await listRecordsFn({ data: { kind } })] as const));
    setRecords(Object.fromEntries(result) as Record<RecordKind, ManagedRecord[]>);
  }

  useEffect(() => { void load(); }, []);

  const all = useMemo(() => kinds.flatMap((kind) => records[kind] ?? []), [records]);
  const regions = useMemo(() => [...new Set(all.map((item) => item.region).filter(Boolean))].sort(), [all]);
  const filter = (kind: RecordKind, applyRegion = true) => {
    const limit = Date.now() - Number(period) * 86400000;
    return (records[kind] ?? []).filter((item) => {
      const date = new Date(`${item.eventDate || item.createdAt}T${item.eventTime || "00:00"}`).getTime();
      return (Number.isNaN(date) || date >= limit) && (!applyRegion || region === "Todas" || item.region === region);
    });
  };

  const calculate = (applyRegion: boolean) => {
    const predictions = filter("predictions", applyRegion);
    const occurrences = filter("occurrences", applyRegion);
    const audits = filter("audits", applyRegion);
    const contests = filter("contests", applyRegion);
    const mitigations = filter("mitigations", applyRegion);
    const falsePositives = predictions.filter((r) => matches(r, /falso positivo/i)).length;
    const falseNegatives = predictions.filter((r) => matches(r, /falso negativo/i)).length;
    const reviewed = predictions.filter((r) => matches(r, /revis|conclu|confirm|valid/i)).length;
    const confirmed = occurrences.filter((r) => matches(r, /confirm|valid|encerr/i)).length;
    return { falsePositives, falseNegatives, precision: pct(Math.max(0, reviewed - falsePositives), reviewed), recall: pct(confirmed, confirmed + falseNegatives), reviewRate: pct(reviewed, predictions.length), contestRate: pct(contests.length, Math.max(predictions.length, occurrences.length)), correctionRate: pct(mitigations.length, audits.length), sample: predictions.length + occurrences.length };
  };

  const metrics = useMemo(() => calculate(true), [records, period, region]); // eslint-disable-line react-hooks/exhaustive-deps
  const general = useMemo(() => region === "Todas" ? null : calculate(false), [records, period, region]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveAlert(event: React.FormEvent) {
    event.preventDefault();
    if (!form.region.trim() || !form.difference.trim()) return setMessage("Informe a área e a diferença observada.");
    const instant = new Date();
    await addRecordFn({ data: { kind: "bias_alerts", record: { title: `${form.metric} — ${form.region}`, region: form.region, eventDate: instant.toISOString().slice(0, 10), eventTime: instant.toTimeString().slice(0, 5), source: "Monitoramento agregado", status: "Necessita investigação", confidence: form.severity === "Alta" ? 90 : form.severity === "Média" ? 60 : 30, details: `Diferença observada: ${form.difference}. Severidade: ${form.severity}. ${form.details}`.trim() } } });
    setForm({ metric: "Taxa de revisão", region: "", difference: "", severity: "Média", details: "" });
    setShowForm(false); setMessage("Possível disparidade registrada para investigação."); await load();
  }

  async function openAudit() {
    if (!selected) return;
    const instant = new Date();
    await addRecordFn({ data: { kind: "audits", record: { title: `Investigação de equidade: ${selected.title}`, region: selected.region, eventDate: instant.toISOString().slice(0, 10), eventTime: instant.toTimeString().slice(0, 5), source: "Monitoramento de Equidade", status: "Em investigação", confidence: selected.confidence, details: `Auditoria aberta a partir do alerta agregado ${selected.id}. ${selected.details}` } } });
    await updateRecordFn({ data: { kind: "bias_alerts", id: selected.id, status: "Em investigação" } });
    setMessage("Auditoria aberta e alerta colocado em investigação."); await load();
    setSelected({ ...selected, status: "Em investigação" });
  }

  const alerts = records.bias_alerts ?? [];
  return <div className="space-y-5">
    <PageHeader title="Monitoramento de Equidade" description="Compare métricas agregadas por período e região e investigue diferenças que mereçam revisão humana." action={<Button onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar formulário" : "Registrar possível disparidade"}</Button>} />
    <Panel title="Filtros da análise" subtitle="Os indicadores são recalculados com os registros do banco."><div className="grid gap-4 md:grid-cols-2"><div><Label>Período</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Últimos 12 meses</option></select></div><div><Label>Região comparada</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={region} onChange={(e) => setRegion(e.target.value)}><option>Todas</option>{regions.map((item) => <option key={item}>{item}</option>)}</select></div></div></Panel>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Falsos positivos registrados" value={String(metrics.falsePositives)} hint="Previsões explicitamente revisadas como falso positivo." tone={metrics.falsePositives ? "warning" : "success"} />
      <StatCard label="Falsos negativos registrados" value={String(metrics.falseNegatives)} hint="Previsões explicitamente revisadas como falso negativo." tone={metrics.falseNegatives ? "warning" : "success"} />
      <StatCard label="Precisão após revisão" value={`${metrics.precision}%`} hint="Revisões sem marcação de falso positivo." />
      <StatCard label="Recall observado" value={`${metrics.recall}%`} hint="Confirmadas em relação às confirmadas e falsos negativos." />
      <StatCard label="Taxa de revisão" value={`${metrics.reviewRate}%`} hint="Previsões revisadas, validadas ou concluídas." />
      <StatCard label="Taxa de contestação" value={`${metrics.contestRate}%`} hint="Contestações em relação aos registros analisados." tone={metrics.contestRate > 20 ? "warning" : "default"} />
      <StatCard label="Taxa de correção" value={`${metrics.correctionRate}%`} hint="Mitigações em relação às auditorias." />
      <StatCard label="Amostra agregada" value={String(metrics.sample)} hint="Previsões e ocorrências consideradas." />
    </div>
    {general && <Panel title="Comparação entre região e média geral" subtitle="Uma diferença sinaliza necessidade de análise; não demonstra discriminação."><div className="space-y-5">{[["Taxa de revisão", general.reviewRate, metrics.reviewRate], ["Taxa de contestação", general.contestRate, metrics.contestRate]].map(([label, overall, local]) => <div key={String(label)}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-muted-foreground">Geral: {overall}% · {region}: {local}%</span></div><div className="space-y-2"><div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-muted-foreground" style={{ width: `${Math.min(100, Number(overall))}%` }} /></div><div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, Number(local))}%` }} /></div></div></div>)}</div></Panel>}
    {showForm && <Panel title="Registrar possível disparidade" subtitle="Registre somente diferenças observadas em dados agregados e anonimizados."><form className="grid gap-4 md:grid-cols-2" onSubmit={saveAlert}><div><Label>Métrica</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>{["Falsos positivos", "Falsos negativos", "Precisão", "Recall", "Taxa de revisão", "Taxa de contestação", "Taxa de correção"].map((item) => <option key={item}>{item}</option>)}</select></div><div><Label>Área / região</Label><Input className="mt-2" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Estado, município ou região agregada" /></div><div><Label>Diferença observada</Label><Input className="mt-2" value={form.difference} onChange={(e) => setForm({ ...form, difference: e.target.value })} placeholder="Ex.: 12 pontos acima da média geral" /></div><div><Label>Severidade inicial</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}><option>Baixa</option><option>Média</option><option>Alta</option></select></div><div className="md:col-span-2"><Label>Contexto da análise</Label><Textarea className="mt-2" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Período comparado, tamanho da amostra e contexto conhecido." /></div><Button className="w-fit" type="submit">Registrar para investigação</Button></form></Panel>}
    {message && <Disclaimer>{message}</Disclaimer>}
    <Panel title="Disparidades registradas" subtitle="Selecione um registro para consultar o contexto e iniciar a investigação.">{alerts.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma possível disparidade foi registrada.</p> : <div className="grid gap-3 lg:grid-cols-2">{alerts.map((alert) => <button type="button" key={alert.id} onClick={() => setSelected(alert)} className="rounded-xl border border-border bg-background/30 p-4 text-left transition hover:border-primary/50"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{alert.title}</p><p className="mt-1 text-xs text-muted-foreground">{alert.region} · {alert.eventDate} {alert.eventTime}</p></div><StatusPill tone={/investiga/i.test(alert.status) ? "warning" : /conclu/i.test(alert.status) ? "success" : "info"}>{alert.status}</StatusPill></div><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{alert.details}</p></button>)}</div>}</Panel>
    {selected && <Panel title={`Investigar: ${selected.title}`} subtitle={`${selected.region} · gravidade ${selected.confidence >= 80 ? "alta" : selected.confidence >= 50 ? "média" : "baixa"}`} action={<Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Fechar</Button>}><p className="mb-5 text-sm text-muted-foreground">{selected.details}</p><p className="mb-3 text-sm font-semibold">Possíveis explicações que devem ser verificadas</p><div className="mb-5 grid gap-3 md:grid-cols-3"><div className="rounded-lg border p-3 text-sm"><Database className="mb-2 size-4 text-primary" />Qualidade, cobertura ou quantidade desigual dos dados</div><div className="rounded-lg border p-3 text-sm"><BarChart3 className="mb-2 size-4 text-primary" />Mudanças temporais, de registro ou de fiscalização</div><div className="rounded-lg border p-3 text-sm"><Scale className="mb-2 size-4 text-primary" />Comportamento do modelo e critérios de decisão</div></div><div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link to="/org/qualidade-dados"><Database className="size-4" />Investigar dados</Link></Button><Button asChild variant="secondary"><Link to="/org/governanca-modelos"><ShieldCheck className="size-4" />Comparar modelos</Link></Button><Button asChild variant="secondary"><Link to="/org/mitigacao"><AlertTriangle className="size-4" />Planejar mitigação</Link></Button><Button onClick={openAudit}>Abrir auditoria</Button></div></Panel>}
    <Disclaimer>Esta análise identifica diferenças que precisam de investigação; não estabelece causalidade nem prova discriminação. Características raciais ou étnicas não são usadas em previsões individuais. Eventuais dados de grupos protegidos devem permanecer agregados, anonimizados e restritos à auditoria.</Disclaimer>
  </div>;
}
