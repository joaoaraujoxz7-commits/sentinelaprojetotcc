import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Timeline, ConfidenceBar, StatusPill, Disclaimer } from "@/components/sentinela/ui-kit";
import { explanationFactors } from "@/components/sentinela/data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/org/contestacoes/revisao")({
  head: () => ({
    meta: [
      { title: "Revisão humana de decisão automatizada — Sentinela" },
      {
        name: "description",
        content: "Analise dados, explicação da IA e histórico para manter, alterar ou cancelar uma decisão automatizada.",
      },
      { property: "og:title", content: "Revisão humana — Sentinela" },
      { property: "og:description", content: "Decisão auditável com justificativa obrigatória." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Revisao,
});

const opcoes = ["Manter decisão", "Alterar decisão", "Cancelar decisão", "Solicitar mais informações"];

function Revisao() {
  const [done, setDone] = useState(false);
  const [escolha, setEscolha] = useState(opcoes[1]!);

  if (done) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Resultado da revisão humana" description="Protocolo CT-2026-0147" />

        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Decisão automatizada">
            <p className="text-sm">Registro classificado como não prioritário</p>
            <div className="mt-3">
              <ConfidenceBar value={54} label="Confiabilidade do modelo" />
            </div>
            <StatusPill tone="warning" className="mt-3">
              Contestada
            </StatusPill>
          </Panel>
          <Panel title="Decisão após revisão humana">
            <p className="text-sm">{escolha}: registro reclassificado como prioritário</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Justificativa: dados complementares apresentados pelo cidadão confirmam a
              recorrência no local.
            </p>
            <StatusPill tone="success" className="mt-3">
              Revisão concluída
            </StatusPill>
          </Panel>
        </div>

        <Panel title="Registro da revisão">
          <dl className="space-y-2 text-sm">
            {[
              ["Responsável", "Auditor R. Mendes — matrícula SSP-330219"],
              ["Data", "26/08/2026"],
              ["Protocolo", "CT-2026-0147"],
              ["Resultado", escolha],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Linha do tempo">
          <Timeline steps={["Contestação enviada", "Triagem", "Revisão humana", "Resultado"]} current={3} />
        </Panel>

        <Button variant="secondary" onClick={() => setDone(false)}>
          Voltar à revisão
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revisão da contestação CT-2026-0147"
        description="Cidadã M. S. · recebida em 25/08/2026 · prioridade alta"
        action={<StatusPill tone="warning">Aguardando revisão</StatusPill>}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Dados da decisão">
          <dl className="space-y-2 text-sm">
            {[
              ["Protocolo original", "SNT-2026-002104"],
              ["Tipo de decisão", "Classificação automatizada"],
              ["Resultado", "Não prioritário"],
              ["Motivo do sistema", "Baixa correspondência com padrões confirmados"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Dados utilizados">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Histórico de ocorrências confirmadas na região (12 meses)",
              "Registro enviado pela população em 02/08/2026",
              "Faixa horária e dia da semana do relato",
              "Tendência agregada dos últimos 3 meses",
            ].map((d) => (
              <li key={d} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                {d}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Explicação da IA" subtitle="Fatores considerados na decisão contestada">
        <div className="mb-4">
          <ConfidenceBar value={54} />
        </div>
        <ul className="space-y-3">
          {explanationFactors.slice(0, 4).map((f) => (
            <li key={f.fator}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{f.fator}</span>
                <span>{f.peso}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="brand-gradient h-full" style={{ width: `${f.peso * 2.6}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Histórico">
        <Timeline
          steps={[
            "Decisão automatizada gerada — 02/08/2026",
            "Cidadã solicitou explicação — 20/08/2026",
            "Contestação registrada — 25/08/2026",
            "Triagem concluída — 25/08/2026",
            "Revisão humana em andamento",
          ]}
          current={4}
        />
      </Panel>

      <Panel title="Área de revisão humana">
        <RadioGroup value={escolha} onValueChange={setEscolha} className="space-y-2">
          {opcoes.map((o) => (
            <label key={o} className="flex items-center gap-3 text-sm text-muted-foreground">
              <RadioGroupItem value={o} id={o} />
              <Label htmlFor={o} className="cursor-pointer font-normal">
                {o}
              </Label>
            </label>
          ))}
        </RadioGroup>

        <div className="mt-5 space-y-2">
          <Label htmlFor="just">Justificativa da decisão humana (obrigatória)</Label>
          <Textarea
            id="just"
            rows={4}
            defaultValue="Dados complementares apresentados pela cidadã confirmam recorrência no local."
          />
        </div>

        <Button className="mt-4" onClick={() => setDone(true)}>
          Finalizar revisão
        </Button>
      </Panel>

      <Disclaimer>
        A justificativa e o resultado desta revisão são registrados no log de auditoria e ficam
        disponíveis ao cidadão que apresentou a contestação.
      </Disclaimer>
    </div>
  );
}
