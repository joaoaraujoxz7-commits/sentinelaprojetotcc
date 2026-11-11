import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Panel, StatusPill, Timeline } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { myCitizenOccurrencesFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/app/ocorrencias")({
  head: () => ({
    meta: [
      { title: "Minhas ocorrências — Sentinela" },
      {
        name: "description",
        content: "Acompanhe o protocolo, o status e a linha do tempo das ocorrências que você registrou.",
      },
      { property: "og:title", content: "Minhas ocorrências — Sentinela" },
      { property: "og:description", content: "Protocolo, status e linha do tempo dos seus registros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MinhasOcorrencias,
});

const tone: Record<string, string> = {
  Recebida: "neutral",
  "Em análise": "warning",
  Confirmada: "info",
  Validação: "info",
  Encaminhada: "info",
  Encerrada: "success",
};

function MinhasOcorrencias() {
  const [open, setOpen] = useState<string | null>(null);
  const [items, setItems] = useState<Array<ManagedRecord & { protocol: string }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { myCitizenOccurrencesFn().then(setItems).finally(() => setLoading(false)); }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Minhas ocorrências" description="Registros enviados por você." />

      <div className="space-y-4">
        {items.map((o) => (
          <Panel key={o.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-primary">{o.protocolo}</p>
                <p className="mt-1 font-sans text-base font-semibold">{o.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(`${o.eventDate}T12:00:00`).toLocaleDateString("pt-BR")} · {o.region}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill tone={tone[o.status] ?? "neutral"}>{o.status}</StatusPill>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setOpen(open === o.id ? null : o.id)}
                >
                  {open === o.id ? "Fechar" : "Abrir"}
                </Button>
              </div>
            </div>

            {open === o.id && (
              <div className="mt-5 border-t border-border pt-5">
                <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Linha do tempo
                </p>
                <Timeline
                  steps={["Registro", "Análise", "Validação", "Encaminhamento", "Encerramento"]}
                  current={o.status === "Encerrada" ? 4 : o.status === "Encaminhada" ? 3 : o.status === "Validação" || o.status === "Confirmada" ? 2 : o.status === "Em análise" ? 1 : 0}
                />
              </div>
            )}
          </Panel>
        ))}
        {!loading && items.length === 0 && <Panel><p className="text-sm text-muted-foreground">Você ainda não registrou nenhuma ocorrência.</p></Panel>}
        {loading && <p className="text-sm text-muted-foreground">Carregando suas ocorrências...</p>}
      </div>
    </div>
  );
}
