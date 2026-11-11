import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Disclaimer } from "@/components/sentinela/ui-kit";
import { TacticalMap } from "@/components/sentinela/tactical-map";
import { MapFilters, defaultMapFilters, type MapFilterState } from "@/components/sentinela/filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  const [place, setPlace] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [filters, setFilters] = useState<MapFilterState>(defaultMapFilters);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa de Segurança"
        description="Clique em um ponto para abrir o detalhamento da ocorrência."
      />
      <Panel title="Pesquisar local do Brasil" subtitle="Busque uma cidade, bairro, estado ou local de referência."><form className="flex gap-3" onSubmit={async (event) => { event.preventDefault(); const query = place.trim(); if (!query) return; setSearching(true); setMessage(""); try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`, { headers: { "Accept-Language": "pt-BR" } }); const [result] = await response.json() as Array<{ lon: string; lat: string; display_name: string }>; if (!result) throw new Error("Local não encontrado no Brasil."); setCoordinates([Number(result.lon), Number(result.lat)]); setMessage(`Exibindo ${result.display_name}`); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível pesquisar."); } finally { setSearching(false); } }}><Input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Ex.: Goiânia — GO ou Recife — PE" /><Button disabled={searching}>{searching ? "Pesquisando..." : "Pesquisar"}</Button></form>{message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}</Panel>
      <MapFilters value={filters} onChange={setFilters} />
      <Panel>
        <TacticalMap filters={filters} focusCoordinates={coordinates} />
      </Panel>
      <Disclaimer>
        Informações pessoais não são exibidas no mapa. Localizações permanecem aproximadas mesmo
        no acesso institucional.
      </Disclaimer>
    </div>
  );
}
