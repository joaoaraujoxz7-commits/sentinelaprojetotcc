import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { addRecordFn, listRecordsFn, type ManagedRecord } from "@/lib/records";
import { PageHeader, Panel, StatusPill, Disclaimer } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/org/decisoes-ia")({
  beforeLoad: ({ context }) => { if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" }); },
  component: VerificacaoDecisao,
});

const checks = ["Consultei os dados disponíveis.", "Verifiquei a explicação da IA.", "Considerei as limitações da previsão.", "Verifiquei se existe alerta de possível viés.", "A decisão não foi baseada em característica racial ou étnica.", "Tenho justificativa para a decisão."];

function VerificacaoDecisao() {
  const [records, setRecords] = useState<ManagedRecord[]>([]);
  const [checked, setChecked] = useState<boolean[]>(checks.map(() => false));
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [reviewFilter, setReviewFilter] = useState("Todos");
  const [opened, setOpened] = useState<string | null>(null);
  const load = () => listRecordsFn({ data: { kind: "ai_decisions" } }).then(setRecords);
  useEffect(() => { void load(); }, []);
  return <div className="space-y-6"><PageHeader title="Verificação de decisão" description="A previsão apoia a análise, mas a responsabilidade e a decisão final são humanas." />
    <Panel title="Revisão obrigatória antes da decisão"><form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault(); setError("");
      const formElement = event.currentTarget; const form = new FormData(formElement); const justification = String(form.get("justification")).trim();
      if (!justification) { setError("A justificativa é obrigatória."); return; }
      const completedChecks = checks.filter((_, index) => checked[index]);
      const verificationSummary = completedChecks.length ? ` Verificações declaradas: ${completedChecks.join(" ")}` : " Nenhuma verificação opcional foi marcada.";
      await addRecordFn({ data: { kind: "ai_decisions", record: { title: String(form.get("decision")), region: String(form.get("region")), eventDate: new Date().toISOString().slice(0, 10), eventTime: new Date().toTimeString().slice(0, 5), source: "Decisão humana", status: "Registrada", confidence: Number(form.get("confidence")), details: `Resultado da IA: ${String(form.get("aiResult"))}. Justificativa humana: ${justification}.${verificationSummary}` } } });
      setChecked(checks.map(() => false)); formElement.reset(); await load();
    }}>
      <div className="grid gap-4 md:grid-cols-2"><Field label="Área / região" name="region" required /><Field label="Tipo de decisão humana" name="decision" required /><Field label="Resultado apresentado pela IA" name="aiResult" required /><Field label="Confiabilidade informada (%)" name="confidence" type="number" min={0} max={100} required /></div>
      <div><p className="mb-2 text-xs text-muted-foreground">Verificações recomendadas — marque somente as que você realizou:</p><div className="grid gap-2">{checks.map((item, index) => <label key={item} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={checked[index]} onChange={(event) => setChecked((values) => values.map((value, current) => current === index ? event.target.checked : value))} />{item}</label>)}</div></div>
      <div className="space-y-2"><Label htmlFor="justification">Justifique a decisão humana</Label><Textarea id="justification" name="justification" rows={4} required /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit">Registrar decisão</Button>
    </form></Panel>
    <Panel title="Histórico de decisões" subtitle="Consulte a decisão humana e abra sua trilha de auditoria." action={<div className="flex flex-wrap gap-2"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option>{[...new Set(records.map((item) => item.status))].map((item) => <option key={item}>{item}</option>)}</select><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}><option>Todos</option><option>Revisão necessária</option><option>Sem revisão pendente</option></select><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="w-56 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Área, tipo ou resultado" /></div></div>}><DecisionHistory records={records.filter((record) => { const needsReview = /revisão solicitada|necessita revisão|pendente/i.test(`${record.status} ${record.details}`); return `${record.title} ${record.region} ${record.details}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")) && (statusFilter === "Todos" || record.status === statusFilter) && (reviewFilter === "Todos" || (reviewFilter === "Revisão necessária" ? needsReview : !needsReview)); })} opened={opened} setOpened={setOpened} /></Panel>
    <Disclaimer>O registro cria uma trilha rastreável. A IA não autoriza abordagens nem substitui avaliação humana contextual.</Disclaimer>
  </div>;
}
function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>; }

function DecisionHistory({ records, opened, setOpened }: { records: ManagedRecord[]; opened: string | null; setOpened: (id: string | null) => void }) {
  if (!records.length) return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma decisão encontrada.</p>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="p-3">ID</th><th className="p-3">Data</th><th className="p-3">Área</th><th className="p-3">Tipo</th><th className="p-3">Resultado da IA</th><th className="p-3">Decisão humana</th><th className="p-3">Status</th><th className="p-3">Auditoria</th></tr></thead><tbody>{records.map((record) => { const aiResult = record.details.match(/Resultado da IA:\s*([^.;]+)/i)?.[1] ?? "Não informado"; const needsReview = /revisão solicitada|necessita revisão|pendente/i.test(`${record.status} ${record.details}`); return <tr key={record.id} className="border-b border-border/70 align-top"><td className="p-3 font-mono text-xs">{record.id.slice(0, 8).toUpperCase()}</td><td className="p-3">{record.eventDate}<br /><span className="text-xs text-muted-foreground">{record.eventTime}</span></td><td className="p-3">{record.region}</td><td className="p-3">Análise preditiva</td><td className="max-w-48 p-3">{aiResult}</td><td className="max-w-48 p-3 font-medium">{record.title}</td><td className="p-3"><StatusPill tone={needsReview ? "warning" : "success"}>{record.status}</StatusPill></td><td className="p-3"><Button size="sm" variant="secondary" onClick={() => setOpened(opened === record.id ? null : record.id)}>{opened === record.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}Trilha</Button>{opened === record.id && <div className="mt-3 w-80 rounded-lg border bg-background p-3 text-xs"><Trail label="Previsão consultada" value={aiResult} /><Trail label="Verificação humana" value={record.eventDate + " " + record.eventTime} /><Trail label="Decisão registrada" value={record.title} /><Trail label="Justificativa e verificações" value={record.details} /><Trail label="Necessidade de revisão" value={needsReview ? "Sim" : "Não identificada"} /></div>}</td></tr>; })}</tbody></table></div>;
}
function Trail({ label, value }: { label: string; value: string }) { return <div className="mb-3 border-l-2 border-primary pl-3"><p className="font-semibold">{label}</p><p className="mt-1 leading-relaxed text-muted-foreground">{value}</p></div>; }
