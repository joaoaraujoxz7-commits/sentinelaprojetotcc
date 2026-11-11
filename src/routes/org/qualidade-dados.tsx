import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Copy, Database, FileWarning, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Disclaimer, PageHeader, Panel, StatCard, StatusPill } from "@/components/sentinela/ui-kit";
import { addRecordFn, listRecordsFn, updateRecordFn, type ManagedRecord, type RecordKind } from "@/lib/records";

export const Route = createFileRoute("/org/qualidade-dados")({ component: QualidadeDados });

const analyzedKinds: RecordKind[] = ["occurrences", "predictions", "contests"];
const normalized = (value: string) => value.trim().toLocaleLowerCase("pt-BR");
const percent = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;

function QualidadeDados() {
  const [records, setRecords] = useState<Record<string, ManagedRecord[]>>({});
  const [period, setPeriod] = useState("365");
  const [sourceFilter, setSourceFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showLimits, setShowLimits] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ source: "", period: "Últimos 12 meses", issue: "Dados incompletos", quantity: "", confidence: "70", details: "" });

  async function load() {
    const kinds: RecordKind[] = [...analyzedKinds, "data_quality"];
    const loaded = await Promise.all(kinds.map(async (kind) => [kind, await listRecordsFn({ data: { kind } })] as const));
    setRecords(Object.fromEntries(loaded));
  }
  useEffect(() => { void load(); }, []);

  const raw = useMemo(() => analyzedKinds.flatMap((kind) => (records[kind] ?? []).map((record) => ({ ...record, kind }))), [records]);
  const availableSources = useMemo(() => [...new Set(raw.map((item) => item.source).filter(Boolean))].sort(), [raw]);
  const filtered = useMemo(() => {
    const limit = Date.now() - Number(period) * 86400000;
    return raw.filter((item) => {
      const date = new Date(`${item.eventDate}T12:00:00`).getTime();
      return (Number.isNaN(date) || date >= limit) && (sourceFilter === "Todas" || item.source === sourceFilter);
    });
  }, [raw, period, sourceFilter]);

  const analysis = useMemo(() => {
    const incomplete = filtered.filter((item) => !item.title.trim() || !item.region.trim() || !item.eventDate || !item.source.trim() || !item.details.trim());
    const seen = new Set<string>();
    const duplicates = filtered.filter((item) => { const key = [item.title, item.region, item.eventDate, item.eventTime, item.source].map(normalized).join("|"); if (seen.has(key)) return true; seen.add(key); return false; });
    const staleLimit = Date.now() - 90 * 86400000;
    const stale = filtered.filter((item) => { const date = new Date(`${item.eventDate}T12:00:00`).getTime(); return !Number.isNaN(date) && date < staleLimit; });
    const complete = filtered.filter((item) => !incomplete.some((bad) => bad.id === item.id));
    return { complete, incomplete, duplicates, stale };
  }, [filtered]);

  const sources = useMemo(() => {
    const groups = new Map<string, ManagedRecord[]>();
    for (const item of filtered) groups.set(item.source, [...(groups.get(item.source) ?? []), item]);
    return [...groups].map(([source, items]) => {
      const complete = items.filter((item) => item.title.trim() && item.region.trim() && item.eventDate && item.details.trim()).length;
      const latest = [...items].sort((a, b) => b.eventDate.localeCompare(a.eventDate))[0]?.eventDate ?? "—";
      const confidence = Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length);
      return { source, quantity: items.length, completeness: percent(complete, items.length), latest, confidence };
    }).sort((a, b) => b.quantity - a.quantity);
  }, [filtered]);

  const checks = useMemo(() => (records.data_quality ?? []).filter((item) => `${item.title} ${item.region} ${item.details}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [records, search]);

  async function saveCheck(event: React.FormEvent) {
    event.preventDefault();
    if (!form.source.trim() || !form.quantity.trim()) return setMessage("Informe a fonte e a quantidade analisada.");
    const instant = new Date();
    await addRecordFn({ data: { kind: "data_quality", record: {
      title: `${form.issue} — ${form.source}`, region: form.source,
      eventDate: instant.toISOString().slice(0, 10), eventTime: instant.toTimeString().slice(0, 5),
      source: "Auditoria de dados", status: "Necessita análise", confidence: Math.max(0, Math.min(100, Number(form.confidence))),
      details: `Período: ${form.period}. Quantidade analisada: ${form.quantity}. ${form.details}`.trim(),
    } } });
    setForm({ source: "", period: "Últimos 12 meses", issue: "Dados incompletos", quantity: "", confidence: "70", details: "" });
    setShowForm(false); setMessage("Verificação registrada no histórico de qualidade."); await load();
  }

  async function finishCheck(item: ManagedRecord) {
    await updateRecordFn({ data: { kind: "data_quality", id: item.id, status: "Concluído" } });
    setMessage("Verificação marcada como concluída."); await load();
  }

  return <div className="space-y-5">
    <PageHeader title="Qualidade e origem dos dados" description="Avalie procedência, completude, atualização, duplicidade e confiabilidade antes de interpretar previsões." action={<Button onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar formulário" : "Registrar verificação"}</Button>} />

    <Panel title="Escopo da análise" subtitle="Os indicadores são calculados com ocorrências, previsões e contestações armazenadas no banco."><div className="grid gap-4 md:grid-cols-2"><div><Label>Período analisado</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Últimos 12 meses</option><option value="3650">Todo o histórico</option></select></div><div><Label>Fonte</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option>Todas</option>{availableSources.map((source) => <option key={source}>{source}</option>)}</select></div></div></Panel>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Dados completos" value={String(analysis.complete.length)} delta={`${percent(analysis.complete.length, filtered.length)}% dos registros`} hint="Registros com os campos essenciais preenchidos." tone="success" />
      <StatCard label="Dados incompletos" value={String(analysis.incomplete.length)} delta={`${percent(analysis.incomplete.length, filtered.length)}% dos registros`} hint="Ausência de título, região, data, fonte ou descrição." tone={analysis.incomplete.length ? "warning" : "success"} />
      <StatCard label="Possíveis duplicados" value={String(analysis.duplicates.length)} hint="Mesma combinação de tipo, região, data, horário e fonte." tone={analysis.duplicates.length ? "danger" : "success"} />
      <StatCard label="Dados desatualizados" value={String(analysis.stale.length)} hint="Registros do recorte atual com data superior a 90 dias." tone={analysis.stale.length ? "warning" : "success"} />
    </div>

    <Panel title="Fontes e qualidade agregada" subtitle="Confiabilidade é a média informada nos registros e não substitui a validação da procedência.">
      {sources.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum dado encontrado para os filtros selecionados.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Fonte</th><th className="px-3 py-3">Período mais recente</th><th className="px-3 py-3">Quantidade</th><th className="px-3 py-3">Completude</th><th className="px-3 py-3">Atualização</th><th className="px-3 py-3">Confiabilidade</th></tr></thead><tbody>{sources.map((item) => { const days = item.latest === "—" ? 999 : Math.floor((Date.now() - new Date(`${item.latest}T12:00:00`).getTime()) / 86400000); return <tr key={item.source} className="border-b border-border/70"><td className="px-3 py-4 font-medium"><span className="inline-flex items-center gap-2"><Database className="size-4 text-primary" />{item.source}</span></td><td className="px-3 py-4 text-muted-foreground">{item.latest}</td><td className="px-3 py-4">{item.quantity}</td><td className="px-3 py-4"><StatusPill tone={item.completeness >= 90 ? "success" : item.completeness >= 70 ? "warning" : "danger"}>{item.completeness}%</StatusPill></td><td className="px-3 py-4"><StatusPill tone={days <= 30 ? "success" : days <= 90 ? "warning" : "danger"}>{days <= 30 ? "Atual" : days <= 90 ? "Atenção" : "Desatualizada"}</StatusPill></td><td className="px-3 py-4">{item.confidence}%</td></tr>; })}</tbody></table></div>}
    </Panel>

    <div className="grid gap-4 lg:grid-cols-2"><Panel title="Diagnóstico automático" subtitle="Sinais encontrados no recorte atual; cada resultado precisa de confirmação humana."><div className="space-y-3">{[
      { icon: CheckCircle2, label: "Registros completos", value: analysis.complete.length, tone: "text-success" },
      { icon: FileWarning, label: "Campos essenciais ausentes", value: analysis.incomplete.length, tone: "text-warning" },
      { icon: Copy, label: "Combinações possivelmente duplicadas", value: analysis.duplicates.length, tone: "text-destructive" },
      { icon: Clock3, label: "Registros com mais de 90 dias", value: analysis.stale.length, tone: "text-warning" },
    ].map(({ icon: Icon, label, value, tone }) => <div key={label} className="flex items-center justify-between rounded-lg border p-3"><span className="flex items-center gap-3 text-sm"><Icon className={`size-4 ${tone}`} />{label}</span><strong>{value}</strong></div>)}</div></Panel>
    <Panel title="Impacto e limitações" subtitle="Qualidade insuficiente pode alterar métricas, mapas e previsões."><div className="space-y-3 text-sm text-muted-foreground"><p>Registros incompletos podem reduzir a explicabilidade e impedir validações posteriores.</p><p>Duplicidades podem aumentar artificialmente a concentração histórica de uma área.</p><p>Fontes desatualizadas podem não representar mudanças recentes no padrão de registros.</p><Button variant="secondary" onClick={() => setShowLimits((value) => !value)}>{showLimits ? "Ocultar limitações" : "Ver limitações dos dados"}</Button></div></Panel></div>

    {showLimits && <Panel title="Limitações conhecidas dos dados"><ul className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2"><li className="rounded-lg border p-3">Subnotificação: nem toda ocorrência é registrada nos sistemas disponíveis.</li><li className="rounded-lg border p-3">Cobertura desigual: regiões e fontes podem possuir volumes diferentes de registros.</li><li className="rounded-lg border p-3">Mudanças operacionais: alterações na fiscalização influenciam o histórico observado.</li><li className="rounded-lg border p-3">Erros de preenchimento: endereço, horário, tipo e status podem estar incompletos.</li><li className="rounded-lg border p-3">Defasagem temporal: integrações podem atualizar informações em momentos diferentes.</li><li className="rounded-lg border p-3">Dado não é previsão: volume histórico não determina acontecimentos futuros.</li></ul></Panel>}

    {showForm && <Panel title="Registrar verificação de qualidade" subtitle="Crie uma trilha persistente para problemas que precisam de análise."><form className="grid gap-4 md:grid-cols-2" onSubmit={saveCheck}><div><Label>Fonte analisada</Label><Input className="mt-2" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="Ex.: Registros da população" /></div><div><Label>Período</Label><Input className="mt-2" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} /></div><div><Label>Problema identificado</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })}><option>Dados incompletos</option><option>Dados duplicados</option><option>Dados desatualizados</option><option>Origem não verificada</option><option>Inconsistência de preenchimento</option><option>Cobertura desigual</option></select></div><div><Label>Quantidade analisada</Label><Input className="mt-2" type="number" min="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></div><div><Label>Confiabilidade da verificação (%)</Label><Input className="mt-2" type="number" min="0" max="100" value={form.confidence} onChange={(event) => setForm({ ...form, confidence: event.target.value })} /></div><div className="md:col-span-2"><Label>Evidências e observações</Label><Textarea className="mt-2" value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="Descreva a inconsistência, seu possível impacto e como foi verificada." /></div><Button className="w-fit" type="submit">Salvar verificação</Button></form></Panel>}

    {message && <Disclaimer>{message}</Disclaimer>}

    <Panel title="Histórico de verificações" subtitle="Registros realizados por auditores e armazenados no banco." action={<div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-64 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar verificação" /></div>}>
      {checks.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma verificação registrada.</p> : <div className="grid gap-3 lg:grid-cols-2">{checks.map((item) => <article key={item.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-xs text-muted-foreground">{item.eventDate} {item.eventTime} · {item.region}</p></div><StatusPill tone={/conclu/i.test(item.status) ? "success" : "warning"}>{item.status}</StatusPill></div><p className="mt-3 text-sm text-muted-foreground">{item.details}</p><div className="mt-4 flex flex-wrap gap-2">{!/conclu/i.test(item.status) && <Button size="sm" onClick={() => finishCheck(item)}>Concluir verificação</Button>}<Button asChild size="sm" variant="secondary"><Link to="/org/mitigacao"><AlertTriangle className="size-4" />Abrir Plano de Mitigação</Link></Button></div></article>)}</div>}
    </Panel>
    <Disclaimer>Dados históricos podem refletir padrões de registro e fiscalização, e não necessariamente a distribuição real das ocorrências. Estes indicadores auxiliam a auditoria, mas não determinam causalidade nem autorizam decisões individuais.</Disclaimer>
  </div>;
}
