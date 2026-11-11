import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, History, PauseCircle, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfidenceBar, Disclaimer, PageHeader, Panel, StatCard, StatusPill } from "@/components/sentinela/ui-kit";
import { addRecordFn, listRecordsFn, updateRecordFn, type ManagedRecord, type RecordKind } from "@/lib/records";

export const Route = createFileRoute("/org/governanca-modelos")({ component: GovernancaModelos });

type Data = Record<"models" | "predictions" | "audits" | "bias_alerts" | "contests", ManagedRecord[]>;
const empty: Data = { models: [], predictions: [], audits: [], bias_alerts: [], contests: [] };
const field = (details: string, name: string) => details.match(new RegExp(`${name}:\\s*([^.;\\n]+)`, "i"))?.[1]?.trim() ?? "Não informado";
const includesModel = (record: ManagedRecord, model: ManagedRecord) => `${record.title} ${record.source} ${record.details}`.toLocaleLowerCase("pt-BR").includes(model.title.toLocaleLowerCase("pt-BR"));
const pct = (part: number, total: number) => total ? Math.round(part / total * 100) : 0;

function GovernancaModelos() {
  const [data, setData] = useState<Data>(empty);
  const [showForm, setShowForm] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const [historyName, setHistoryName] = useState<string | null>(null);
  const [compared, setCompared] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", version: "", updateDate: "", nextAudit: "", status: "Em validação", performance: "", stability: "", details: "" });

  async function load() {
    const kinds = Object.keys(empty) as Array<keyof Data>;
    const result = await Promise.all(kinds.map((kind) => listRecordsFn({ data: { kind: kind as RecordKind } })));
    setData(Object.fromEntries(kinds.map((kind, index) => [kind, result[index]])) as Data);
  }
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => data.models.filter((model) => `${model.title} ${model.status} ${model.details}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [data.models, search]);
  const active = data.models.filter((model) => !/suspens|inativ/i.test(model.status)).length;
  const alerts = data.bias_alerts.filter((alert) => !/conclu|encerr|corrigid/i.test(alert.status)).length;
  const average = data.models.length ? Math.round(data.models.reduce((sum, model) => sum + model.confidence, 0) / data.models.length) : 0;

  function metrics(model: ManagedRecord) {
    const predictions = data.predictions.filter((record) => includesModel(record, model));
    const reviewed = predictions.filter((record) => /revis|conclu|confirm|valid/i.test(record.status)).length;
    const falsePositives = predictions.filter((record) => /falso positivo/i.test(`${record.status} ${record.details}`)).length;
    const falseNegatives = predictions.filter((record) => /falso negativo/i.test(`${record.status} ${record.details}`)).length;
    const modelAlerts = data.bias_alerts.filter((record) => includesModel(record, model)).length;
    return { predictions: predictions.length, precision: pct(Math.max(0, reviewed - falsePositives), reviewed), falsePositives, falseNegatives, stability: Number(field(model.details, "Estabilidade").replace("%", "")) || model.confidence, disparity: modelAlerts, reviews: reviewed, contestRate: pct(data.contests.filter((record) => includesModel(record, model)).length, predictions.length) };
  }

  async function saveModel(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.version.trim() || !form.updateDate || !form.nextAudit) return setMessage("Preencha nome, versão e datas de atualização e próxima auditoria.");
    await addRecordFn({ data: { kind: "models", record: { title: form.name, region: "Abrangência nacional", eventDate: form.updateDate, eventTime: "", source: "Governança de modelos", status: form.status, confidence: Math.max(0, Math.min(100, Number(form.performance))), details: `Versão: ${form.version}. Próxima auditoria: ${form.nextAudit}. Estabilidade: ${form.stability || "0"}%. ${form.details}`.trim() } } });
    setForm({ name: "", version: "", updateDate: "", nextAudit: "", status: "Em validação", performance: "", stability: "", details: "" });
    setShowForm(false); setMessage("Versão do modelo registrada no banco."); await load();
  }

  async function auditModel(model: ManagedRecord) {
    const instant = new Date();
    await addRecordFn({ data: { kind: "audits", record: { title: `Auditoria do modelo ${model.title} ${field(model.details, "Versão")}`, region: model.region, eventDate: instant.toISOString().slice(0, 10), eventTime: instant.toTimeString().slice(0, 5), source: "Governança de modelos", status: "Em andamento", confidence: model.confidence, details: `Auditoria vinculada ao modelo ${model.id}. Verificar desempenho, estabilidade, falsos positivos, falsos negativos, disparidades, revisões e contestações.` } } });
    setMessage(`Auditoria de ${model.title} aberta na Central de Auditoria.`); await load();
  }

  async function suspend(model: ManagedRecord) {
    await updateRecordFn({ data: { kind: "models", id: model.id, status: "Suspenso para revisão" } });
    setMessage(`${model.title} foi suspenso para revisão humana.`); await load();
  }

  function toggleCompare(id: string) {
    setCompared((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
    if (!compared.includes(id) && compared.length >= 3) setMessage("Compare no máximo três modelos por vez.");
  }

  const selectedModels = data.models.filter((model) => compared.includes(model.id));
  return <div className="space-y-5">
    <PageHeader title="Governança dos Modelos" description="Controle versões, desempenho, auditorias, alertas e situação operacional dos modelos utilizados pelo Sentinela." action={<Button onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar formulário" : "Cadastrar versão"}</Button>} />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Modelos cadastrados" value={String(data.models.length)} /><StatCard label="Em operação ou validação" value={String(active)} tone="success" /><StatCard label="Desempenho médio" value={`${average}%`} hint="Média do índice informado nas versões cadastradas." /><StatCard label="Alertas ativos" value={String(alerts)} tone={alerts ? "warning" : "success"} /></div>

    {showForm && <Panel title="Cadastrar nova versão" subtitle="Toda alteração de versão permanece registrada no histórico."><form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={saveModel}><div><Label>Nome do modelo</Label><Input className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: LumIA Risco Regional" /></div><div><Label>Versão</Label><Input className="mt-2" value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} placeholder="Ex.: 2.1.0" /></div><div><Label>Data de atualização</Label><Input className="mt-2" type="date" value={form.updateDate} onChange={(event) => setForm({ ...form, updateDate: event.target.value })} /></div><div><Label>Próxima auditoria</Label><Input className="mt-2" type="date" value={form.nextAudit} onChange={(event) => setForm({ ...form, nextAudit: event.target.value })} /></div><div><Label>Status operacional</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Em validação</option><option>Ativo</option><option>Monitoramento reforçado</option><option>Suspenso</option></select></div><div><Label>Índice de desempenho (%)</Label><Input className="mt-2" type="number" min="0" max="100" value={form.performance} onChange={(event) => setForm({ ...form, performance: event.target.value })} /></div><div><Label>Estabilidade (%)</Label><Input className="mt-2" type="number" min="0" max="100" value={form.stability} onChange={(event) => setForm({ ...form, stability: event.target.value })} /></div><div className="md:col-span-2 xl:col-span-4"><Label>Alterações, finalidade e limitações</Label><Textarea className="mt-2" value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="Descreva mudanças em relação à versão anterior, dados utilizados e limitações conhecidas." /></div><Button type="submit" className="w-fit xl:col-span-4">Salvar versão</Button></form></Panel>}

    {message && <Disclaimer>{message}</Disclaimer>}

    <Panel title="Modelos monitorados" subtitle="Selecione até três versões para comparar." action={<div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-64 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar modelo ou versão" /></div>}>
      {visible.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum modelo cadastrado.</p> : <div className="grid gap-4 xl:grid-cols-2">{visible.map((model) => { const modelMetrics = metrics(model); const suspended = /suspens|inativ/i.test(model.status); const modelAudits = data.audits.filter((record) => includesModel(record, model)).sort((a, b) => b.eventDate.localeCompare(a.eventDate)); return <article key={model.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{model.title}</h3><p className="mt-1 text-xs text-muted-foreground">Versão {field(model.details, "Versão")} · atualizada em {model.eventDate}</p></div><StatusPill tone={suspended ? "danger" : /valida|monitor/i.test(model.status) ? "warning" : "success"}>{model.status}</StatusPill></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Última auditoria</dt><dd>{modelAudits[0]?.eventDate ?? "Não realizada"}</dd></div><div><dt className="text-muted-foreground">Próxima auditoria</dt><dd>{field(model.details, "Próxima auditoria")}</dd></div><div><dt className="text-muted-foreground">Previsões vinculadas</dt><dd>{modelMetrics.predictions}</dd></div><div><dt className="text-muted-foreground">Alertas vinculados</dt><dd className={modelMetrics.disparity ? "text-warning" : ""}>{modelMetrics.disparity}</dd></div></dl><div className="mt-4"><ConfidenceBar value={model.confidence} label="Índice de desempenho informado" /></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setOpened((current) => current === model.id ? null : model.id)}>Ver versão</Button><Button size="sm" variant="secondary" onClick={() => setHistoryName((current) => current === model.title ? null : model.title)}><History className="size-4" />Ver histórico</Button><Button size="sm" onClick={() => auditModel(model)}><ShieldCheck className="size-4" />Auditar</Button>{!suspended && <Button size="sm" variant="secondary" onClick={() => suspend(model)}><PauseCircle className="size-4" />Suspender</Button>}<Button size="sm" variant={compared.includes(model.id) ? "default" : "secondary"} onClick={() => toggleCompare(model.id)}><GitCompareArrows className="size-4" />{compared.includes(model.id) ? "Selecionado" : "Comparar"}</Button></div>{opened === model.id && <div className="mt-4 border-t pt-4"><p className="text-sm text-muted-foreground">{model.details}</p><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Small label="Precisão revisada" value={`${modelMetrics.precision}%`} /><Small label="Estabilidade" value={`${modelMetrics.stability}%`} /><Small label="Falsos positivos" value={String(modelMetrics.falsePositives)} /><Small label="Falsos negativos" value={String(modelMetrics.falseNegatives)} /></div></div>}{historyName === model.title && <div className="mt-4 border-t pt-4"><p className="mb-3 text-sm font-semibold">Histórico de versões</p><div className="space-y-2">{data.models.filter((item) => item.title === model.title).sort((a, b) => b.eventDate.localeCompare(a.eventDate)).map((version) => <div key={version.id} className="flex justify-between rounded-lg border p-3 text-xs"><span>Versão {field(version.details, "Versão")} · {version.eventDate}</span><StatusPill tone={/suspens/i.test(version.status) ? "danger" : "success"}>{version.status}</StatusPill></div>)}</div></div>}</article>; })}</div>}
    </Panel>

    {selectedModels.length > 0 && <Panel title="Comparação de modelos" subtitle="Métricas calculadas somente com registros vinculados no banco." action={<Button size="sm" variant="ghost" onClick={() => setCompared([])}>Limpar comparação</Button>}><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="p-3">Modelo</th><th className="p-3">Versão</th><th className="p-3">Precisão</th><th className="p-3">Falsos positivos</th><th className="p-3">Falsos negativos</th><th className="p-3">Estabilidade</th><th className="p-3">Disparidades</th><th className="p-3">Revisões</th><th className="p-3">Contestação</th></tr></thead><tbody>{selectedModels.map((model) => { const value = metrics(model); return <tr key={model.id} className="border-b border-border/70"><td className="p-3 font-medium">{model.title}</td><td className="p-3">{field(model.details, "Versão")}</td><td className="p-3">{value.precision}%</td><td className="p-3">{value.falsePositives}</td><td className="p-3">{value.falseNegatives}</td><td className="p-3">{value.stability}%</td><td className="p-3">{value.disparity}</td><td className="p-3">{value.reviews}</td><td className="p-3">{value.contestRate}%</td></tr>; })}</tbody></table></div>{selectedModels.length >= 2 && <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground"><strong className="text-foreground">Recomendação para avaliação humana:</strong> compare desempenho, falsos resultados, estabilidade, disparidades e revisões em conjunto. O menor valor isolado não determina automaticamente qual versão deve operar.</div>}</Panel>}

    <Disclaimer>Alterações, ativações e suspensões de modelos exigem avaliação humana e registro de auditoria. Um modelo não deve ser selecionado apenas por uma métrica nem utilizado para classificar pessoas ou justificar decisões individuais.</Disclaimer>
  </div>;
}

function Small({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
