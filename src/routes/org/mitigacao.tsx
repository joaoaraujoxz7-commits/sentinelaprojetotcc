import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, Search, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Disclaimer, PageHeader, Panel, StatCard, StatusPill } from "@/components/sentinela/ui-kit";
import { addRecordFn, listRecordsFn, updateRecordFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/org/mitigacao")({ component: Mitigacao });

const stages = ["Problema identificado", "Investigação", "Medida definida", "Implementação", "Validação", "Monitoramento pós-correção", "Concluído"];
const measures = ["Revisão dos dados", "Atualização do modelo", "Recalibração", "Revisão de parâmetros", "Aumento do monitoramento", "Revisão humana obrigatória", "Suspensão temporária do modelo"];
const detailField = (text: string, label: string) => text.match(new RegExp(`${label}:\\s*([^;\\n]+)`, "i"))?.[1]?.trim() ?? "Não informado";

function Mitigacao() {
  const [plans, setPlans] = useState<ManagedRecord[]>([]);
  const [audits, setAudits] = useState<ManagedRecord[]>([]);
  const [alerts, setAlerts] = useState<ManagedRecord[]>([]);
  const [quality, setQuality] = useState<ManagedRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ problem: "", evidence: "", impact: "Médio", measure: measures[0], responsible: "", deadline: "", region: "Abrangência nacional", details: "" });

  async function load() {
    const [mitigations, auditRows, biasRows, qualityRows] = await Promise.all([
      listRecordsFn({ data: { kind: "mitigations" } }), listRecordsFn({ data: { kind: "audits" } }),
      listRecordsFn({ data: { kind: "bias_alerts" } }), listRecordsFn({ data: { kind: "data_quality" } }),
    ]);
    setPlans(mitigations); setAudits(auditRows); setAlerts(biasRows); setQuality(qualityRows);
  }
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => plans.filter((plan) => {
    const matchesSearch = `${plan.title} ${plan.region} ${plan.details}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
    return matchesSearch && (statusFilter === "Todos" || plan.status === statusFilter);
  }), [plans, search, statusFilter]);
  const active = plans.filter((plan) => !/conclu/i.test(plan.status));
  const overdue = active.filter((plan) => { const deadline = detailField(plan.details, "Prazo"); return /^\d{4}-\d{2}-\d{2}$/.test(deadline) && new Date(`${deadline}T23:59:59`).getTime() < Date.now(); });
  const monitoring = plans.filter((plan) => /monitoramento/i.test(plan.status)).length;
  const completed = plans.filter((plan) => /conclu/i.test(plan.status)).length;

  async function savePlan(event: React.FormEvent) {
    event.preventDefault();
    if (!form.problem.trim() || !form.evidence.trim() || !form.responsible.trim() || !form.deadline) return setMessage("Informe problema, evidências, responsável e prazo.");
    const instant = new Date();
    await addRecordFn({ data: { kind: "mitigations", record: {
      title: form.problem, region: form.region, eventDate: instant.toISOString().slice(0, 10), eventTime: instant.toTimeString().slice(0, 5),
      source: "Auditoria e governança", status: "Problema identificado", confidence: form.impact === "Crítico" ? 100 : form.impact === "Alto" ? 80 : form.impact === "Médio" ? 55 : 30,
      details: `Evidências: ${form.evidence}; Impacto: ${form.impact}; Medida corretiva: ${form.measure}; Responsável: ${form.responsible}; Prazo: ${form.deadline}; Observações: ${form.details || "Nenhuma"}`,
    } } });
    setForm({ problem: "", evidence: "", impact: "Médio", measure: measures[0], responsible: "", deadline: "", region: "Abrangência nacional", details: "" });
    setShowForm(false); setMessage("Plano de mitigação registrado e pronto para acompanhamento."); await load();
  }

  async function advance(plan: ManagedRecord) {
    const current = Math.max(0, stages.indexOf(plan.status));
    const next = stages[Math.min(current + 1, stages.length - 1)];
    await updateRecordFn({ data: { kind: "mitigations", id: plan.id, status: next } });
    if (next === "Monitoramento pós-correção") {
      const instant = new Date();
      await addRecordFn({ data: { kind: "audits", record: { title: `Validação da mitigação: ${plan.title}`, region: plan.region, eventDate: instant.toISOString().slice(0, 10), eventTime: instant.toTimeString().slice(0, 5), source: "Plano de Mitigação", status: "Monitoramento", confidence: plan.confidence, details: `Validação vinculada ao plano ${plan.id}. ${plan.details}` } } });
    }
    setMessage(`Plano avançou para: ${next}.`); await load();
  }

  return <div className="space-y-5">
    <PageHeader title="Plano de Mitigação" description="Transforme problemas identificados em medidas corretivas rastreáveis, validadas e monitoradas." action={<Button onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar formulário" : "Criar plano de mitigação"}</Button>} />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Planos ativos" value={String(active.length)} tone={active.length ? "warning" : "success"} /><StatCard label="Prazos vencidos" value={String(overdue.length)} tone={overdue.length ? "danger" : "success"} /><StatCard label="Em monitoramento" value={String(monitoring)} /><StatCard label="Correções concluídas" value={String(completed)} tone="success" /></div>

    <Panel title="Origem dos problemas" subtitle="Registros existentes que podem exigir investigação e correção."><div className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border p-4"><p className="text-xs uppercase text-muted-foreground">Alertas de possível disparidade</p><p className="mt-2 text-2xl font-semibold text-warning">{alerts.filter((item) => !/conclu|encerr/i.test(item.status)).length}</p><Button asChild variant="link" className="mt-2 h-auto p-0"><Link to="/org/equidade">Abrir monitoramento</Link></Button></div><div className="rounded-lg border p-4"><p className="text-xs uppercase text-muted-foreground">Problemas de qualidade</p><p className="mt-2 text-2xl font-semibold text-warning">{quality.filter((item) => !/conclu/i.test(item.status)).length}</p><Button asChild variant="link" className="mt-2 h-auto p-0"><Link to="/org/qualidade-dados">Investigar dados</Link></Button></div><div className="rounded-lg border p-4"><p className="text-xs uppercase text-muted-foreground">Auditorias em aberto</p><p className="mt-2 text-2xl font-semibold">{audits.filter((item) => !/conclu|registrad/i.test(item.status)).length}</p><Button asChild variant="link" className="mt-2 h-auto p-0"><Link to="/org/auditoria">Abrir auditoria</Link></Button></div></div></Panel>

    {showForm && <Panel title="Novo plano de mitigação" subtitle="A medida não deve ser aplicada automaticamente sem avaliação humana."><form className="grid gap-4 md:grid-cols-2" onSubmit={savePlan}><div className="md:col-span-2"><Label>Problema identificado</Label><Input className="mt-2" value={form.problem} onChange={(event) => setForm({ ...form, problem: event.target.value })} placeholder="Ex.: Disparidade persistente na taxa de falsos positivos" /></div><div className="md:col-span-2"><Label>Evidências</Label><Textarea className="mt-2" value={form.evidence} onChange={(event) => setForm({ ...form, evidence: event.target.value })} placeholder="Informe métricas, auditorias ou verificações que sustentam a investigação." /></div><div><Label>Impacto</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.impact} onChange={(event) => setForm({ ...form, impact: event.target.value })}><option>Baixo</option><option>Médio</option><option>Alto</option><option>Crítico</option></select></div><div><Label>Medida corretiva</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.measure} onChange={(event) => setForm({ ...form, measure: event.target.value })}>{measures.map((measure) => <option key={measure}>{measure}</option>)}</select></div><div><Label>Responsável</Label><Input className="mt-2" value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} placeholder="Nome ou equipe responsável" /></div><div><Label>Prazo</Label><Input className="mt-2" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></div><div><Label>Área / abrangência</Label><Input className="mt-2" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} /></div><div className="md:col-span-2"><Label>Observações e critérios de validação</Label><Textarea className="mt-2" value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="Defina como será verificado se a medida reduziu o problema." /></div><Button type="submit" className="w-fit">Registrar plano</Button></form></Panel>}

    {message && <Disclaimer>{message}</Disclaimer>}

    <Panel title="Planos registrados" subtitle="Avance cada plano somente após concluir e documentar a etapa atual." action={<div className="flex flex-wrap gap-2"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-60 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar plano" /></div></div>}>
      {visible.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum plano de mitigação encontrado.</p> : <div className="grid gap-4 xl:grid-cols-2">{visible.map((plan) => { const step = Math.max(0, stages.indexOf(plan.status)); const deadline = detailField(plan.details, "Prazo"); const isOverdue = !/conclu/i.test(plan.status) && /^\d{4}-\d{2}-\d{2}$/.test(deadline) && new Date(`${deadline}T23:59:59`).getTime() < Date.now(); return <article key={plan.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{plan.title}</h3><p className="mt-1 text-xs text-muted-foreground">{plan.region} · criado em {plan.eventDate}</p></div><StatusPill tone={/conclu/i.test(plan.status) ? "success" : isOverdue ? "danger" : "warning"}>{plan.status}</StatusPill></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><Info icon={AlertTriangle} label="Impacto" value={detailField(plan.details, "Impacto")} /><Info icon={UserRound} label="Responsável" value={detailField(plan.details, "Responsável")} /><Info icon={CalendarClock} label="Prazo" value={deadline} warning={isOverdue} /><Info icon={ShieldCheck} label="Medida" value={detailField(plan.details, "Medida corretiva")} /></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round(step / (stages.length - 1) * 100)}%` }} /></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setOpened((current) => current === plan.id ? null : plan.id)}>{opened === plan.id ? "Fechar detalhes" : "Ver plano e timeline"}</Button>{step < stages.length - 1 && <Button size="sm" onClick={() => advance(plan)}>Avançar para {stages[step + 1]}<ChevronRight className="size-4" /></Button>}</div>{opened === plan.id && <div className="mt-5 border-t pt-5"><dl className="grid gap-3 text-sm"><Detail label="Evidências" value={detailField(plan.details, "Evidências")} /><Detail label="Impacto" value={detailField(plan.details, "Impacto")} /><Detail label="Medida corretiva" value={detailField(plan.details, "Medida corretiva")} /><Detail label="Responsável" value={detailField(plan.details, "Responsável")} /><Detail label="Prazo" value={deadline} /><Detail label="Observações" value={detailField(plan.details, "Observações")} /></dl><p className="mb-3 mt-6 text-sm font-semibold">Evolução da mitigação</p><ol className="space-y-0">{stages.slice(0, -1).map((stage, index) => <li key={stage} className="flex gap-3"><div className="flex flex-col items-center"><span className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${index <= step ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{index < step ? <CheckCircle2 className="size-3" /> : index + 1}</span>{index < stages.length - 2 && <span className={`h-7 w-px ${index < step ? "bg-primary" : "bg-border"}`} />}</div><p className={`text-sm ${index <= step ? "text-foreground" : "text-muted-foreground"}`}>{stage}</p></li>)}</ol></div>}</article>; })}</div>}
    </Panel>
    <Disclaimer>A mitigação deve ser proporcional ao problema, possuir evidências, responsável, prazo e critério de validação. Suspensões ou alterações de modelos exigem autorização humana e registro de auditoria.</Disclaimer>
  </div>;
}

function Info({ icon: Icon, label, value, warning }: { icon: typeof AlertTriangle; label: string; value: string; warning?: boolean }) { return <div><dt className="flex items-center gap-1.5 text-muted-foreground"><Icon className="size-3.5" />{label}</dt><dd className={`mt-1 ${warning ? "text-destructive" : ""}`}>{value}</dd></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="grid gap-1 border-b pb-3 md:grid-cols-[180px_1fr]"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>; }
