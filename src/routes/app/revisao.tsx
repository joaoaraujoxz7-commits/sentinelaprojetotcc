import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Disclaimer, PageHeader, Panel, StatusPill } from "@/components/sentinela/ui-kit";
import { addCitizenContestFn, citizenDecisionRecordsFn } from "@/lib/records";

export const Route = createFileRoute("/app/revisao")({ component: Revisao });

function Revisao() {
  const [targets, setTargets] = useState<Array<{ id: string; protocol: string; title: string; kind: "occurrence" | "prediction"; eventDate: string; status: string }>>([]);
  const [targetId, setTargetId] = useState(""); const [reason, setReason] = useState(""); const [protocol, setProtocol] = useState(""); const [error, setError] = useState("");
  useEffect(() => { void citizenDecisionRecordsFn().then((items) => { const values = items as typeof targets; setTargets(values); if (values[0]) setTargetId(values[0].id); }); }, []);
  const selected = targets.find((item) => item.id === targetId);
  if (protocol) return <div className="mx-auto max-w-2xl space-y-5"><Panel><div className="py-6 text-center"><CheckCircle2 className="mx-auto size-12 text-success" /><h1 className="mt-4 text-xl font-semibold">Revisão solicitada com sucesso</h1><p className="mt-3 font-mono text-primary">{protocol}</p><StatusPill tone="warning" className="mt-3">Aguardando análise humana</StatusPill></div></Panel><Button asChild className="w-full"><Link to="/app/contestacoes">Acompanhar solicitação</Link></Button></div>;
  return <div className="mx-auto max-w-2xl space-y-5"><PageHeader title="Solicitar revisão humana" description="Peça que uma pessoa responsável analise o resultado produzido pelo sistema." /><Panel title="Decisão a ser revisada"><Label>Registro</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Selecione</option>{targets.map((item) => <option key={item.id} value={item.id}>{item.protocol} — {item.title}</option>)}</select>{selected && <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border p-4 text-xs"><div><dt className="text-muted-foreground">Data</dt><dd>{selected.eventDate}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd>{selected.status}</dd></div></dl>}</Panel><Panel title="Motivo da revisão"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={5} placeholder="Explique o contexto que precisa ser avaliado por uma pessoa." /></Panel>{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" onClick={async () => { if (!selected || !reason.trim()) return setError("Selecione uma decisão e informe o motivo."); try { const result = await addCitizenContestFn({ data: { targetType: selected.kind, targetId: selected.id, reason: "Solicitação de revisão humana", details: reason } }); setProtocol(result.protocol); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível solicitar a revisão."); } }}><ShieldCheck className="size-4" />Solicitar revisão</Button><Disclaimer>O envio cria uma solicitação para análise humana e não altera automaticamente o resultado original.</Disclaimer></div>;
}
