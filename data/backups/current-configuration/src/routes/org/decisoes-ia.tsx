import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  const load = () => listRecordsFn({ data: { kind: "ai_decisions" } }).then(setRecords);
  useEffect(() => { void load(); }, []);
  return <div className="space-y-6"><PageHeader title="Verificação de decisão" description="A previsão apoia a análise, mas a responsabilidade e a decisão final são humanas." />
    <Panel title="Revisão obrigatória antes da decisão"><form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault(); setError("");
      if (checked.some((value) => !value)) { setError("Confirme todos os itens antes de registrar a decisão."); return; }
      const formElement = event.currentTarget; const form = new FormData(formElement); const justification = String(form.get("justification")).trim();
      if (!justification) { setError("A justificativa é obrigatória."); return; }
      await addRecordFn({ data: { kind: "ai_decisions", record: { title: String(form.get("decision")), region: String(form.get("region")), eventDate: new Date().toISOString().slice(0, 10), eventTime: new Date().toTimeString().slice(0, 5), source: "Decisão humana", status: "Registrada", confidence: Number(form.get("confidence")), details: `Resultado da IA: ${String(form.get("aiResult"))}. Justificativa humana: ${justification}` } } });
      setChecked(checks.map(() => false)); formElement.reset(); await load();
    }}>
      <div className="grid gap-4 md:grid-cols-2"><Field label="Área / região" name="region" required /><Field label="Tipo de decisão humana" name="decision" required /><Field label="Resultado apresentado pela IA" name="aiResult" required /><Field label="Confiabilidade informada (%)" name="confidence" type="number" min={0} max={100} required /></div>
      <div className="grid gap-2">{checks.map((item, index) => <label key={item} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"><input type="checkbox" checked={checked[index]} onChange={(event) => setChecked((values) => values.map((value, current) => current === index ? event.target.checked : value))} />{item}</label>)}</div>
      <div className="space-y-2"><Label htmlFor="justification">Justifique a decisão humana</Label><Textarea id="justification" name="justification" rows={4} required /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit">Registrar decisão</Button>
    </form></Panel>
    <Panel title="Histórico de decisões"><div className="space-y-3">{records.length ? records.map((record) => <div key={record.id} className="rounded-lg border border-border p-4"><div className="flex justify-between gap-3"><strong>{record.title}</strong><StatusPill tone="info">{record.status}</StatusPill></div><p className="mt-1 text-xs text-muted-foreground">{record.eventDate} · {record.eventTime} · {record.region} · confiança {record.confidence}%</p><p className="mt-3 text-sm text-muted-foreground">{record.details}</p></div>) : <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma decisão registrada.</p>}</div></Panel>
    <Disclaimer>O registro cria uma trilha rastreável. A IA não autoriza abordagens nem substitui avaliação humana contextual.</Disclaimer>
  </div>;
}
function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>; }
