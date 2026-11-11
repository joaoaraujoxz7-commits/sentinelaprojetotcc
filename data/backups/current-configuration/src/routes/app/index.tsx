import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Panel, StatCard, Disclaimer, PageHeader } from "@/components/sentinela/ui-kit";
import { TrendChart, BarsChart } from "@/components/sentinela/charts";
import { Button } from "@/components/ui/button";
import { citizenDashboardFn } from "@/lib/records";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Início — Painel da população | Sentinela" }] }),
  component: CitizenHome,
});

type CitizenStats = Awaited<ReturnType<typeof citizenDashboardFn>>;

function CitizenHome() {
  const { user } = getRouteApi("/app").useRouteContext();
  const firstName = user.name.split(/\s+/)[0];
  const [stats, setStats] = useState<CitizenStats | null>(null);
  useEffect(() => { void citizenDashboardFn().then(setStats); }, []);
  const monthly = stats?.monthly ?? [];
  const weekdays = stats?.weekdays ?? [];
  const hours = stats?.hours ?? [];
  const hasData = (stats?.recent ?? 0) > 0;

  return <div className="space-y-6">
    <PageHeader title={`Olá, ${firstName}`} description="Indicadores reais de segurança calculados para a sua região." action={<Button asChild><Link to="/app/registrar">Registrar ocorrência</Link></Button>} />
    <div className="grid gap-4 md:grid-cols-3">
      <Panel><p className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="size-4 text-primary" /> Sua região</p><p className="mt-2 font-sans text-lg font-semibold">{user.neighborhood ?? "Salvador"} · {user.city} — {user.state}</p></Panel>
      <Panel className="md:col-span-2"><p className="text-xs uppercase tracking-wider text-muted-foreground">Situação da região</p><p className="mt-2 font-sans text-2xl font-semibold text-primary">{hasData ? "Dados disponíveis" : "Aguardando registros"}</p><p className="mt-2 text-xs text-muted-foreground">O painel não exibe valores demonstrativos. Os indicadores aparecem quando registros reais forem cadastrados.</p></Panel>
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
      <Panel title="Mapa da região"><p className="text-sm text-muted-foreground">Consulte o mapa para visualizar a distribuição geográfica disponível.</p><Button asChild size="sm" variant="secondary" className="mt-4"><Link to="/app/mapa">Abrir mapa</Link></Button></Panel>
    </div>
    <Disclaimer>Os valores são agregados por região e não revelam informações pessoais ou endereços exatos de outros usuários.</Disclaimer>
  </div>;
}

function EmptyChart() { return <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">Os dados aparecerão após o primeiro registro na sua região.</p>; }
