import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { heatmapDataFn } from "@/lib/records";
import { cn } from "@/lib/utils";

type HeatPoint = { region: string; count: number; longitude: number; latitude: number };
type HeatFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { region: string; count: number };
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

export function TacticalMap({ className, compact = false }: { className?: string; compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [-38.438, -12.94],
      zoom: compact ? 9.4 : 10.5,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "Tiles © Esri",
          },
          labels: {
            type: "raster",
            tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            attribution: "Esri, HERE, Garmin, OpenStreetMap contributors",
          },
        },
        layers: [
          { id: "satellite", type: "raster", source: "satellite" },
          { id: "labels", type: "raster", source: "labels" },
        ],
      },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.on("load", async () => {
      try {
        const points = await heatmapDataFn() as HeatPoint[];
        if (cancelled) return;
        const data: HeatFeatureCollection = {
          type: "FeatureCollection",
          features: points.map((point) => ({
            type: "Feature",
            properties: { region: point.region, count: point.count },
            geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
          })),
        };
        map.addSource("occurrences-heat", { type: "geojson", data });
        map.addLayer({
          id: "occurrences-heat",
          type: "heatmap",
          source: "occurrences-heat",
          maxzoom: 19,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "count"], 0, 0, 1, 0.35, 5, 0.75, 15, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 14, 2.2],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)", 0.18, "rgba(34,197,94,0.35)",
              0.38, "rgba(132,204,22,0.60)", 0.58, "rgba(250,204,21,0.75)",
              0.78, "rgba(249,115,22,0.85)", 1, "rgba(239,68,68,0.95)",
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 30, 12, 55, 16, 85],
            "heatmap-opacity": 0.9,
          },
        });
        setTotal(points.reduce((sum, point) => sum + point.count, 0));
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as ocorrências.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    mapRef.current = map;
    return () => { cancelled = true; map.remove(); mapRef.current = null; };
  }, [compact]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-background", compact ? "h-56" : "h-[520px]", className)}>
      <div ref={containerRef} className="size-full" aria-label="Mapa de calor interativo das ocorrências em Salvador" />
      {!compact && (
        <div className="pointer-events-none absolute bottom-8 left-3 z-10 w-52 rounded-lg border border-border bg-card/90 p-3 text-[11px] shadow-lg backdrop-blur">
          <p className="font-medium text-foreground">Concentração de ocorrências</p>
          <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500" />
          <div className="mt-1 flex justify-between text-muted-foreground"><span>Menor</span><span>Maior</span></div>
          {!loading && !error && <p className="mt-2 text-muted-foreground">{total} ocorrência{total === 1 ? "" : "s"} no banco</p>}
        </div>
      )}
      {(loading || error || (!loading && total === 0)) && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-lg border border-border bg-card/90 px-3 py-2 text-xs shadow-lg backdrop-blur">
          {loading ? "Carregando mapa de calor..." : error || "O mapa de calor aparecerá quando houver ocorrências cadastradas."}
        </div>
      )}
    </div>
  );
}
