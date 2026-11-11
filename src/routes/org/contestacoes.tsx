import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { listRecordsFn, reviewContestFn, type ManagedRecord } from "@/lib/records";
import { PageHeader, Panel, StatusPill, Timeline, Disclaimer } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/org/contestacoes")({ component: ContestacoesAuditor });
const decisions = ["Manter decisão", "Alterar decisão", "Cancelar decisão", "Solicitar mais informações"] as const;

function ContestacoesAuditor() {
  const [records, setRecords] = useState<ManagedRecord[]>([]);
  const [selected, setSelected] = useState<ManagedRecord | null>(null);
  const [decision, setDecision] = useState<(typeof decisions)[number]>("Alterar decisão");
  const [justification, setJustification] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);
  const load = async () => setRecords(await listRecordsFn({ data: { kind: "contests" } }));
  useEffect(() => { void load(); }, []);
  useEffect(() => { if (selected) window.setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }, [selected]);
  return <div className="space-y-6"><PageHeader title="Fila de revisões humanas" description="Analise contestações, consulte os dados utilizados e registre uma decisão humana justificada." />
    <div className="grid gap-4 lg:grid-cols-2">{records.length ? records.map((record) => <Panel key={record.id}>
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-primary">{record.protocol}</p><h2 className="mt-1 font-sans font-semibold">{record.title}</h2><p className="mt-1 text-xs text-muted-foreground">{record.eventDate} · {record.eventTime} · {record.reporterName ?? "Cidadão"}</p></div><StatusPill tone={record.status.includes("conclu") ? "success" : "warning"}>{record.status}</StatusPill></div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Tipo</dt><dd>{record.title.startsWith("Previsão") ? "Previsão da IA" : "Decisão sobre ocorrência"}</dd></div><div><dt className="text-muted-foreground">Prioridade</dt><dd>{record.title.toLocaleLowerCase("pt-BR").includes("injust") ? "Alta" : "Normal"}</dd></div><div><dt className="text-muted-foreground">Região</dt><dd>{record.region}</dd></div><div><dt className="text-muted-foreground">Responsável</dt><dd>{record.status.includes("conclu") ? "Auditoria registrada" : "Aguardando auditor"}</dd></div></dl>
      <Button className="mt-4" size="sm" variant="secondary" onClick={() => { setSelected(record); setJustification(""); setError(""); }}>{record.status.includes("conclu") ? "Ver resultado" : "Abrir revisão"}</Button>
    </Panel>) : <Panel><p className="py-8 text-center text-sm text-muted-foreground">Nenhuma contestação recebida.</p></Panel>}</div>
    {selected && <div ref={reviewRef} className="scroll-mt-6"><Panel title={`Revisão ${selected.protocol}`} subtitle={`${selected.reporterName ?? "Cidadão"} · ${selected.eventDate} · ${selected.status}`}>
      <div className="grid gap-5 xl:grid-cols-2"><section><h3 className="text-sm font-semibold">Dados da decisão contestada</h3><dl className="mt-3 space-y-2 text-sm"><Row label="Tipo" value={selected.title} /><Row label="Região" value={selected.region} /><Row label="Relato do cidadão" value={selected.details} /><Row label="Contato" value={selected.reporterEmail ?? "Não informado"} /></dl></section>
      <section><h3 className="text-sm font-semibold">Dados utilizados e limitações</h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li>• Registro e justificativa enviados pelo cidadão.</li><li>• Histórico agregado de ocorrências da região.</li><li>• Data, horário e origem do registro.</li><li>• A previsão não determina certeza nem substitui a revisão humana.</li></ul></section></div>
      <div className="mt-6"><Timeline steps={["Contestação enviada", "Triagem", "Revisão humana", "Resultado"]} current={selected.status.includes("conclu") ? 3 : selected.status.includes("informações") ? 2 : 1} /></div>
      {!selected.status.includes("conclu") && <div className="mt-6 space-y-4 border-t border-border pt-5"><div className="space-y-2"><Label htmlFor="human-decision">Decisão humana</Label><select id="human-decision" value={decision} onChange={(event) => setDecision(event.target.value as (typeof decisions)[number])} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{decisions.map((item) => <option key={item}>{item}</option>)}</select></div><div className="space-y-2"><Label htmlFor="review-justification">Justificativa obrigatória</Label><Textarea id="review-justification" rows={4} value={justification} onChange={(event) => setJustification(event.target.value)} placeholder="Explique os dados analisados e o motivo da decisão humana." /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-3"><Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button><Button disabled={saving} onClick={async () => { if (!justification.trim()) { setError("Informe a justificativa da decisão humana."); return; } setSaving(true); setError(""); try { await reviewContestFn({ data: { id: selected.id, decision, justification } }); await load(); setSelected(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir a revisão."); } finally { setSaving(false); } }}>{saving ? "Salvando..." : decision === "Solicitar mais informações" ? "Enviar solicitação" : "Finalizar revisão"}</Button></div></div>}
    </Panel></div>}
    <Disclaimer>Toda decisão, justificativa e identificação do auditor ficam registradas na trilha de auditoria. A revisão humana não deve se basear exclusivamente no resultado da IA.</Disclaimer>
  </div>;
}
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-border pb-2"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[65%] text-right">{value}</dd></div>; }
