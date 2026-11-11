import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Database, Gauge, MessageCircle, ShieldAlert } from "lucide-react";
import { Lumia } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Disclaimer, PageHeader, Panel, StatCard } from "@/components/sentinela/ui-kit";
import { listRecordsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/org/lumia")({
  beforeLoad: ({ context }) => { if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" }); },
  component: LumiaAgent,
});

const questions = ["Por que esta área foi sinalizada?", "Quais dados foram utilizados?", "Quais são as limitações?", "Existe algum alerta de viés?", "Posso utilizar este resultado para uma decisão?"];

function LumiaAgent() {
  const [predictions, setPredictions] = useState<ManagedRecord[]>([]);
  const [alerts, setAlerts] = useState<ManagedRecord[]>([]);
  const [quality, setQuality] = useState<ManagedRecord[]>([]);
  const [question, setQuestion] = useState(questions[0]);
  useEffect(() => { void Promise.all([listRecordsFn({ data: { kind: "predictions" } }), listRecordsFn({ data: { kind: "bias_alerts" } }), listRecordsFn({ data: { kind: "data_quality" } })]).then(([p, a, q]) => { setPredictions(p); setAlerts(a); setQuality(q); }); }, []);
  const activePrediction = predictions.find((item) => !/conclu|encerr/i.test(item.status)) ?? predictions[0];
  const activeAlerts = alerts.filter((item) => !/conclu|encerr/i.test(item.status));
  const response = useMemo(() => answer(question, activePrediction, activeAlerts, quality), [question, activePrediction, activeAlerts, quality]);
  const confidence = activePrediction?.confidence ?? 0;

  return <div className="space-y-5"><PageHeader title="LumIA — Assistente de Transparência" description="Interprete previsões, dados, limitações e alertas sem substituir sua avaliação profissional." />
    <div className="grid gap-5 xl:grid-cols-[1fr_2fr]"><Panel><div className="flex flex-col items-center text-center"><Lumia size={120} /><h2 className="mt-3 font-semibold text-primary">Como posso ajudar?</h2><p className="mt-2 text-sm text-muted-foreground">Selecione uma pergunta sobre os dados disponíveis.</p></div><div className="mt-5 space-y-2">{questions.map((item) => <Button key={item} variant={question === item ? "default" : "secondary"} className="h-auto w-full justify-start whitespace-normal py-3 text-left" onClick={() => setQuestion(item)}><MessageCircle className="size-4 shrink-0" />{item}</Button>)}</div></Panel>
      <div className="space-y-5"><Panel title={question} subtitle="Resposta baseada nos registros institucionais disponíveis."><div className="flex gap-4"><Lumia size={58} /><p className="text-sm leading-relaxed text-muted-foreground">{response}</p></div></Panel><div className="grid gap-4 sm:grid-cols-2"><StatCard label="Dados utilizados" value={String(predictions.length)} hint="Previsões institucionais disponíveis para consulta." /><StatCard label="Período" value={activePrediction?.eventDate ?? "Sem dados"} hint={activePrediction?.eventTime || "Período não informado"} /><StatCard label="Confiabilidade" value={`${confidence}%`} hint="Consistência estimada do modelo; não é probabilidade de crime." /><StatCard label="Alertas" value={String(activeAlerts.length)} tone={activeAlerts.length ? "warning" : "success"} hint="Possíveis disparidades ainda não encerradas." /></div></div></div>
    <Panel title="Contexto da análise atual"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Context icon={Database} label="Dados" value="Ocorrências agregadas e fontes autorizadas" /><Context icon={CalendarDays} label="Período" value={activePrediction?.eventTime || activePrediction?.eventDate || "Não informado"} /><Context icon={Gauge} label="Confiabilidade" value={`${confidence}%`} /><Context icon={AlertTriangle} label="Limitações" value={quality.length ? `${quality.length} verificações registradas` : "Sem verificação cadastrada"} /><Context icon={ShieldAlert} label="Alertas" value={`${activeAlerts.length} ativos`} /></div></Panel>
    <Disclaimer>A LumIA auxilia na interpretação. Ela não autoriza abordagens, não classifica pessoas e não substitui análise contextual, justificativa e responsabilidade humana.</Disclaimer>
  </div>;
}

function answer(question: string, prediction: ManagedRecord | undefined, alerts: ManagedRecord[], quality: ManagedRecord[]) {
  if (question.startsWith("Por que")) return prediction ? `A área ${prediction.region} foi sinalizada pelo registro “${prediction.title}”, com base em padrões agregados descritos pelo modelo: ${prediction.details || "sem detalhamento adicional"}. O resultado não representa certeza.` : "Não existe previsão cadastrada para explicar neste momento.";
  if (question.startsWith("Quais dados")) return "O Sentinela utiliza ocorrências confirmadas e agregadas, distribuição temporal e geográfica e fontes institucionais autorizadas. Dados pessoais ou características protegidas não devem gerar risco individual.";
  if (question.startsWith("Quais são")) return quality.length ? `Existem ${quality.length} verificações de qualidade registradas. Dados históricos podem refletir diferenças de registro, atualização, cobertura e fiscalização, por isso a previsão possui incerteza.` : "Os dados podem apresentar subnotificação, cobertura desigual, atraso de atualização ou mudanças na forma de registro. Essas limitações precisam ser consideradas.";
  if (question.startsWith("Existe")) return alerts.length ? `Sim. Existem ${alerts.length} alertas ativos de possível disparidade. Consulte a tela Alertas de disparidade e solicite revisão antes de qualquer uso sensível.` : "Não há alerta ativo cadastrado, mas isso não elimina a necessidade de verificar contexto, qualidade e limitações.";
  return "O resultado pode apoiar o planejamento, mas não deve ser usado isoladamente para abordar pessoas ou tomar decisões sensíveis. Consulte os dados, verifique alertas e registre uma justificativa humana.";
}

function Context({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) { return <div className="rounded-lg border p-3"><Icon className="size-4 text-primary" /><p className="mt-2 text-xs font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{value}</p></div>; }
