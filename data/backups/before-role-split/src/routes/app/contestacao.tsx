import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Paperclip, ShieldQuestion } from "lucide-react";
import { PageHeader, Panel, Timeline, StatusPill, Disclaimer } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { addCitizenContestFn } from "@/lib/records";

export const Route = createFileRoute("/app/contestacao")({
  head: () => ({
    meta: [
      { title: "Contestar uma decisão — Sentinela" },
      {
        name: "description",
        content: "Solicite revisão humana de uma decisão automatizada e acompanhe o status da contestação.",
      },
      { property: "og:title", content: "Contestar uma decisão — Sentinela" },
      { property: "og:description", content: "Revisão humana de decisões automatizadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contestacao,
});

const motivos = [
  "Informação incorreta",
  "Dados desatualizados",
  "Resultado injusto",
  "Não reconheço esta decisão",
  "Quero entender como a decisão foi tomada",
  "Outro",
];

function Contestacao() {
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState(motivos[0]!);
  const [details, setDetails] = useState("");
  const [protocol, setProtocol] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="surface-card glow-ring p-8 text-center">
          <ShieldQuestion className="mx-auto size-12 text-primary" />
          <h1 className="mt-4 font-sans text-xl font-semibold">Solicitação enviada</h1>
          <p className="mt-2 font-mono text-sm text-primary">{protocol}</p>
          <div className="mt-3 flex justify-center">
            <StatusPill tone="warning">Aguardando análise humana</StatusPill>
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sua contestação foi registrada e será analisada por um responsável autorizado. A
            decisão não será considerada definitivamente encerrada enquanto a revisão estiver
            pendente, quando aplicável ao processo.
          </p>
        </div>

        <Panel title="Acompanhamento">
          <Timeline
            steps={["Contestação enviada", "Triagem", "Revisão humana", "Resultado"]}
            current={0}
          />
        </Panel>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setSent(false)}>
            Nova contestação
          </Button>
          <Button asChild className="flex-1">
            <Link to="/app">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Contestar uma decisão"
        description="Se você acredita que uma decisão automatizada foi incorreta, injusta ou inadequadamente aplicada ao seu caso, pode solicitar uma revisão."
      />

      <Panel title="Decisão contestada">
        <dl className="space-y-2 text-sm">
          {[
            ["Protocolo", "SNT-2026-002104"],
            ["Data", "02/08/2026"],
            ["Tipo de decisão", "Classificação automatizada de ocorrência"],
            ["Resultado", "Registro classificado como não prioritário"],
            ["Motivo informado pelo sistema", "Baixa correspondência com padrões confirmados na região"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 border-b border-border pb-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Por que você deseja contestar esta decisão?">
        <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
          {motivos.map((m) => (
            <label key={m} className="flex items-center gap-3 text-sm text-muted-foreground">
              <RadioGroupItem value={m} id={m} />
              <Label htmlFor={m} className="cursor-pointer font-normal">
                {m}
              </Label>
            </label>
          ))}
        </RadioGroup>
      </Panel>

      <Panel title="Explique o problema">
        <Textarea rows={5} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Descreva por que você considera a decisão inadequada." />
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground hover:border-primary/50">
          <Paperclip className="size-4 text-primary" /> Anexar documentos
          <input type="file" className="hidden" />
        </label>
      </Panel>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button className="w-full" disabled={loading} onClick={async () => {
        setError(""); setLoading(true);
        try { const result = await addCitizenContestFn({ data: { reason, details } }); setProtocol(result.protocol); setSent(true); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar a contestação."); }
        finally { setLoading(false); }
      }}>
        {loading ? "Enviando..." : "Solicitar revisão humana"}
      </Button>

      <Disclaimer>
        Decisões automatizadas que afetam seu atendimento podem sempre ser explicadas e revisadas
        por uma pessoa responsável.
      </Disclaimer>
    </div>
  );
}
