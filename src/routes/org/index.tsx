import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, StatCard, Disclaimer } from "@/components/sentinela/ui-kit";
import { TrendChart, BarsChart, DonutChart, ChartLegend } from "@/components/sentinela/charts";
import { Button } from "@/components/ui/button";
import { listRecordsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/org/")({
  head: () => ({ meta: [{ title: "Dashboard operacional — Sentinela Institucional" }] }),
  component: OrgDashboard,
});

type DashboardData = { occurrences: ManagedRecord[]; predictions: ManagedRecord[]; notifications: ManagedRecord[]; contests: ManagedRecord[]; biasAlerts: ManagedRecord[] };
const empty: DashboardData = { occurrences: [], predictions: [], notifications: [], contests: [], biasAlerts: [] };

function OrgDashboard() {
  const { user } = getRouteApi("/org").useRouteContext();
  const [data, setData] = useState(empty);
  useEffect(() => { void Promise.all([
    listRecordsFn({ data: { kind: "occurrences" } }), listRecordsFn({ data: { kind: "predictions" } }),
    listRecordsFn({ data: { kind: "notifications" } }), listRecordsFn({ data: { kind: "contests" } }), listRecordsFn({ data: { kind: "bias_alerts" } }),
  ]).then(([occurrences, predictions, notifications, contests, biasAlerts]) => setData({ occurrences, predictions, notifications, contests, biasAlerts })); }, []);

  const metrics = useMemo(() => calculateDashboard(data), [data]);
  return <div className="space-y-6">
    <PageHeader title={user.institutionalType === "agent" ? "Dashboard do agente policial" : "Dashboard de auditoria"} description={`${user.institution ?? "Órgão público"} — ${user.city} · ${user.state}`} action={user.institutionalType === "auditor" ? <Button asChild variant="secondary"><Link to="/org/relatorios">Gerenciar relatórios</Link></Button> : <Button asChild variant="secondary"><Link to="/org/patrulhamentos">Registrar patrulhamento</Link></Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardLink to={user.institutionalType === "agent" ? "/org/ocorrencias" : "/org/auditoria"} label="Abrir registros relacionados"><StatCard label="Ocorrências (30 dias)" value={String(metrics.recent.length)} /></DashboardLink>
      <DashboardLink to={user.institutionalType === "agent" ? "/org/ocorrencias" : "/org/auditoria"} label="Abrir ocorrências confirmadas"><StatCard label="Confirmadas" value={String(metrics.confirmed)} tone="success" delta={percent(metrics.confirmed, metrics.recent.length)} /></DashboardLink>
      <DashboardLink to={user.institutionalType === "agent" ? "/org/populacao" : "/org/auditoria"} label="Abrir registros da população"><StatCard label="Origem população" value={String(metrics.population)} delta={percent(metrics.population, metrics.recent.length)} /></DashboardLink>
      <DashboardLink to={user.institutionalType === "agent" ? "/org/ocorrencias" : "/org/auditoria"} label="Abrir registros policiais"><StatCard label="Origem registros policiais" value={String(metrics.police)} delta={percent(metrics.police, metrics.recent.length)} /></DashboardLink>
      <DashboardLink to="/org/previsoes" label="Abrir previsões"><StatCard label="Confiabilidade média das previsões" value={`${metrics.predictionConfidence}%`} hint="Média das previsões cadastradas no banco." /></DashboardLink>
      <DashboardLink to="/org/previsoes" label="Abrir áreas em atenção"><StatCard label="Áreas em atenção" value={String(metrics.attentionAreas)} tone="warning" /></DashboardLink>
      <DashboardLink to="/org/notificacoes" label="Abrir alertas ativos"><StatCard label="Alertas ativos" value={String(metrics.activeAlerts)} tone="danger" /></DashboardLink>
      <DashboardLink to={user.institutionalType === "auditor" ? "/org/contestacoes" : "/org/notificacoes"} label="Abrir contestações pendentes"><StatCard label="Contestações pendentes" value={String(metrics.pendingContests)} tone="warning" /></DashboardLink>
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Evolução das ocorrências (3 meses)" className="xl:col-span-2"><ChartOrEmpty empty={metrics.monthly.every((item) => item.ocorrencias === 0)}><TrendChart data={metrics.monthly} height={260} /></ChartOrEmpty></Panel>
      <Panel title="Distribuição por tipo"><ChartOrEmpty empty={metrics.byType.length === 0}><DonutChart data={metrics.byType} nameKey="tipo" height={190} /><ChartLegend items={metrics.byType.map((item) => ({ label: String(item.tipo), value: String(item.valor) }))} /></ChartOrEmpty></Panel>
    </div>
    {user.institutionalType === "agent" && <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <Panel title="Mapa operacional resumido" subtitle="Concentração histórica agregada de ocorrências; não representa locais ou pessoas criminosas." action={<Button asChild size="sm" variant="secondary"><Link to="/org/mapa">Abrir mapa completo</Link></Button>}>
        {metrics.riskRegions.length === 0 ? <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">O mapa resumido aparecerá após registros com região.</p> : <div className="grid min-h-48 grid-cols-2 gap-3 rounded-xl border border-border bg-background/40 p-4 sm:grid-cols-3 lg:grid-cols-4">{metrics.riskRegions.map((item, index) => <Link key={item.region} to="/org/mapa" className={`flex min-h-20 flex-col justify-between rounded-xl border p-3 transition hover:border-primary ${index === 0 ? "border-warning/60 bg-warning/10" : index < 3 ? "border-primary/40 bg-primary/8" : "border-border bg-secondary/30"}`}><span className="text-xs font-semibold">{item.region}</span><span className="mt-3 text-xs text-muted-foreground">{item.total} ocorrências</span></Link>)}</div>}
      </Panel>
      <Panel title="Alertas importantes" subtitle="Itens que merecem atenção antes de uma decisão.">{metrics.importantAlerts.length === 0 ? <p className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">Nenhum alerta ativo.</p> : <div className="space-y-3">{metrics.importantAlerts.slice(0, 5).map((item) => <Link key={`${item.kind}-${item.id}`} to={item.kind === "bias" ? "/org/alertas-vies" : "/org/notificacoes"} className="block rounded-lg border p-3 transition hover:border-primary/50"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.details || item.status}</p></Link>)}</div>}</Panel>
    </div>}
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel title="Ocorrências por dia da semana"><ChartOrEmpty empty={metrics.weekdays.every((item) => item.ocorrencias === 0)}><BarsChart data={metrics.weekdays} xKey="dia" /></ChartOrEmpty></Panel>
      <Panel title="Horários de maior concentração"><ChartOrEmpty empty={metrics.hours.every((item) => item.ocorrencias === 0)}><BarsChart data={metrics.hours} xKey="hora" /></ChartOrEmpty></Panel>
      <Panel title="Origem das ocorrências"><ChartOrEmpty empty={metrics.bySource.length === 0}><DonutChart data={metrics.bySource} nameKey="origem" height={190} /><ChartLegend items={metrics.bySource.map((item) => ({ label: String(item.origem), value: String(item.valor) }))} /></ChartOrEmpty></Panel>
    </div>
    <Disclaimer>Todos os números acima são calculados diretamente das tabelas do banco de dados. Nenhum valor demonstrativo é exibido.</Disclaimer>
  </div>;
}

function calculateDashboard(data: DashboardData) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const recent = data.occurrences.filter((item) => !item.eventDate || new Date(`${item.eventDate}T12:00:00`) >= cutoff);
  const confirmed = recent.filter((item) => {
    const status = item.status.toLocaleLowerCase("pt-BR");
    return status.includes("confirm") || status === "validação" || status === "validacao";
  }).length;
  const population = recent.filter((item) => item.source.toLowerCase().includes("popula")).length;
  const police = recent.filter((item) => item.source.toLowerCase().includes("polic")).length;
  const predictionConfidence = data.predictions.length ? Math.round(data.predictions.reduce((sum, item) => sum + item.confidence, 0) / data.predictions.length) : 0;
  const attentionAreas = new Set(data.predictions.filter((item) => !isClosed(item.status)).map((item) => item.region)).size;
  const activeAlerts = data.notifications.filter((item) => !isClosed(item.status)).length;
  const pendingContests = data.contests.filter((item) => !isClosed(item.status)).length;
  const count = (items: ManagedRecord[], key: (item: ManagedRecord) => string) => Object.entries(items.reduce<Record<string, number>>((acc, item) => { const value = key(item) || "Não informado"; acc[value] = (acc[value] ?? 0) + 1; return acc; }, {}));
  const byType = count(recent, (item) => item.title).map(([tipo, valor]) => ({ tipo, valor }));
  const bySource = count(recent, (item) => item.source).map(([origem, valor]) => ({ origem, valor }));
  const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekdays = weekdayNames.map((dia, index) => ({ dia, ocorrencias: recent.filter((item) => item.eventDate && new Date(`${item.eventDate}T12:00:00`).getDay() === index).length }));
  const hourLabels = ["00h", "04h", "08h", "12h", "16h", "20h"];
  const hours = hourLabels.map((hora, index) => ({ hora, ocorrencias: recent.filter((item) => item.eventTime && Math.floor(Number(item.eventTime.slice(0, 2)) / 4) === index).length }));
  const now = new Date();
  const monthly = Array.from({ length: 3 }, (_, offset) => { const date = new Date(now.getFullYear(), now.getMonth() - (2 - offset), 1); const month = date.toLocaleDateString("pt-BR", { month: "short" }); return { mes: month, ocorrencias: data.occurrences.filter((item) => { const event = new Date(`${item.eventDate}T12:00:00`); return event.getFullYear() === date.getFullYear() && event.getMonth() === date.getMonth(); }).length }; });
  const riskRegions = count(recent, (item) => item.region).map(([region, total]) => ({ region, total })).sort((a, b) => b.total - a.total).slice(0, 8);
  const importantAlerts = [...data.biasAlerts.filter((item) => !isClosed(item.status)).map((item) => ({ ...item, kind: "bias" as const })), ...data.notifications.filter((item) => !isClosed(item.status)).map((item) => ({ ...item, kind: "notification" as const }))].sort((a, b) => `${b.eventDate}${b.eventTime}`.localeCompare(`${a.eventDate}${a.eventTime}`));
  return { recent, confirmed, population, police, predictionConfidence, attentionAreas, activeAlerts, pendingContests, byType, bySource, weekdays, hours, monthly, riskRegions, importantAlerts };
}

function isClosed(status: string) { return ["concluído", "concluída", "encerrado", "encerrada", "cancelado", "cancelada"].includes(status.toLowerCase()); }
function percent(value: number, total: number) { return total ? `${Math.round(value / total * 100)}% do total` : "0% do total"; }
function ChartOrEmpty({ empty, children }: { empty: boolean; children: React.ReactNode }) { return empty ? <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">Os dados aparecerão após o primeiro cadastro.</p> : <>{children}</>; }
function DashboardLink({ to, label, children }: { to: string; label: string; children: React.ReactNode }) { return <Link to={to} aria-label={label} className="block rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&>*]:h-full">{children}</Link>; }
