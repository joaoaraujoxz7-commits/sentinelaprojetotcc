import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Disclaimer } from "@/components/sentinela/ui-kit";
import { TacticalMap } from "@/components/sentinela/tactical-map";
import { MapFilters } from "@/components/sentinela/filters";

export const Route = createFileRoute("/org/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa tático de ocorrências — Sentinela Institucional" },
      {
        name: "description",
        content: "Mapa escuro com ocorrências, zonas de previsão, áreas de concentração e filtros avançados.",
      },
      { property: "og:title", content: "Mapa tático — Sentinela" },
      { property: "og:description", content: "Ocorrências, zonas de previsão e concentração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrgMapa,
});

function OrgMapa() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa de Segurança"
        description="Clique em um ponto para abrir o detalhamento da ocorrência."
      />
      <MapFilters />
      <Panel>
        <TacticalMap />
      </Panel>
      <Disclaimer>
        Informações pessoais não são exibidas no mapa. Localizações permanecem aproximadas mesmo
        no acesso institucional.
      </Disclaimer>
    </div>
  );
}
