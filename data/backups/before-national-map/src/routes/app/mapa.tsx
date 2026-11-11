import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Disclaimer } from "@/components/sentinela/ui-kit";
import { TacticalMap } from "@/components/sentinela/tactical-map";
import { MapFilters } from "@/components/sentinela/filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  const [place, setPlace] = useState("");
  const [searchedPlace, setSearchedPlace] = useState("");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa de Segurança"
        description="Toque em um ponto para ver detalhes da ocorrência. Localizações são aproximadas."
      />
      <Panel title="Pesquisar local do Brasil" subtitle="Informe uma cidade, bairro ou estado para identificar a área que deseja consultar.">
        <form className="flex gap-3" onSubmit={(event) => { event.preventDefault(); setSearchedPlace(place.trim()); }}><Input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Ex.: Recife — PE, Manaus — AM ou Salvador — BA" aria-label="Local do Brasil" /><Button type="submit">Pesquisar</Button></form>
        {searchedPlace && <p className="mt-3 text-sm text-muted-foreground">Exibindo os dados disponíveis próximos de <strong className="text-foreground">{searchedPlace}</strong>. Quando não houver registros nessa localidade, o mapa permanecerá sem área de calor.</p>}
      </Panel>
      <MapFilters />
      <Panel>
        <TacticalMap focusLocation={searchedPlace} />
      </Panel>
      <Disclaimer>
        Para preservar a privacidade, o mapa não exibe endereços exatos nem informações pessoais
        de quem registrou uma ocorrência.
      </Disclaimer>
    </div>
  );
}
