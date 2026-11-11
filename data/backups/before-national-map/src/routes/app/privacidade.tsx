import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader, Panel, Disclaimer, LumiaCard } from "@/components/sentinela/ui-kit";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e Transparência — Sentinela" },
      {
        name: "description",
        content: "Quais dados o Sentinela coleta, como são usados, quem acessa e como pedir revisão ou contestar.",
      },
      { property: "og:title", content: "Privacidade e Transparência — Sentinela" },
      { property: "og:description", content: "Ciclo de dados: coleta, tratamento, análise, previsão e auditoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacidade,
});

const faq = [
  {
    q: "Quais dados são coletados?",
    a: "Identificação básica de conta, contato, endereço aproximado e os relatos de ocorrência que você registra, além de registros públicos autorizados fornecidos por órgãos.",
  },
  {
    q: "Para que são utilizados?",
    a: "Para análise agregada de padrões de segurança, encaminhamento de ocorrências e comunicação sobre seus registros. Não são utilizados para atribuir suspeita a indivíduos.",
  },
  {
    q: "Quem pode acessá-los?",
    a: "Usuários institucionais autorizados, com acesso registrado em log de auditoria. Dados agregados podem ser compartilhados de forma não identificável.",
  },
  {
    q: "Por quanto tempo são armazenados?",
    a: "Relatos ficam disponíveis enquanto o processo estiver ativo e por período legal de guarda. Dados analíticos são mantidos de forma agregada.",
  },
  {
    q: "Como posso solicitar revisão?",
    a: "Pela tela de Contestação você solicita revisão humana de qualquer decisão automatizada que afete seu atendimento.",
  },
  {
    q: "Como posso contestar uma decisão?",
    a: "Selecione a decisão, informe o motivo, anexe documentos se desejar e envie. Você receberá um protocolo e acompanhará cada etapa.",
  },
];

const cycle = ["Coleta", "Tratamento", "Análise", "Previsão", "Auditoria"];

function Privacidade() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Privacidade e Transparência"
        description="Como o Sentinela trata dados e como você mantém controle sobre eles."
      />

      <Panel title="Ciclo dos dados">
        <div className="flex flex-wrap items-center gap-2">
          {cycle.map((c, i) => (
            <div key={c} className="flex items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary">
                {c}
              </span>
              {i < cycle.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          O sistema evita o uso indiscriminado de dados pessoais: as análises trabalham com
          informações agregadas e localizações aproximadas sempre que possível.
        </p>
      </Panel>

      <Panel title="Perguntas frequentes">
        <Accordion type="single" collapsible className="w-full">
          {faq.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-sm">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link to="/app/contestacao">Contestar uma decisão</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/app/configuracoes">Gerenciar permissões</Link>
        </Button>
      </div>

      <LumiaCard
        title="LumIA explica"
        message="Posso detalhar em linguagem simples qualquer item desta página, inclusive o que é dado agregado."
      />

      <Disclaimer>
        O Sentinela não utiliza características pessoais sensíveis para gerar previsões nem para
        direcionar ações contra indivíduos.
      </Disclaimer>
    </div>
  );
}
