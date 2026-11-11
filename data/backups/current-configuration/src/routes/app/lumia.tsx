import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { Lumia } from "@/components/brand";
import { Panel, Disclaimer } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

const answers: Record<string, string> = {
  "Por que essa região está em atenção?":
    "A região aparece em atenção porque houve aumento de registros nas últimas semanas, com concentração entre 20h e 23h, principalmente às sextas e sábados. Isso indica um padrão observado nos dados — não uma certeza sobre eventos futuros.",
  "Como o Sentinela chegou a essa previsão?":
    "A previsão combina histórico de ocorrências confirmadas, registros enviados pela população, faixa de horário, dia da semana e tendência dos últimos 3 meses. Cada fator tem um peso, que você pode ver na tela de explicação da previsão.",
  "O que significa 78% de confiabilidade?":
    "78% é o nível de confiança que o modelo tem no próprio resultado, considerando a quantidade e a qualidade dos dados disponíveis. Não significa que há 78% de chance de uma ocorrência acontecer.",
  "Como posso contestar uma decisão?":
    "Acesse Contestação, selecione a decisão, informe o motivo e envie. A solicitação recebe protocolo e passa por triagem e revisão humana antes de qualquer conclusão definitiva.",
};

type Msg = { from: "lumia" | "user"; text: string };

function LumiaChat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "lumia",
      text: "Olá! Sou a LumIA. Posso explicar indicadores, previsões e procedimentos do Sentinela em linguagem simples.",
    },
  ]);
  const [input, setInput] = useState("");

  function ask(q: string) {
    if (!q.trim()) return;
    const a =
      answers[q] ??
      "Posso explicar indicadores, previsões, níveis de confiabilidade e o processo de contestação. Lembrando: eu nunca afirmo que uma pessoa é criminosa nem que uma ocorrência acontecerá com certeza.";
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
