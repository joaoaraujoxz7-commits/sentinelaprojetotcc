import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, ConfidenceBar, Disclaimer, StatusPill } from "@/components/sentinela/ui-kit";
import { explanationFactors } from "@/components/sentinela/data";
import { Button } from "@/components/ui/button";
import { Lumia } from "@/components/brand";

export const Route = createFileRoute("/org/previsoes/explicacao")({
  head: () => ({
    meta: [
      { title: "Por que o Sentinela gerou esta previsão? — Explicabilidade" },
      {
        name: "description",
        content: "Fatores de contribuição, confiabilidade estimada e como interpretar corretamente uma previsão.",
      },
      { property: "og:title", content: "Explicação da previsão — Sentinela" },
      { property: "og:description", content: "Transparência sobre os fatores usados pelo modelo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explicacao,
});

function Explicacao() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Por que o Sentinela gerou esta previsão?"
        description="Região Centro · período de 26/08 a 01/09/2026"
        action={<StatusPill tone="danger">Nível de atenção: Alto</StatusPill>}
      />

      <Panel title="Confiabilidade estimada">
        <p className="font-sans text-4xl font-semibold text-primary">78%</p>
        <div className="mt-4">
          <ConfidenceBar value={78} />
        </div>
      </Panel>

      <Panel title="Fatores que contribuíram" subtitle="Peso relativo de cada fator no resultado">
        <ul className="space-y-4">
          {explanationFactors.map((f) => (
            <li key={f.fator}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{f.fator}</span>
                <span className="text-foreground">{f.peso}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="brand-gradient h-full rounded-full" style={{ width: `${f.peso * 2.6}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Como interpretar esta previsão?">
        <p className="text-sm leading-relaxed text-muted-foreground">
          A previsão representa uma estimativa baseada em padrões encontrados nos dados
          disponíveis. Ela não determina que uma ocorrência acontecerá e não deve ser utilizada
          isoladamente para tomar decisões contra indivíduos.
        </p>
      </Panel>

      <div className="surface-card glow-ring flex items-center gap-4 p-5">
        <Lumia size={60} />
        <div className="flex-1">
          <p className="font-sans text-sm font-semibold text-primary">LumIA explica</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Posso detalhar cada fator e mostrar quais dados foram usados nesta estimativa.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link to="/app/lumia">Perguntar à LumIA</Link>
          </Button>
        </div>
      </div>

      <Disclaimer>
        Registros de consulta a esta explicação são armazenados no log de auditoria para garantir
        rastreabilidade.
      </Disclaimer>
    </div>
  );
}
