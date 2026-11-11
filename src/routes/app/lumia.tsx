import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Lumia } from "@/components/brand";
import { Panel, Disclaimer } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { citizenDecisionRecordsFn, myCitizenAlertsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/app/lumia")({
  head: () => ({
    meta: [
      { title: "LumIA — Assistente de Inteligência do Sentinela" },
      {
        name: "description",
        content: "Converse com a LumIA para entender indicadores, previsões, confiabilidade e contestações.",
      },
      { property: "og:title", content: "LumIA — Assistente do Sentinela" },
      { property: "og:description", content: "Explicações simples sobre dados e previsões de segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LumiaChat,
});

const suggestions = [
  "Por que essa região está em atenção?",
  "Como o Sentinela chegou a essa previsão?",
  "O que significa 78% de confiabilidade?",
  "Como posso contestar uma decisão?",
];

type Msg = { from: "lumia" | "user"; text: string };

function LumiaChat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "lumia",
      text: "Olá! Sou a LumIA. Posso explicar indicadores, previsões e procedimentos do Sentinela em linguagem simples.",
    },
  ]);
  const [input, setInput] = useState("");
  const [records, setRecords] = useState<Array<ManagedRecord & { kind: string }>>([]);
  const [alerts, setAlerts] = useState<Array<{ kind: string; status: string }>>([]);
  useEffect(() => { void Promise.all([citizenDecisionRecordsFn(), myCitizenAlertsFn()]).then(([items, notices]) => { setRecords(items); setAlerts(notices); }); }, []);

  function ask(q: string) {
    if (!q.trim()) return;
    const a = answer(q, records, alerts);
    setMsgs((m) => [...m, { from: "user", text: q }, { from: "lumia", text: a }]);
    setInput("");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="surface-card flex items-center gap-4 p-5">
        <Lumia size={64} />
        <div>
          <h1 className="font-sans text-xl font-semibold text-primary">LumIA</h1>
          <p className="text-xs text-muted-foreground">Assistente de Inteligência do Sentinela</p>
        </div>
      </div>

      <Panel className="min-h-[22rem]">
        <div className="space-y-4">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-3", m.from === "user" && "flex-row-reverse")}
            >
              {m.from === "lumia" && <Lumia size={32} glow={false} />}
              <p
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                  m.from === "lumia"
                    ? "border border-border bg-secondary/60 text-foreground"
                    : "bg-primary/15 text-foreground",
                )}
              >
                {m.text}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
          Exemplos de perguntas
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte à LumIA…"
        />
        <Button type="submit" aria-label="Enviar">
          <Send className="size-4" />
        </Button>
      </form>

      <Disclaimer>
        A LumIA explica estimativas e procedimentos. Ela nunca afirma que uma pessoa é criminosa
        nem que uma ocorrência acontecerá com certeza.
      </Disclaimer>
    </div>
  );
}

function answer(question: string, records: Array<ManagedRecord & { kind: string }>, alerts: Array<{ kind: string; status: string }>) {
  const prediction = records.find((item) => item.kind === "prediction");
  if (question === "Por que essa região está em atenção?") return prediction ? `A região ${prediction.region} possui a previsão “${prediction.title}”, registrada em ${prediction.eventDate}, com confiabilidade estimada de ${prediction.confidence}%. Isso indica um padrão agregado nos dados e não uma certeza sobre eventos futuros.` : "Não há previsão disponível para sua consulta neste momento.";
  if (question === "Como o Sentinela chegou a essa previsão?") return prediction ? `A previsão disponível considera registros agregados, período, distribuição geográfica e a fonte ${prediction.source}. Detalhes informados: ${prediction.details || "nenhum detalhe adicional"}. Ela não classifica pessoas.` : "Ainda não existe previsão cadastrada para explicar. Você pode consultar suas ocorrências e os dados da região normalmente.";
  if (question.includes("confiabilidade")) return prediction ? `${prediction.confidence}% é a confiabilidade informada para a previsão atual. Ela mede a consistência estimada do modelo diante dos dados disponíveis; não significa ${prediction.confidence}% de chance de uma ocorrência acontecer.` : "Confiabilidade mede a consistência estimada de uma análise, não a probabilidade de um crime nem o risco atribuído a uma pessoa.";
  if (question.includes("contestar")) return `Acesse Contestação, selecione o registro, informe o motivo e, se desejar, anexe uma evidência. Você possui ${alerts.filter((item) => item.kind === "contest").length} atualização(ões) de contestação nos Alertas.`;
  return `Posso explicar indicadores, previsões e contestações usando os registros disponíveis. Atualmente existem ${records.length} resultados acessíveis e ${alerts.length} atualizações no seu painel. Nunca considero uma previsão como certeza nem classifico pessoas.`;
}
