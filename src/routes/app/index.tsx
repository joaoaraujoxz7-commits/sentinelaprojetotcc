import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Panel, StatCard, Disclaimer, PageHeader, LumiaCard, StatusPill } from "@/components/sentinela/ui-kit";
import { TrendChart, BarsChart } from "@/components/sentinela/charts";
import { Button } from "@/components/ui/button";
import { citizenDashboardFn, myCitizenAlertsFn } from "@/lib/records";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Início — Painel da população | Sentinela" }] }),
  component: CitizenHome,
});

type CitizenStats = Awaited<ReturnType<typeof citizenDashboardFn>>;

function CitizenHome() {
  const { user } = getRouteApi("/app").useRouteContext();
  const firstName = user.name.split(/\s+/)[0];
  const [stats, setStats] = useState<CitizenStats | null>(null);
  const [alerts, setAlerts] = useState<Array<{ id: string; text: string; status: string }>>([]);
  useEffect(() => { void Promise.all([citizenDashboardFn(), myCitizenAlertsFn()]).then(([dashboard, notices]) => { setStats(dashboard); setAlerts(notices.slice(0, 3)); }); }, []);
  const monthly = stats?.monthly ?? [];
  const weekdays = stats?.weekdays ?? [];
  const hours = stats?.hours ?? [];
  const hasData = (stats?.recent ?? 0) > 0;
  const situation = !hasData ? "Normal" : (stats?.recent ?? 0) >= 15 ? "Alerta" : (stats?.recent ?? 0) >= 5 ? "Atenção" : "Normal";

  return <div className="space-y-6">
    <PageHeader title={`Olá, ${firstName}`} description="Indicadores reais de segurança calculados para a sua região." action={<Button asChild><Link to="/app/registrar">Registrar ocorrência</Link></Button>} />
    <div className="grid gap-4 md:grid-cols-3">
      <Panel><p className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4 text-primary" /> Sua região</p><p className="mt-2 font-sans text-lg font-semibold">{user.neighborhood ?? "Salvador"} · {user.city} — {user.state}</p></Panel>
      <Panel className="md:col-span-2"><p className="text-xs uppercase tracking-wider text-muted-foreground">Situação da região</p><div className="mt-2"><StatusPill tone={situation === "Alerta" ? "danger" : situation === "Atenção" ? "warning" : "success"}>{situation}</StatusPill></div><p className="mt-3 text-xs text-muted-foreground">Classificação informativa baseada no volume agregado recente. Não é certeza de ocorrência nem avaliação de pessoas.</p></Panel>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Ocorrências recentes" value={String(stats?.recent ?? 0)} delta="Últimos 30 dias na região" />
      <StatCard label="Ocorrências confirmadas" value={String(stats?.confirmed ?? 0)} tone="success" delta={`${stats?.confirmationRate ?? 0}% do total`} />
      <StatCard label="Horário de maior concentração" value={stats?.peakHour ?? "Sem dados"} />
      <StatCard label="Dia de maior concentração" value={stats?.peakDay ?? "Sem dados"} />
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Evolução dos últimos 3 meses" className="lg:col-span-2">{monthly.some((item) => item.ocorrencias > 0) ? <TrendChart data={monthly} /> : <EmptyChart />}</Panel>
      <Panel title="Horários de maior concentração">{hours.some((item) => item.ocorrencias > 0) ? <BarsChart data={hours} xKey="hora" height={220} /> : <EmptyChart />}</Panel>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Dias de maior concentração">{weekdays.some((item) => item.ocorrencias > 0) ? <BarsChart data={weekdays} xKey="dia" height={220} /> : <EmptyChart />}</Panel>
      <Panel title="Mapa resumido da região"><div className="relative h-36 overflow-hidden rounded-xl border bg-secondary/30"><div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "28px 28px" }} /><div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-sm ${hasData ? "size-24" : "size-10"}`} /><MapPin className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-primary" /><span className="absolute bottom-2 left-3 text-xs text-muted-foreground">{stats?.region ?? user.neighborhood ?? user.city}</span></div><Button asChild size="sm" variant="secondary" className="mt-4"><Link to="/app/mapa">Abrir mapa interativo</Link></Button></Panel>
    </div>
    <div className="grid gap-4 lg:grid-cols-2"><LumiaCard message="Posso explicar os indicadores, previsões e como solicitar uma revisão humana em linguagem simples." /><Panel title="Alertas recentes">{alerts.length ? <div className="space-y-3">{alerts.map((alert) => <Link key={alert.id} to="/app/alertas" className="block rounded-lg border p-3 text-sm hover:border-primary/50"><p>{alert.text}</p><span className="mt-1 block text-xs text-muted-foreground">{alert.status}</span></Link>)}</div> : <p className="py-5 text-sm text-muted-foreground">Você não possui atualizações recentes.</p>}</Panel></div>
    <Disclaimer>Os valores são agregados por região e não revelam informações pessoais ou endereços exatos de outros usuários.</Disclaimer>
  </div>;
}

function EmptyChart() { return <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">Os dados aparecerão após o primeiro registro na sua região.</p>; }
