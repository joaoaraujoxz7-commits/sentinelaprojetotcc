import { useEffect, useState } from "react";
import { PageHeader, Panel, StatusPill } from "./ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addRecordFn, listRecordsFn, removeRecordFn, updateRecordFn, type ManagedRecord, type RecordKind } from "@/lib/records";

export function ManagedRecords({ kind, title, description, sourceFilter, allowCreate = true }: { kind: RecordKind; title: string; description: string; sourceFilter?: string; allowCreate?: boolean }) {
  const [records, setRecords] = useState<ManagedRecord[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const load = async () => { try { setRecords(await listRecordsFn({ data: { kind } })); } catch (e) { setError(e instanceof Error ? e.message : "Erro ao carregar dados."); } };
  useEffect(() => {
    void load();
    if (kind !== "notifications") return;
    const timer = window.setInterval(() => { void load(); }, 10000);
    return () => window.clearInterval(timer);
  }, [kind]);
  const visible = sourceFilter ? records.filter((record) => record.source === sourceFilter) : records;

  return <div className="space-y-6">
    <PageHeader title={title} description={description} action={allowCreate ? <Button onClick={() => setShowForm((value) => !value)}>{showForm ? "Fechar formulário" : "Adicionar registro"}</Button> : undefined} />
    {allowCreate && showForm && <Panel title="Novo registro manual">
      <form method="post" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={async (event) => {
        event.preventDefault(); setError("");
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        try {
          await addRecordFn({ data: { kind, record: {
            title: String(form.get("title")), region: String(form.get("region")), eventDate: String(form.get("eventDate")),
            eventTime: String(form.get("eventTime")), source: sourceFilter ?? String(form.get("source")), status: String(form.get("status")),
            confidence: Number(form.get("confidence")), details: String(form.get("details")),
            result: String(form.get("result") ?? ""), recommendationFollowed: form.get("recommendationFollowed") === "yes",
          } } }); formElement.reset(); setShowForm(false); await load();
        } catch (e) { setError(e instanceof Error ? e.message : "Erro ao salvar."); }
      }}>
        <Field label="Título / tipo" name="title" required />
        <Field label="Região / bairro" name="region" required placeholder="Itapuã" />
        <Field label="Data" name="eventDate" type="date" required />
        <Field label="Horário" name="eventTime" type="time" />
        {!sourceFilter && <Field label="Origem" name="source" placeholder="Institucional" />}
        <Field label="Status" name="status" placeholder="Pendente" />
        <Field label="Confiabilidade (%)" name="confidence" type="number" min={0} max={100} defaultValue={0} />
        <div className="sm:col-span-2"><Field label="Detalhes" name="details" /></div>
        {kind === "patrols" && <><div className="sm:col-span-2"><Field label="Resultado do patrulhamento" name="result" required placeholder="Descreva o resultado observado" /></div><div className="space-y-2"><Label htmlFor="recommendationFollowed-managed">Seguiu a recomendação?</Label><select id="recommendationFollowed-managed" name="recommendationFollowed" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="yes">Sim</option><option value="no">Não</option></select></div></>}
        <Button type="submit" className="sm:col-span-2 lg:col-span-4">Salvar no banco</Button>
      </form>
    </Panel>}
    {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {visible.length === 0 ? <Panel><p className="py-8 text-center text-sm text-muted-foreground">{allowCreate ? "Nenhum registro cadastrado. Use “Adicionar registro” para inserir o primeiro dado." : "Nenhuma notificação recebida."}</p></Panel> :
      <div className="grid gap-4 lg:grid-cols-2">{visible.map((record) => <Panel key={record.id}>
        <div className="flex items-start justify-between gap-3"><div><p className="font-sans font-semibold">{record.title}</p><p className="mt-1 text-xs text-muted-foreground">{record.region} · {record.eventDate}{record.eventTime ? ` · ${record.eventTime}` : ""}</p></div><StatusPill tone="info">{record.status}</StatusPill></div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted-foreground">Origem</dt><dd>{record.source}</dd></div><div><dt className="text-muted-foreground">Confiabilidade</dt><dd>{record.confidence}%</dd></div></dl>
        {record.details && <p className="mt-3 text-sm text-muted-foreground">{record.details}</p>}
        {kind === "patrols" && <dl className="mt-3 grid gap-2 rounded-lg border border-border p-3 text-xs sm:grid-cols-2"><div><dt className="text-muted-foreground">Resultado</dt><dd>{record.result || "Não informado"}</dd></div><div><dt className="text-muted-foreground">Seguiu a recomendação</dt><dd>{record.recommendationFollowed ? "Sim" : "Não"}</dd></div></dl>}
        {kind === "occurrences" && <div className="mt-4 rounded-lg border border-border bg-background/30 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">Dados da ocorrência</p>
          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Tipo</dt><dd>{record.title}</dd></div>
            <div><dt className="text-muted-foreground">Prioridade</dt><dd className={record.priority === "Urgente" ? "font-semibold text-destructive" : ""}>{record.priority ?? "Normal"}</dd></div>
            <div><dt className="text-muted-foreground">Data</dt><dd>{new Date(`${record.eventDate}T12:00:00`).toLocaleDateString("pt-BR")}</dd></div>
            <div><dt className="text-muted-foreground">Hora</dt><dd>{record.eventTime || "Não informada"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Local</dt><dd>{record.region}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Descrição</dt><dd>{record.details || "Sem descrição"}</dd></div>
            <div><dt className="text-muted-foreground">Contato autorizado</dt><dd>{record.contactAuthorized ? "Sim" : "Não"}</dd></div>
            <div><dt className="text-muted-foreground">Registro anônimo</dt><dd>{record.anonymous ? "Sim" : "Não"}</dd></div>
            {!record.anonymous && record.contactAuthorized && <>
              <div><dt className="text-muted-foreground">Cidadão</dt><dd>{record.reporterName ?? "Não informado"}</dd></div>
              <div><dt className="text-muted-foreground">Contato</dt><dd>{record.reporterEmail}{record.reporterPhone ? ` · ${record.reporterPhone}` : ""}</dd></div>
            </>}
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Evidência</dt><dd>{record.evidenceData ? <a className="text-primary hover:underline" href={record.evidenceData} download={record.evidenceName ?? "evidencia"}>Abrir ou baixar {record.evidenceName}</a> : "Nenhuma evidência anexada"}</dd></div>
          </dl>
        </div>}
        {kind !== "notifications" && <div className="mt-4 flex gap-2">{!(kind === "occurrences" && record.status.toLocaleLowerCase("pt-BR") === "validação") && <Button size="sm" onClick={async () => { await updateRecordFn({ data: { kind, id: record.id, status: kind === "occurrences" ? "Validação" : "Concluído" } }); await load(); }}>{kind === "occurrences" ? "Concluir análise" : "Marcar concluído"}</Button>}<Button size="sm" variant="secondary" onClick={async () => { await removeRecordFn({ data: { kind, id: record.id } }); await load(); }}>Excluir</Button></div>}
      </Panel>)}</div>}
  </div>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return <div className="space-y-2"><Label htmlFor={`${name}-managed`}>{label}</Label><Input id={`${name}-managed`} name={name} {...props} /></div>;
}
