import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Disclaimer, PageHeader, Panel, StatusPill } from "@/components/sentinela/ui-kit";
import { addRecordFn, listRecordsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/org/patrulhamentos")({
  beforeLoad: ({ context }) => { if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" }); },
  component: Patrulhamentos,
});

function Patrulhamentos() {
  const [records, setRecords] = useState<ManagedRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [followed, setFollowed] = useState(true);
  const [error, setError] = useState("");
  const load = () => listRecordsFn({ data: { kind: "patrols" } }).then(setRecords);
  useEffect(() => { void load(); }, []);
  return <div className="space-y-5"><PageHeader title="Patrulhamentos" description="Registre a execução operacional, seu resultado e a relação com recomendações consultadas." action={<Button onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar formulário" : "Registrar patrulhamento"}</Button>} />
    {showForm && <Panel title="Novo registro de patrulhamento" subtitle="A recomendação da IA é apoio; o agente continua responsável pela avaliação contextual."><form className="grid gap-4 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); setError(""); const element = event.currentTarget; const form = new FormData(element); const justification = String(form.get("justification")).trim(); if (!followed && !justification) return setError("Informe por que a recomendação não foi seguida."); await addRecordFn({ data: { kind: "patrols", record: { title: String(form.get("title")), region: String(form.get("location")), eventDate: String(form.get("date")), eventTime: String(form.get("time")), source: "Agente policial", status: "Realizado", confidence: 0, details: `Recomendação relacionada: ${String(form.get("recommendation")) || "Nenhuma"}. Justificativa operacional: ${justification || "Recomendação seguida conforme avaliação do agente"}.`, result: String(form.get("result")), recommendationFollowed: followed } } }); element.reset(); setFollowed(true); setShowForm(false); await load(); }}><Field label="Tipo de patrulhamento" name="title" required placeholder="Ex.: Patrulhamento preventivo" /><Field label="Localização" name="location" required /><Field label="Data" name="date" type="date" required /><Field label="Horário" name="time" type="time" required /><Field label="Recomendação relacionada" name="recommendation" placeholder="Título ou protocolo da recomendação" /><div className="md:col-span-2"><Label>Resultado do patrulhamento</Label><Textarea className="mt-2" name="result" required placeholder="Descreva o resultado observado, sem inserir dados pessoais desnecessários." /></div><label className="flex items-center gap-3 rounded-lg border p-3 text-sm md:col-span-2"><input type="checkbox" checked={followed} onChange={(event) => setFollowed(event.target.checked)} />A recomendação consultada foi seguida após avaliação humana.</label><div className="md:col-span-2"><Label>Justificativa operacional {!followed && "(obrigatória)"}</Label><Textarea className="mt-2" name="justification" placeholder="Explique adaptações, contexto considerado ou motivo para não seguir a recomendação." /></div>{error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}<Button className="w-fit" type="submit">Salvar patrulhamento</Button></form></Panel>}
    <Panel title="Histórico operacional">{records.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum patrulhamento registrado.</p> : <div className="grid gap-4 xl:grid-cols-2">{records.map((record) => <article key={record.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{record.title}</h3><p className="mt-1 text-xs text-muted-foreground">{record.region} · {record.eventDate} {record.eventTime}</p></div><StatusPill tone="success">{record.status}</StatusPill></div><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Resultado</dt><dd className="mt-1">{record.result || "Não informado"}</dd></div><div><dt className="text-xs text-muted-foreground">Recomendação seguida</dt><dd className="mt-1">{record.recommendationFollowed ? "Sim" : "Não"}</dd></div><div><dt className="text-xs text-muted-foreground">Contexto e justificativa</dt><dd className="mt-1 text-muted-foreground">{record.details}</dd></div></dl></article>)}</div>}</Panel>
    <Disclaimer>O patrulhamento não deve ser justificado exclusivamente por previsão algorítmica. Horário, localização, resultado e decisão humana permanecem registrados para rastreabilidade.</Disclaimer></div>;
}
function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) { return <div><Label htmlFor={`patrol-${name}`}>{label}</Label><Input className="mt-2" id={`patrol-${name}`} name={name} {...props} /></div>; }
