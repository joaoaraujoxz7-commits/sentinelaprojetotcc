import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Disclaimer } from "@/components/sentinela/ui-kit";
import { TacticalMap } from "@/components/sentinela/tactical-map";
import { MapFilters } from "@/components/sentinela/filters";

export const Route = createFileRoute("/app/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa de Segurança — Sentinela" },
      {
        name: "description",
        content: "Mapa escuro com ocorrências, áreas de atenção e zonas de maior concentração da sua região.",
      },
      { property: "og:title", content: "Mapa de Segurança — Sentinela" },
      { property: "og:description", content: "Ocorrências, áreas de atenção e filtros no mapa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapaPopulacao,
});

function MapaPopulacao() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa de Segurança"
        description="Toque em um ponto para ver detalhes da ocorrência. Localizações são aproximadas."
      />
      <MapFilters />
      <Panel>
        <TacticalMap />
      </Panel>
      <Disclaimer>
        Para preservar a privacidade, o mapa não exibe endereços exatos nem informações pessoais
        de quem registrou uma ocorrência.
      </Disclaimer>
    </div>
  );
}
