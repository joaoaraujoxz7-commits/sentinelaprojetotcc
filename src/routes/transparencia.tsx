import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, MessageSquareWarning, Scale, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Disclaimer, PageHeader, Panel, StatCard } from "@/components/sentinela/ui-kit";
import { publicTransparencyFn } from "@/lib/records";

export const Route = createFileRoute("/transparencia")({ component: Transparencia });
type Stats = Awaited<ReturnType<typeof publicTransparencyFn>>;

function Transparencia() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { void publicTransparencyFn().then(setStats); }, []);
  return <main className="min-h-screen bg-background px-5 py-8"><div className="mx-auto max-w-6xl space-y-6"><div className="flex items-center justify-between"><Logo /><Button asChild variant="secondary"><Link to="/acesso">Acessar o Sentinela</Link></Button></div><PageHeader title="Transparência do Sentinela" description="Indicadores públicos sobre análises, revisões, contestações, correções e mecanismos de proteção." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><StatCard label="Análises realizadas" value={String(stats?.analyses ?? 0)} /><StatCard label="Revisões humanas" value={String(stats?.humanReviews ?? 0)} /><StatCard label="Contestações recebidas" value={String(stats?.contests ?? 0)} tone="warning" /><StatCard label="Decisões corrigidas" value={String(stats?.corrections ?? 0)} tone="success" /><StatCard label="Alertas de possível disparidade" value={String(stats?.biasAlerts ?? 0)} tone="warning" /><StatCard label="Medidas de mitigação" value={String(stats?.mitigations ?? 0)} tone="success" /></div>
    <Panel title="Como protegemos contra decisões injustas?"><div className="grid gap-4 md:grid-cols-4"><Pillar icon={Eye} title="Transparência" text="Origem, período, qualidade e limitações dos dados podem ser consultados." /><Pillar icon={Scale} title="Explicabilidade" text="Resultados relevantes apresentam fatores e interpretação acessível." /><Pillar icon={MessageSquareWarning} title="Contestação" text="O cidadão pode questionar resultados e anexar evidências." /><Pillar icon={ShieldCheck} title="Revisão humana" text="Pessoas autorizadas analisam decisões sensíveis e registram o resultado." /></div></Panel>
    <Panel title="Limitações conhecidas">{stats?.limitations.length ? <div className="grid gap-3 md:grid-cols-2">{stats.limitations.map((item, index) => <div key={`${item.title}-${index}`} className="rounded-lg border p-4"><p className="font-semibold">{item.title}</p><p className="mt-2 text-sm text-muted-foreground">{item.details}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma limitação específica foi registrada. Permanecem aplicáveis riscos de subnotificação, cobertura desigual, desatualização e diferenças na fiscalização.</p>}</Panel>
    <Disclaimer>Os números são agregados diretamente do banco e não expõem dados pessoais. Indicadores estatísticos não classificam indivíduos nem comprovam causalidade ou discriminação.</Disclaimer></div></main>;
}
function Pillar({ icon: Icon, title, text }: { icon: typeof Eye; title: string; text: string }) { return <div className="rounded-xl border p-4"><Icon className="size-5 text-primary" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p></div>; }
