import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Crosshair, Paperclip } from "lucide-react";
import { PageHeader, Panel, Timeline, Disclaimer } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addCitizenOccurrenceFn } from "@/lib/records";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/registrar")({
  head: () => ({
    meta: [
      { title: "Registrar ocorrência — Sentinela" },
      {
        name: "description",
        content: "Registre uma ocorrência em poucos passos e ajude o Sentinela a compreender os padrões da região.",
      },
      { property: "og:title", content: "Registrar ocorrência — Sentinela" },
      { property: "og:description", content: "Fluxo simples de registro com revisão e protocolo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Registrar,
});

const tipos = ["Furto", "Roubo", "Violência", "Dano", "Ameaça", "Acidente", "Outros"];

function Registrar() {
  const [stage, setStage] = useState<"form" | "review" | "done">("form");
  const [tipo, setTipo] = useState("Furto");
  const [region, setRegion] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState(new Date().toTimeString().slice(0, 5));
  const [details, setDetails] = useState("");
  const [protocol, setProtocol] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [priority, setPriority] = useState("Normal");
  const [contactAuthorized, setContactAuthorized] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [evidence, setEvidence] = useState<{ name: string; type: string; data: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; city?: string; state?: string } | null>(null);

  async function resolveManualLocation() {
    const query = region.trim(); if (!query) throw new Error("Informe o bairro, cidade ou local aproximado.");
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&addressdetails=1&q=${encodeURIComponent(query)}`, { headers: { "Accept-Language": "pt-BR" } });
    if (!response.ok) throw new Error("Não foi possível pesquisar esse local.");
    const [place] = await response.json() as Array<{ lat: string; lon: string; display_name: string; address?: Record<string, string> }>;
    if (!place) throw new Error("Local não encontrado no Brasil. Informe também a cidade e o estado.");
    setRegion(place.display_name); setCoordinates({ latitude: Number(place.lat), longitude: Number(place.lon), city: place.address?.city ?? place.address?.town ?? place.address?.municipality, state: place.address?.state });
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setError("Este navegador não oferece localização."); return; }
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => { setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        try { const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${coords.latitude}&lon=${coords.longitude}`, { headers: { "Accept-Language": "pt-BR" } }); const place = await response.json() as { display_name?: string; address?: Record<string, string> }; setRegion(place.display_name ?? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`); setCoordinates({ latitude: coords.latitude, longitude: coords.longitude, city: place.address?.city ?? place.address?.town ?? place.address?.municipality, state: place.address?.state }); } catch { setRegion(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`); } setLocating(false); },
      () => { setError("Não foi possível acessar sua localização. Verifique a permissão do navegador."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  if (stage === "done") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="surface-card glow-ring flex flex-col items-center p-8 text-center">
          <CheckCircle2 className="size-14 text-success" />
          <h1 className="mt-4 font-sans text-xl font-semibold">Ocorrência registrada com sucesso</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Guarde seu protocolo para acompanhar o andamento.
          </p>
          <p className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 font-mono text-sm text-primary">
            {protocol}
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild variant="secondary">
              <Link to="/app">Voltar ao início</Link>
            </Button>
            <Button asChild>
              <Link to="/app/ocorrencias">Ver minhas ocorrências</Link>
            </Button>
          </div>
        </div>
        <Panel title="Próximas etapas">
          <Timeline
            steps={["Registro", "Análise", "Validação", "Encaminhamento", "Encerramento"]}
            current={0}
          />
        </Panel>
      </div>
    );
  }

  if (stage === "review") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <PageHeader title="Revisar antes de enviar" description="Confira as informações do seu relato." />
        <Panel>
          <dl className="space-y-3 text-sm">
            {[
              ["Tipo", tipo],
              ["Local", region],
              ["Data e horário", `${new Date(`${eventDate}T12:00:00`).toLocaleDateString("pt-BR")} · ${eventTime}`],
              ["Descrição", details || "Sem descrição adicional."],
              ["Prioridade", priority],
              ["Evidência", evidence?.name ?? "Nenhuma"],
              ["Contato posterior", contactAuthorized ? "Autorizado" : "Não autorizado"],
              ["Registro anônimo", anonymous ? "Sim" : "Não"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 border-b border-border pb-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setStage("form")}>
            Editar
          </Button>
          <Button className="flex-1" disabled={submitting} onClick={async () => {
            setSubmitting(true); setError("");
            try {
              const result = await addCitizenOccurrenceFn({ data: {
                title: tipo, region, eventDate, eventTime, details, priority,
                evidenceName: evidence?.name, evidenceType: evidence?.type, evidenceData: evidence?.data,
                contactAuthorized, anonymous,
                latitude: coordinates?.latitude, longitude: coordinates?.longitude, city: coordinates?.city, state: coordinates?.state,
              } });
              setProtocol(result.protocol); setStage("done");
            } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar a ocorrência."); }
            finally { setSubmitting(false); }
          }}>
            {submitting ? "Enviando..." : "Enviar ocorrência"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Registrar ocorrência"
        description="Seu relato pode ajudar o Sentinela a compreender melhor os padrões da região."
      />

      <Panel title="Tipo de ocorrência">
        <div className="flex flex-wrap gap-2">
          {tipos.map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={
                t === tipo
                  ? "rounded-full border border-primary bg-primary/15 px-3 py-1.5 text-xs text-primary"
                  : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              }
            >
              {t}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Local">
        <Button type="button" variant="secondary" className="w-full" onClick={useCurrentLocation} disabled={locating}>
          <Crosshair className="size-4" /> {locating ? "Obtendo localização..." : "Utilizar minha localização"}
        </Button>
        <p className="my-3 text-center text-xs text-muted-foreground">ou</p>
        <Input value={region} onChange={(event) => { setRegion(event.target.value); setCoordinates(null); }} placeholder="Informe bairro, cidade e estado" />
      </Panel>

      <Panel title="Data e horário">
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} aria-label="Data" />
          <Input type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} aria-label="Horário" />
        </div>
      </Panel>

      <Panel title="Descrição">
        <Textarea rows={5} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Descreva o que aconteceu, sem incluir dados pessoais de terceiros." />
      </Panel>

      <Panel title="Evidências" subtitle="Imagem, vídeo ou documento (opcional)">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center transition-colors hover:border-primary/50">
          <Paperclip className="size-5 text-primary" />
          <span className="text-xs text-muted-foreground">{evidence ? evidence.name : "Toque para anexar arquivos (máximo 5 MB)"}</span>
          <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { setError("A evidência deve ter no máximo 5 MB."); event.target.value = ""; return; }
            const reader = new FileReader();
            reader.onload = () => setEvidence({ name: file.name, type: file.type || "application/octet-stream", data: String(reader.result) });
            reader.onerror = () => setError("Não foi possível ler o arquivo selecionado.");
            reader.readAsDataURL(file);
          }} />
        </label>
      </Panel>

      <Panel title="Identificação">
        <div className="space-y-3 text-xs text-muted-foreground">
          <label className="flex items-start gap-3">
            <Checkbox checked={contactAuthorized} onCheckedChange={(checked) => { const enabled = checked === true; setContactAuthorized(enabled); if (enabled) setAnonymous(false); }} /> Autorizo que meus dados sejam utilizados para contato
            posterior sobre este registro.
          </label>
          <label className="flex items-start gap-3">
            <Checkbox checked={anonymous} onCheckedChange={(checked) => { const enabled = checked === true; setAnonymous(enabled); if (enabled) setContactAuthorized(false); }} /> Prefiro registrar de forma anônima.
          </label>
        </div>
      </Panel>

      <div className="space-y-3">
        <Label className="sr-only">Enviar</Label>
        <Select value={priority.toLowerCase()} onValueChange={(value) => setPriority(value === "urgente" ? "Urgente" : "Normal")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Prioridade: normal</SelectItem>
            <SelectItem value="urgente">Prioridade: urgente</SelectItem>
          </SelectContent>
        </Select>
        <Button className="w-full" disabled={locating} onClick={async () => { if (!region.trim()) { setError("Informe o bairro ou local aproximado."); return; } setError(""); setLocating(true); try { if (!coordinates) await resolveManualLocation(); setStage("review"); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível localizar o endereço."); } finally { setLocating(false); } }}>
          {locating ? "Localizando..." : "Revisar ocorrência"}
        </Button>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      </div>

      <Disclaimer>
        Em situações de emergência, acione imediatamente os serviços de atendimento oficiais. O
        Sentinela não substitui o atendimento emergencial.
      </Disclaimer>
    </div>
  );
}
