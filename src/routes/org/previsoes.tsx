import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { addRecordFn, listRecordsFn, removeRecordFn, updateRecordFn, type ManagedRecord } from "@/lib/records";
import { PageHeader, Panel, StatusPill, ConfidenceBar, Disclaimer } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { Lumia } from "@/components/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/org/previsoes")({ component: Previsoes });

function Previsoes() {
  const { user } = getRouteApi("/org").useRouteContext();
  if (user.institutionalType !== "agent") return <AuditorPredictions />;
  return <AgentPredictions />;
}

function AuditorPredictions() {
  const [records, setRecords] = useState<ManagedRecord[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const load = async () => setRecords(await listRecordsFn({ data: { kind: "predictions" } }));
  useEffect(() => { void load(); }, []);
  return <div className="space-y-6"><PageHeader title="Análise e auditoria das previsões" description="Consulte dados utilizados, fatores, limitações, validade e confiabilidade antes de revisar uma previsão." action={<Button onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar formulário" : "Cadastrar previsão"}</Button>} />
    {showForm && <Panel title="Nova previsão para análise" subtitle="Registre somente resultados gerados por fonte e modelo autorizados."><form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={async (event) => { event.preventDefault(); setError(""); const formElement = event.currentTarget; const form = new FormData(formElement); try { await addRecordFn({ data: { kind: "predictions", record: { title: String(form.get("title")), region: String(form.get("region")), eventDate: String(form.get("date")), eventTime: String(form.get("period")), source: String(form.get("model")), status: "Em auditoria", confidence: Number(form.get("confidence")), details: String(form.get("details")) } } }); formElement.reset(); setShowForm(false); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar."); } }}><Field label="Tipo de análise" name="title" required placeholder="Ex.: Furto e roubo" /><Field label="Área / região" name="region" required /><Field label="Data e validade" name="date" type="date" required /><Field label="Período analisado" name="period" placeholder="Próximas 24 horas" /><Field label="Modelo / versão" name="model" required placeholder="LumIA v1.0" /><Field label="Confiabilidade (%)" name="confidence" type="number" min={0} max={100} required /><div className="space-y-2 md:col-span-2"><Label htmlFor="prediction-details">Principais fatores e observações</Label><Textarea id="prediction-details" name="details" rows={3} /></div>{error && <p className="text-sm text-destructive md:col-span-2 xl:col-span-4">{error}</p>}<Button className="md:col-span-2 xl:col-span-4">Salvar para auditoria</Button></form></Panel>}
    <div className="grid gap-5 xl:grid-cols-2">{records.map((record) => { const level = record.confidence >= 80 ? "Alto" : record.confidence >= 60 ? "Médio" : "Baixo"; return <Panel key={record.id} title={record.title} subtitle={`${record.region} · ${record.source}`} action={<StatusPill tone={level === "Alto" ? "danger" : level === "Médio" ? "warning" : "success"}>Atenção {level}</StatusPill>}><dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Data / validade</dt><dd>{formatDate(record.eventDate)}</dd></div><div><dt className="text-muted-foreground">Período</dt><dd>{record.eventTime || "Não informado"}</dd></div><div><dt className="text-muted-foreground">Modelo</dt><dd>{record.source}</dd></div><div><dt className="text-muted-foreground">Status da revisão</dt><dd>{record.status}</dd></div></dl><div className="mt-5"><ConfidenceBar value={record.confidence} label="Confiabilidade estimada" /></div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">A confiabilidade mede a consistência estimada do modelo. Não representa chance de crime nem autoriza classificação individual.</p>{record.details && <p className="mt-3 rounded-lg border border-border p-3 text-sm text-muted-foreground">{record.details}</p>}<div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setOpened((current) => current === record.id ? null : record.id)}>{opened === record.id ? "Fechar análise" : "Analisar fatores e dados"}</Button>{record.status !== "Revisada pelo auditor" && <Button size="sm" onClick={async () => { await updateRecordFn({ data: { kind: "predictions", id: record.id, status: "Revisada pelo auditor" } }); await load(); }}>Registrar revisão</Button>}<Button size="sm" variant="secondary" onClick={async () => { await removeRecordFn({ data: { kind: "predictions", id: record.id } }); await load(); }}>Excluir</Button></div>{opened === record.id && <div className="mt-5 space-y-5 border-t border-border pt-5"><section><h3 className="text-sm font-semibold">Dados utilizados</h3><ul className="mt-2 space-y-1 text-xs text-muted-foreground"><li>• Ocorrências confirmadas e agregadas da região.</li><li>• Distribuição temporal e geográfica.</li><li>• Registros da população, policiais e fontes autorizadas.</li><li>• Versão informada do modelo: {record.source}.</li></ul></section><section><h3 className="text-sm font-semibold">Fatores que contribuíram</h3><div className="mt-3 space-y-3">{factors.map(([name, contribution]) => <div key={name}><div className="flex justify-between text-xs"><span className="text-muted-foreground">{name}</span><span>{contribution}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="brand-gradient h-full" style={{ width: `${contribution}%` }} /></div></div>)}</div></section><div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4"><Lumia size={48} /><p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-primary">LumIA explica:</strong> diferenças na qualidade, quantidade e atualização dos dados podem influenciar este resultado. Verifique possíveis disparidades e não determine causalidade apenas pela métrica.</p></div></div>}</Panel>; })}</div>
    {records.length === 0 && <Panel><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma previsão cadastrada.</p></Panel>}
    <Disclaimer>O auditor deve verificar origem, qualidade, versão do modelo e possíveis disparidades. Dados de grupos protegidos, quando necessários, devem permanecer agregados e anonimizados.</Disclaimer>
  </div>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-2"><Label htmlFor={`auditor-${name}`}>{label}</Label><Input id={`auditor-${name}`} name={name} {...props} /></div>; }

const factors = [
  ["Histórico recente de ocorrências confirmadas", 86], ["Concentração temporal", 72],
  ["Padrão geográfico agregado", 64], ["Dados de diferentes fontes", 51], ["Alterações recentes nos registros", 43],
] as const;

function AgentPredictions() {
  const [records, setRecords] = useState<ManagedRecord[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void listRecordsFn({ data: { kind: "predictions" } }).then(setRecords).finally(() => setLoading(false)); }, []);
  return <div className="space-y-6"><PageHeader title="Análise preditiva" description="Consulte previsões como apoio à decisão, com fatores, limitações e confiabilidade explicados." />
    {loading && <Panel><p className="text-sm text-muted-foreground">Carregando previsões...</p></Panel>}
    {!loading && records.length === 0 && <Panel><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma previsão ativa cadastrada pelo órgão.</p></Panel>}
    <div className="grid gap-5 xl:grid-cols-2">{records.map((record) => {
      const level = record.confidence >= 80 ? "Alto" : record.confidence >= 60 ? "Médio" : "Baixo";
      const tone = level === "Alto" ? "danger" : level === "Médio" ? "warning" : "success";
      return <Panel key={record.id} title={record.title} subtitle={`${record.region} · gerada em ${formatDate(record.eventDate)}`} action={<StatusPill tone={tone}>Atenção {level}</StatusPill>}>
        <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Área analisada</dt><dd>{record.region}</dd></div><div><dt className="text-muted-foreground">Período</dt><dd>{record.eventTime ? `A partir de ${record.eventTime}` : "Próximas 24 horas"}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd>{record.status}</dd></div><div><dt className="text-muted-foreground">Validade</dt><dd>{formatDate(record.eventDate)}</dd></div></dl>
        <div className="mt-5"><ConfidenceBar value={record.confidence} label="Nível de confiabilidade do modelo" /></div>
        <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">{record.confidence}% representa a confiança do modelo nesta previsão.</strong> Não representa a probabilidade de uma pessoa cometer um crime nem a certeza de uma ocorrência.</p>
        {record.details && <p className="mt-3 text-sm text-muted-foreground">{record.details}</p>}
        <Button className="mt-4" variant="secondary" size="sm" onClick={() => setOpened((current) => current === record.id ? null : record.id)}>{opened === record.id ? "Fechar explicação" : "Explicar com a LumIA"}</Button>
        {opened === record.id && <div className="mt-5 space-y-5 border-t border-border pt-5"><div className="flex items-center gap-3"><Lumia size={54} /><div><p className="font-semibold text-primary">LumIA — Assistente de Transparência</p><p className="text-xs text-muted-foreground">Esta previsão identifica padrões agregados e possui limitações.</p></div></div><section><h3 className="text-sm font-semibold">Fatores que contribuíram para a previsão</h3><div className="mt-3 space-y-3">{factors.map(([name, contribution]) => <div key={name}><div className="flex justify-between text-xs"><span className="text-muted-foreground">{name}</span><span>{contribution}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="brand-gradient h-full" style={{ width: `${contribution}%` }} /></div></div>)}</div></section><section className="rounded-lg border border-border p-4"><h3 className="text-sm font-semibold">Por que isso importa?</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">O resultado foi influenciado principalmente por padrões históricos, temporais e geográficos. Ele não deve ser utilizado isoladamente para justificar abordagem ou decisão individual. Verifique alertas de disparidade e considere o contexto antes de agir.</p></section></div>}
      </Panel>;
    })}</div>
    <Disclaimer>A IA é uma ferramenta de apoio. A decisão final é humana, deve possuir justificativa e não pode ser baseada em características raciais ou étnicas.</Disclaimer>
  </div>;
}
function formatDate(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR"); }
